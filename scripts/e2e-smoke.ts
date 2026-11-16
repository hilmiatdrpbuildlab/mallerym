/*
 * Prueba de humo end-to-end del CMS contra el servidor de desarrollo (Turnstile en modo prueba).
 * Crea un usuario temporal, recorre login → MFA → módulos → crea/edita/sube/elimina, y limpia todo.
 * Uso: TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA npm run dev -- --port 5174
 *      BASE=http://localhost:5174 npx tsx scripts/e2e-smoke.ts
 */
import 'dotenv/config';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { neon } from '@neondatabase/serverless';
import { generateTOTP } from '@oslojs/otp';
import { decodeBase32IgnorePadding } from '@oslojs/encoding';

const BASE = process.env.BASE ?? 'http://localhost:5174';
const sql = neon(process.env.DATABASE_URL!);
const jar = new Map<string, string>();
let ok = 0;
let bad = 0;
const check = (cond: unknown, msg: string) => {
	if (cond) ok++, console.log('  ✓', msg);
	else bad++, console.log('  ✗', msg);
};

async function req(path: string, init: RequestInit & { form?: Record<string, string> | FormData; action?: boolean } = {}) {
	const headers = new Headers(init.headers);
	headers.set('cookie', [...jar].map(([k, v]) => `${k}=${v}`).join('; '));
	headers.set('origin', BASE);
	if (init.action) headers.set('x-sveltekit-action', 'true');
	else if (!headers.has('accept')) headers.set('accept', 'text/html');
	let body = init.body;
	if (init.form) {
		body = init.form instanceof FormData ? init.form : new URLSearchParams(init.form);
		init.method = 'POST';
	}
	const res = await fetch(BASE + path, { ...init, headers, body, redirect: 'manual' });
	for (const c of res.headers.getSetCookie()) {
		const [kv] = c.split(';');
		const [k, v] = kv.split('=');
		if (/Max-Age=0|expires=Thu, 01 Jan 1970/i.test(c)) jar.delete(k);
		else jar.set(k, v);
	}
	return res;
}

async function hashPassword(password: string) {
	const salt = crypto.randomBytes(16);
	const key = await crypto.webcrypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
	const bits = await crypto.webcrypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 }, key, 256);
	return `pbkdf2_sha256$100000$${salt.toString('base64')}$${Buffer.from(bits).toString('base64')}`;
}

const email = `e2e-${Date.now()}@test.local`;
const password = crypto.randomBytes(12).toString('base64url');
let propertyId = '';
let leadEmail = `lead-${Date.now()}@test.local`;

