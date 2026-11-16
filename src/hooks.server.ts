import type { Handle } from '@sveltejs/kit/hooks';
import { sequence } from '@sveltejs/kit/hooks';
import { eq, sql } from 'drizzle-orm';
import { SESSION_COOKIE, validateSession, setSessionCookie, deleteSessionCookie } from '$lib/server/auth/session';
import { db, schema as s } from '$lib/server/db/client';

const securityHeaders: Record<string, string> = {
	'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
	'Cross-Origin-Opener-Policy': 'same-origin',
	'Cross-Origin-Resource-Policy': 'same-site',
	'X-Permitted-Cross-Domain-Policies': 'none'
};

/** 1) Sesión: solo se consulta la BD si existe la cookie (las páginas públicas no pagan este costo). */
const authenticate: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	event.locals.session = null;
	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const result = await validateSession(token);
		if (result) {
			event.locals.user = result.user;
			event.locals.session = result.session;
			if (result.refreshed) setSessionCookie(event.cookies, token, result.session.expiresAt);
		} else {
			deleteSessionCookie(event.cookies);
		}
	}
	return resolve(event);
};

/** 2) Redirecciones 301 de URLs antiguas (tabla redirects, sembrada desde _meta/urls.csv). */
const legacyRedirects: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	if (response.status !== 404 || event.request.method !== 'GET') return response;
	let path = event.url.pathname;
	if (!path.endsWith('/')) path += '/';
	const rows = await db
		.select({ to: s.redirects.toPath, code: s.redirects.statusCode })
		.from(s.redirects)
		.where(eq(s.redirects.fromPath, path))
		.limit(1);
	const hit = rows[0];
	if (!hit) return response;
	event.platform?.ctx?.waitUntil(
		db.update(s.redirects).set({ hits: sql`${s.redirects.hits} + 1` }).where(eq(s.redirects.fromPath, path)).then(() => {})
	);
	return new Response(null, { status: hit.code, headers: { Location: hit.to + event.url.search } });
};

/** 3) Cabeceras de seguridad (la CSP con nonce la añade SvelteKit, ver vite.config.ts). */
const headers: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	const isMedia = event.url.pathname.startsWith('/media/');
	for (const [k, v] of Object.entries(securityHeaders)) {
		if (!response.headers.has(k)) response.headers.set(k, v);
	}
	if (event.url.pathname.startsWith('/admin')) {
		response.headers.set('Cache-Control', 'no-store');
		response.headers.set('X-Robots-Tag', 'noindex, nofollow');
	} else if (!isMedia && !response.headers.has('Cache-Control') && event.request.method === 'GET') {
		response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
	}
	return response;
};

/**
 * 4) Guardia del panel: deny-by-default para todo /admin/**. Sin sesión → login; sesión sin MFA → MFA.
 * Además, cada load/action vuelve a verificar permisos con requirePermission() (defensa en profundidad).
 */
const AUTH_PATHS = ['/admin/login/', '/admin/mfa/', '/admin/mfa/configurar/', '/admin/salir/'];
const adminGuard: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	if (!path.startsWith('/admin')) return resolve(event);
	const normalized = path.endsWith('/') ? path : path + '/';
	const isAuthPath = AUTH_PATHS.includes(normalized);
	const { user, session } = event.locals;
	const isGet = event.request.method === 'GET' || event.request.method === 'HEAD';

	const deny = (to: string) =>
		isGet
			? new Response(null, { status: 303, headers: { Location: to } })
			: new Response('No autorizado', { status: 401 });

	if (!user) {
		if (normalized === '/admin/login/') return resolve(event);
		const next = encodeURIComponent(event.url.pathname + event.url.search);
		return deny(`/admin/login/?next=${next}`);
	}
	if (!session?.mfaVerifiedAt) {
		const target = user.mfaEnabled ? '/admin/mfa/' : '/admin/mfa/configurar/';
		if (normalized === target || normalized === '/admin/salir/') return resolve(event);
		return deny(target);
	}
	if (isAuthPath && normalized !== '/admin/salir/' && isGet) {
		return new Response(null, { status: 303, headers: { Location: '/admin/' } });
	}
	return resolve(event);
};

/**
 * 0) Caché de HTML público en el borde (60 s) para visitantes anónimos. Nunca para /admin, sesiones,
 * vistas previas ni respuestas con cookies. CSP en modo hash → seguro de cachear.
 */
const edgeCache: Handle = async ({ event, resolve }) => {
	const cache = event.platform?.caches?.default;
	const p = event.url.pathname;
	const cacheable =
		cache &&
		event.request.method === 'GET' &&
		!p.startsWith('/admin') &&
		!p.startsWith('/media/') &&
		!event.cookies.get(SESSION_COOKIE) &&
		!event.url.searchParams.has('preview');
	if (!cacheable) return resolve(event);
	const key = new Request(event.url.toString(), { method: 'GET' });
	const hit = await cache.match(key);
	if (hit) {
		const res = new Response(hit.body, hit);
		res.headers.set('X-Edge-Cache', 'HIT');
		return res;
	}
	const res = await resolve(event);
	if (res.status === 200 && !res.headers.has('set-cookie') && /s-maxage=\d+/.test(res.headers.get('cache-control') ?? '')) {
		event.platform?.ctx?.waitUntil(cache.put(key, res.clone()));
	}
	return res;
};

export const handle = sequence(headers, edgeCache, legacyRedirects, authenticate, adminGuard);
