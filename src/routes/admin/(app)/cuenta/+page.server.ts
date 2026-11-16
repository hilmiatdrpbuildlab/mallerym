import { fail } from '@sveltejs/kit';
import { and, desc, eq, gt, ne, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';
import { hashPassword, verifyPassword, passwordPolicyError, isPwnedPassword } from '$lib/server/auth/password';
import { newRecoveryCodes, hashRecoveryCode } from '$lib/server/auth/totp';
import { verifyReauth } from '$lib/server/reauth';
import { rateLimit } from '$lib/server/security/ratelimit';
import { audit } from '$lib/server/security/audit';

export const load: PageServerLoad = async (event) => {
	const user = requirePermission(event, 'dashboard:read');
	const [sessions, codes] = await Promise.all([
		db
			.select({ id: s.sessions.id, createdAt: s.sessions.createdAt, expiresAt: s.sessions.expiresAt, userAgent: s.sessions.userAgent, mfa: s.sessions.mfaVerifiedAt })
			.from(s.sessions)
			.where(and(eq(s.sessions.userId, user.id), gt(s.sessions.expiresAt, new Date())))
			.orderBy(desc(s.sessions.createdAt)),
		db.execute(sql`SELECT count(*)::int AS n FROM recovery_codes WHERE user_id = ${user.id} AND used_at IS NULL`)
	]);
	return {
		sessions: sessions.map((x) => ({ ...x, id: x.id.slice(0, 12), current: x.id === event.locals.session!.id })),
		codesLeft: Number((codes.rows[0] as { n: number }).n)
	};
};

export const actions: Actions = {
	password: async (event) => {
		const user = requirePermission(event, 'dashboard:read');
		if (!(await rateLimit(`pwchange:${user.id}`, 5, 900))) return fail(429, { pwError: 'Demasiados intentos.' });
		const f = await event.request.formData();
		const current = String(f.get('current') ?? '');
		const next = String(f.get('next') ?? '');
		const confirm = String(f.get('confirm') ?? '');
		const [u] = await db.select().from(s.users).where(eq(s.users.id, user.id));
		if (!(await verifyPassword(u.passwordHash, current))) return fail(400, { pwError: 'La contraseña actual no es correcta.' });
		if (next !== confirm) return fail(400, { pwError: 'Las contraseñas nuevas no coinciden.' });
		const policy = passwordPolicyError(next);
		if (policy) return fail(400, { pwError: policy });
		if (await isPwnedPassword(next)) return fail(400, { pwError: 'Esta contraseña aparece en filtraciones públicas (Have I Been Pwned). Elige otra.' });
		await db.update(s.users).set({ passwordHash: await hashPassword(next), updatedAt: new Date() }).where(eq(s.users.id, user.id));
		// Cierra las demás sesiones
		await db.delete(s.sessions).where(and(eq(s.sessions.userId, user.id), ne(s.sessions.id, event.locals.session!.id)));
		await audit(event, 'auth.password_change', 'user', user.id);
		return { pwOk: true };
	},
	revokeOthers: async (event) => {
		const user = requirePermission(event, 'dashboard:read');
		await db.delete(s.sessions).where(and(eq(s.sessions.userId, user.id), ne(s.sessions.id, event.locals.session!.id)));
		await audit(event, 'auth.sessions_revoked', 'user', user.id);
		return { revoked: true };
	},
	codes: async (event) => {
		const user = requirePermission(event, 'dashboard:read');
		if (!(await verifyReauth(event, (await event.request.formData()).get('code')))) return fail(403, { codesError: 'Código MFA inválido.' });
		const codes = newRecoveryCodes();
		await db.delete(s.recoveryCodes).where(eq(s.recoveryCodes.userId, user.id));
		await db.insert(s.recoveryCodes).values(codes.map((c) => ({ userId: user.id, codeHash: hashRecoveryCode(c) })));
		await audit(event, 'auth.recovery_regenerated', 'user', user.id);
		return { codes };
	}
};