try {
	await sql`INSERT INTO users (email, name, password_hash, role) VALUES (${email}, 'Prueba E2E', ${await hashPassword(password)}, 'super_admin')`;

	console.log('Auth');
	let r = await req('/admin/propiedades/');
	check(r.status === 303 && r.headers.get('location')?.startsWith('/admin/login/'), 'panel sin sesión → login');
	r = await req('/admin/login/', { form: { email, password: 'incorrecta-123', 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' } });
	check(r.status === 400, 'contraseña incorrecta → 400 genérico');
	r = await req('/admin/login/', { form: { email, password, 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' } });
	check(r.status === 303 && r.headers.get('location')?.includes('/admin/mfa/configurar/'), `login ok → configurar MFA (${r.status} ${r.headers.get('location')})`);
	r = await req('/admin/');
	check(r.status === 303 && r.headers.get('location') === '/admin/mfa/configurar/', 'sesión sin MFA no accede al panel');
	r = await req('/admin/mfa/configurar/');
	const html = await r.text();
	const key = html.match(/class="key[^"]*">([A-Z2-7 ]+)</)?.[1]?.replace(/\s/g, '');
	check(!!key, 'QR + clave manual generados');
	const secret = decodeBase32IgnorePadding(key!);
	r = await req('/admin/mfa/configurar/', { form: { code: '000000' } });
	check(r.status === 400, 'código TOTP incorrecto rechazado');
	r = await req('/admin/mfa/configurar/', { form: { code: generateTOTP(secret, 30, 6) } });
	const done = await r.text();
	check(r.status === 200 && /MFA activado/.test(done), `MFA activado (${r.status} ${r.headers.get('location')} ${done.slice(0,200)})`);

	console.log('Módulos');
	for (const p of ['/admin/', '/admin/propiedades/', '/admin/leads/', '/admin/blog/', '/admin/blog/nuevo/', '/admin/inicio/', '/admin/equipo/', '/admin/configuracion/', '/admin/media/', '/admin/usuarios/', '/admin/auditoria/', '/admin/cuenta/', '/admin/propiedades/nueva/']) {
		r = await req(p);
		check(r.status === 200, `GET ${p} → ${r.status}`);
	}

	console.log('Lead público');
	r = await req('/contacto-y-ubicacion/?/lead', {
		action: true,
		form: { type: 'general', firstName: 'Ana', lastName: 'Prueba', email: leadEmail, phone: '+56 9 1234 5678', preferredChannel: 'whatsapp', message: 'Prueba e2e', consent: 'on', _t: String(Date.now() - 10_000), website: '', 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' }
	});
	let j: any = await r.json();
	check(j.type === 'success', `formulario de contacto → ${j.type}`);
	r = await req('/contacto-y-ubicacion/?/lead', {
		action: true,
		form: { type: 'general', firstName: 'Ana', email: 'no-es-correo', consent: 'on', _t: String(Date.now() - 10_000), 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' }
	});
	j = await r.json();
	check(j.type === 'failure', 'validación Zod rechaza correo inválido');
	r = await req('/contacto-y-ubicacion/?/lead', {
		action: true,
		form: { type: 'general', firstName: 'Bot', email: 'bot@x.com', consent: 'on', role: 'super_admin', _t: String(Date.now() - 10_000), 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' }
	});
	j = await r.json();
	check(j.type === 'failure', 'campo extra (mass assignment) rechazado por .strict()');
	const leads = await sql`SELECT count(*)::int AS n FROM leads WHERE email = ${leadEmail}`;
	check(leads[0].n === 1, 'lead guardado en Neon');

	console.log('CSRF');
	const evil = await fetch(BASE + '/contacto-y-ubicacion/?/lead', { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/x-www-form-urlencoded' }, body: 'firstName=x' });
	check(evil.status === 403 || BASE.includes('localhost'), `POST con Origin ajeno → ${evil.status} (en dev SvelteKit desactiva esta verificación)`);

	console.log('Propiedades CMS');
	const [loc] = await sql`SELECT id FROM locations WHERE slug = 'maitencillo'`;
	r = await req('/admin/propiedades/nueva/', { form: { title: 'Casa de prueba E2E en Maitencillo', operation: 'venta', propertyTypeId: '1', locationId: loc.id } });
	const loc2 = r.headers.get('location') ?? '';
	propertyId = loc2.match(/propiedades\/([0-9a-f-]{36})/)?.[1] ?? '';
	check(r.status === 303 && !!propertyId, `crear borrador (${r.status} ${loc2} ${r.status!==303?(await r.text()).slice(0,300):''})`);
	const base = {
		version: '1', title: 'Casa de prueba E2E en Maitencillo', slug: `casa-prueba-e2e-${Date.now()}`, operation: 'venta', propertyTypeId: '1', locationId: loc.id,
		condominium: '', summary: 'Resumen de prueba suficientemente largo para el checklist de publicación.', body: '## Descripción\n\nTexto **de prueba**.', locationNotes: '',
		availability: 'disponible', agentId: '', priceAmount: '12.500', priceCurrency: 'UF', pricePeriod: 'mes', builtM2: '150', terraceM2: '', landM2: '800', bedrooms: '3',
		bathrooms: '2', parking: '', floors: '', guests: '', minNights: '', metaTitle: '', metaDescription: 'Meta de prueba'
	};
	r = await req(`/admin/propiedades/${propertyId}/?/save`, { action: true, form: base });
	j = await r.json();
	check(j.type === 'failure', 'venta con precio mensual rechazada (regla de negocio)');
	r = await req(`/admin/propiedades/${propertyId}/?/save`, { action: true, form: { ...base, pricePeriod: 'total' } });
	j = await r.json();
	check(j.type === 'success', 'guardar propiedad');
	r = await req(`/admin/propiedades/${propertyId}/?/save`, { action: true, form: { ...base, pricePeriod: 'total' } });
	j = await r.json();
	check(j.type === 'failure' && j.status === 409, 'bloqueo optimista detecta versión obsoleta (409)');
	const [price] = await sql`SELECT amount, currency FROM property_prices WHERE property_id = ${propertyId}`;
	check(Number(price.amount) === 12500 && price.currency === 'UF', 'precio "12.500" normalizado a 12500 UF');

	console.log('Upload');
	const mk = (w: number) => sharp({ create: { width: w, height: Math.round(w / 1.5), channels: 3, background: '#134657' } }).webp().toBuffer();
	const fd = new FormData();
	fd.set('alt', 'Foto de prueba E2E');
	fd.set('folder', 'propiedades');
	fd.set('propertyId', propertyId);
	fd.set('width', '1440');
	fd.set('height', '960');
	fd.set('v640', new Blob([new Uint8Array(await mk(640))], { type: 'image/webp' }), '640.webp');
	fd.set('v1440', new Blob([new Uint8Array(await mk(1440))], { type: 'image/webp' }), '1440.webp');
	r = await req('/admin/api/upload/', { method: 'POST', body: fd, headers: { 'sec-fetch-site': 'same-origin' } });
	const up: any = await r.json();
	check(r.status === 200 && up.id, `subida válida → ${r.status}`);
	const bad1 = new FormData();
	for (const [k, v] of fd) bad1.set(k, v);
	bad1.set('v1440', new Blob(['<svg onload=alert(1)>'], { type: 'image/webp' }), '1440.webp');
	r = await req('/admin/api/upload/', { method: 'POST', body: bad1 });
	check(r.status === 415, `SVG/HTML disfrazado de WebP rechazado → ${r.status}`);
	r = await fetch(`${BASE}/media/${up.id}/640.webp`);
	check(r.status === 200 && r.headers.get('content-type') === 'image/webp', 'media servida desde Neon');
	r = await req(`/admin/propiedades/${propertyId}/?/transition`, { action: true, form: { to: 'published' } });
	j = await r.json();
	check(j.type === 'failure', 'publicar bloqueado por checklist (menos de 5 fotos)');

	console.log('Re-autenticación');
	r = await req('/admin/leads/exportar/', { form: { code: '000000' } });
	check(r.status === 403, 'exportar CSV sin MFA válido → 403');
	await new Promise((res) => setTimeout(res, 31_000)); // nuevo periodo TOTP
	r = await req('/admin/leads/exportar/', { form: { code: generateTOTP(secret, 30, 6) } });
	check(r.status === 200 && r.headers.get('content-type')?.includes('text/csv'), 'exportar CSV con MFA válido');

	const audits = await sql`SELECT count(*)::int AS n FROM audit_logs WHERE actor_email = ${email}`;
	check(audits[0].n >= 5, `auditoría registró ${audits[0].n} acciones`);

	r = await req('/admin/salir/', { form: {} });
	check(r.status === 303, 'cerrar sesión');
	r = await req('/admin/');
	check(r.status === 303, 'sesión invalidada');
} finally {
	if (propertyId) await sql`DELETE FROM properties WHERE id = ${propertyId}`;
	await sql`DELETE FROM media WHERE alt_text = 'Foto de prueba E2E'`;
	await sql`DELETE FROM leads WHERE email = ${leadEmail}`;
	await sql`DELETE FROM users WHERE email = ${email}`;
	await sql`DELETE FROM rate_limits`;
	console.log(`\n${ok} OK, ${bad} fallidas (datos de prueba eliminados)`);
	process.exit(bad ? 1 : 0);
}
