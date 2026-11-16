import { fail, redirect } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { verifyPassword, DUMMY_HASH } from '$lib/server/auth/password';
import { createSession } from '$lib/server/auth/session';
import { rateLimit } from '$lib/server/security/ratelimit';
import { verifyTurnstile } from '$lib/server/security/turnstile';
import { hashIp } from '$lib/server/security/crypto';
import { audit } from '$lib/server/security/audit';
import { PUBLIC_MFA_REQUIRED } from '$app/env/public';

const GENERIC = 'Credenciales inválidas o cuenta bloqueada temporalmente.';
const schema = z.object({ email: z.string().trim().toLowerCase().email().max(160), password: z.string().min(1).max(256) });

export const load: PageServerLoad = async () => ({});

export const actions: Actions = {
	default: async (event) => {
		const ip = event.getClientAddress();
		const ipKey = await hashIp(ip);
		const form = await event.request.formData();
		const email = String(form.get('email') ?? '').slice(0, 160);

		// Rate limit por IP y por cuenta (ataques distribuidos)
		if (!(await rateLimit(`login-ip:${ipKey}`, 5, 60)) || !(await rateLimit(`login-acct:${email.toLowerCase()}`, 10, 900))) {
			return fail(429, { email, error: 'Demasiados intentos. Espera un momento antes de volver a intentar.' });
		}
		if (!(await verifyTurnstile(form.get('cf-turnstile-response'), ip))) {
			return fail(400, { email, error: 'No pudimos verificar el desafío anti-bot. Recarga la página.' });
		}
		const parsed = schema.safeParse({ email, password: form.get('password') });
		if (!parsed.success) {
			// Error de formato (campo vacío o correo inválido): no revela si la cuenta existe
			return fail(400, { email, error: 'Ingresa un correo válido y tu contraseña. Si usaste autocompletar del navegador, haz clic en cada campo antes de continuar.' });
		}

		const [user] = await db.select().from(s.users).where(eq(s.users.email, parsed.data.email)).limit(1);
		const ok = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, parsed.data.password);
		const locked = !!user?.lockedUntil && user.lockedUntil > new Date();

		if (!user || !ok || locked || !user.active) {
			if (user && !locked) {
				const attempts = user.failedAttempts + 1;
				// 5 fallos → bloqueo 15 min, exponencial en fallos posteriores
				const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60_000 * 2 ** Math.min(attempts - 5, 5)) : null;
				await db.update(s.users).set({ failedAttempts: attempts, lockedUntil }).where(eq(s.users.id, user.id));
			}
			event.locals.user = null;
			await audit(event, 'auth.login_failed', 'user', user?.id ?? null, { email: parsed.data.email, locked });
			return fail(400, { email, error: GENERIC });
		}

		await db
			.update(s.users)
			.set({ failedAttempts: 0, lockedUntil: null, lastLoginAt: sql`now()` })
			.where(eq(s.users.id, user.id));
		// Demo: con PUBLIC_MFA_REQUIRED=false la sesión queda verificada solo con contraseña
		await createSession(event, user.id, !PUBLIC_MFA_REQUIRED);
		event.locals.user = { id: user.id, email: user.email, name: user.name, role: user.role, mfaEnabled: user.mfaEnabled };
		await audit(event, PUBLIC_MFA_REQUIRED ? 'auth.password_ok' : 'auth.login', 'user', user.id, PUBLIC_MFA_REQUIRED ? undefined : { method: 'password' });

		const next = event.url.searchParams.get('next');
		const safeNext = next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin/';
		if (!PUBLIC_MFA_REQUIRED) redirect(303, safeNext);
		const target = user.mfaEnabled ? '/admin/mfa/' : '/admin/mfa/configurar/';
		redirect(303, `${target}?next=${encodeURIComponent(safeNext)}`);
	}
};
