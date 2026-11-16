import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { PUBLIC_MFA_REQUIRED } from '$app/env/public';
import { db, schema as s } from './db/client';
import { verifyTotp } from './auth/totp';
import { verifyPassword } from './auth/password';
import { decryptSecret } from './security/crypto';
import { rateLimit } from './security/ratelimit';

/**
 * Re-autenticación para acciones sensibles (plan E.1): exportar leads, cambiar roles, resetear MFA…
 * Con MFA activo exige un código TOTP fresco; en modo demo (PUBLIC_MFA_REQUIRED=false) exige la contraseña.
 * El campo del formulario se llama siempre `code`.
 */
export async function verifyReauth(event: RequestEvent, code: FormDataEntryValue | null): Promise<boolean> {
	const user = event.locals.user;
	if (!user) return false;
	if (!(await rateLimit(`reauth:${user.id}`, 5, 300))) return false;
	const value = String(code ?? '');
	const [u] = await db
		.select({ enc: s.users.totpSecretEnc, hash: s.users.passwordHash })
		.from(s.users)
		.where(eq(s.users.id, user.id))
		.limit(1);
	if (!u) return false;
	if (!PUBLIC_MFA_REQUIRED) return value.length > 0 && value.length <= 256 && verifyPassword(u.hash, value);
	const c = value.replace(/\s/g, '');
	if (!/^\d{6}$/.test(c) || !u.enc) return false;
	return verifyTotp(await decryptSecret(u.enc), c);
}
