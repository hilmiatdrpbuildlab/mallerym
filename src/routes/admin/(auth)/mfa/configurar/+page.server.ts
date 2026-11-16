import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { encodeBase32UpperCaseNoPadding } from '@oslojs/encoding';
import { dev } from '$app/env';
import type { Actions, PageServerLoad } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { rotateSession } from '$lib/server/auth/session';
import { newTotpSecret, totpUri, totpQrSvg, verifyTotp, newRecoveryCodes, hashRecoveryCode } from '$lib/server/auth/totp';
import { encryptSecret, decryptSecret } from '$lib/server/security/crypto';
import { rateLimit } from '$lib/server/security/ratelimit';
import { audit } from '$lib/server/security/audit';

// El secreto pendiente viaja cifrado (AES-GCM) en una cookie HttpOnly de 10 min hasta que se confirma.
const PENDING = dev ? 'mm_mfa_setup' : '__Host-mm_mfa_setup';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const user = locals.user!;
	let secret: Uint8Array;
	const pending = cookies.get(PENDING);
	try {
		secret = pending ? await decryptSecret(pending) : newTotpSecret();
	} catch {
		secret = newTotpSecret();
	}
	cookies.set(PENDING, await encryptSecret(secret), { path: '/', httpOnly: true, secure: !dev, sameSite: 'strict', maxAge: 600 });
	const uri = totpUri(user.email, secret);
	return {
		qr: totpQrSvg(uri),
		manualKey: encodeBase32UpperCaseNoPadding(secret).replace(/(.{4})/g, '$1 ').trim(),
		email: user.email
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { user, session } = event.locals;
		if (!user || !session) redirect(303, '/admin/login/');
		if (user.mfaEnabled && !session.mfaVerifiedAt) redirect(303, '/admin/mfa/');
		if (!(await rateLimit(`mfa-setup:${user.id}`, 8, 300))) return fail(429, { error: 'Demasiados intentos.' });

		const pending = event.cookies.get(PENDING);
		if (!pending) return fail(400, { error: 'La sesión de configuración expiró. Recarga la página.' });
		const secret = await decryptSecret(pending);
		const code = String((await event.request.formData()).get('code') ?? '').replace(/\s/g, '');
		if (!verifyTotp(secret, code)) return fail(400, { error: 'El código no coincide. Revisa la hora de tu teléfono e inténtalo otra vez.' });

		const codes = newRecoveryCodes();
		await db.update(s.users).set({ totpSecretEnc: await encryptSecret(secret), mfaEnabled: true }).where(eq(s.users.id, user.id));
		await db.delete(s.recoveryCodes).where(eq(s.recoveryCodes.userId, user.id));
		await db.insert(s.recoveryCodes).values(codes.map((c) => ({ userId: user.id, codeHash: hashRecoveryCode(c) })));
		event.cookies.delete(PENDING, { path: '/', secure: !dev });
		await rotateSession(event, session.id, user.id, true);
		await audit(event, 'auth.mfa_enrolled', 'user', user.id);
		return { codes };
	}
};
