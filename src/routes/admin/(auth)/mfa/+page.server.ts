import { fail, redirect } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { rotateSession } from '$lib/server/auth/session';
import { verifyTotp, hashRecoveryCode } from '$lib/server/auth/totp';
import { decryptSecret } from '$lib/server/security/crypto';
import { rateLimit } from '$lib/server/security/ratelimit';
import { audit } from '$lib/server/security/audit';

export const load: PageServerLoad = async ({ locals }) => ({ name: locals.user?.name ?? '' });

export const actions: Actions = {
	default: async (event) => {
		const { user, session } = event.locals;
		if (!user || !session) redirect(303, '/admin/login/');
		if (!(await rateLimit(`mfa:${user.id}`, 5, 300))) {
			return fail(429, { error: 'Demasiados intentos. Espera 5 minutos.' });
		}
		const form = await event.request.formData();
		const code = String(form.get('code') ?? '').replace(/\s/g, '');
		const [u] = await db.select().from(s.users).where(eq(s.users.id, user.id)).limit(1);
		if (!u?.totpSecretEnc) redirect(303, '/admin/mfa/configurar/');

		let ok = false;
		let method = 'totp';
		if (/^\d{6}$/.test(code)) {
			ok = verifyTotp(await decryptSecret(u.totpSecretEnc), code);
		} else if (/^[A-Z0-9]{4}-?[A-Z0-9]{4}-?[A-Z0-9]{4}$/i.test(code)) {
			method = 'recovery';
			const normalized = code.toUpperCase().replace(/^(.{4})-?(.{4})-?(.{4})$/, '$1-$2-$3');
			const [rc] = await db
				.select()
				.from(s.recoveryCodes)
				.where(and(eq(s.recoveryCodes.userId, u.id), eq(s.recoveryCodes.codeHash, hashRecoveryCode(normalized)), isNull(s.recoveryCodes.usedAt)))
				.limit(1);
			if (rc) {
				ok = true;
				await db.update(s.recoveryCodes).set({ usedAt: new Date() }).where(eq(s.recoveryCodes.id, rc.id));
			}
		}
		if (!ok) {
			await audit(event, 'auth.mfa_failed', 'user', u.id);
			return fail(400, { error: 'Código incorrecto o expirado.' });
		}
		// Rotación del token tras MFA (anti session-fixation)
		await rotateSession(event, session.id, u.id, true);
		await audit(event, 'auth.login', 'user', u.id, { method });
		const next = event.url.searchParams.get('next');
		redirect(303, next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin/');
	}
};
