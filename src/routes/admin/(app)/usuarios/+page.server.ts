import { fail } from '@sveltejs/kit';
import { asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';
import { hashPassword } from '$lib/server/auth/password';
import { invalidateUserSessions } from '$lib/server/auth/session';
import { randomToken } from '$lib/server/security/crypto';
import { verifyReauth } from '$lib/server/reauth';
import { audit } from '$lib/server/security/audit';

const ROLES = ['super_admin', 'editor', 'corredor', 'viewer'] as const;

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'user:manage');
	const users = await db.execute(sql`SELECT u.id, u.email, u.name, u.role, u.active, u.mfa_enabled, u.last_login_at, u.locked_until,
		(SELECT count(*)::int FROM sessions se WHERE se.user_id = u.id AND se.expires_at > now()) AS sessions
		FROM users u ORDER BY u.created_at`);
	return { users: users.rows as any[], me: event.locals.user!.id };
};

export const actions: Actions = {
	create: async (event) => {
		requirePermission(event, 'user:manage');
		const f = await event.request.formData();
		if (!(await verifyReauth(event, f.get('code')))) return fail(403, { error: 'Código MFA inválido.' });
		const parsed = z
			.object({ email: z.string().trim().toLowerCase().email().max(160), name: z.string().trim().min(2).max(80), role: z.enum(ROLES) })
			.safeParse({ email: f.get('email'), name: f.get('name'), role: f.get('role') });
		if (!parsed.success) return fail(400, { error: parsed.error.issues[0].message });
		const exists = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, parsed.data.email)).limit(1);
		if (exists.length) return fail(400, { error: 'Ya existe un usuario con ese correo.' });
		// Contraseña temporal de un solo uso (en producción: enlace de invitación por correo con expiración de 24 h)
		const temp = randomToken(12);
		const [row] = await db
			.insert(s.users)
			.values({ ...parsed.data, passwordHash: await hashPassword(temp) })
			.returning({ id: s.users.id });
		await audit(event, 'user.create', 'user', row.id, { role: parsed.data.role });
		return { created: { email: parsed.data.email, temp } };
	},
	role: async (event) => {
		const actor = requirePermission(event, 'user:manage');
		const f = await event.request.formData();
		if (!(await verifyReauth(event, f.get('code')))) return fail(403, { error: 'Código MFA inválido.' });
		const id = String(f.get('id'));
		const role = String(f.get('role'));
		if (!/^[0-9a-f-]{36}$/.test(id) || !ROLES.includes(role as any)) return fail(400, { error: 'Datos inválidos' });
		if (id === actor.id) return fail(400, { error: 'No puedes cambiar tu propio rol.' });
		await db.update(s.users).set({ role: role as any, updatedAt: new Date() }).where(eq(s.users.id, id));
		await invalidateUserSessions(id);
		await audit(event, 'user.role_change', 'user', id, { role });
		return { saved: true };
	},
	toggle: async (event) => {
		const actor = requirePermission(event, 'user:manage');
		const f = await event.request.formData();
		if (!(await verifyReauth(event, f.get('code')))) return fail(403, { error: 'Código MFA inválido.' });
		const id = String(f.get('id'));
		if (!/^[0-9a-f-]{36}$/.test(id) || id === actor.id) return fail(400, { error: 'Operación no permitida' });
		const [u] = await db.select({ active: s.users.active }).from(s.users).where(eq(s.users.id, id));
		await db.update(s.users).set({ active: !u.active, updatedAt: new Date() }).where(eq(s.users.id, id));
		await invalidateUserSessions(id);
		await audit(event, u.active ? 'user.deactivate' : 'user.activate', 'user', id);
		return { saved: true };
	},
	resetMfa: async (event) => {
		const actor = requirePermission(event, 'user:manage');
		const f = await event.request.formData();
		if (!(await verifyReauth(event, f.get('code')))) return fail(403, { error: 'Código MFA inválido.' });
		const id = String(f.get('id'));
		if (!/^[0-9a-f-]{36}$/.test(id) || id === actor.id) return fail(400, { error: 'Operación no permitida' });
		await db.update(s.users).set({ mfaEnabled: false, totpSecretEnc: null }).where(eq(s.users.id, id));
		await db.delete(s.recoveryCodes).where(eq(s.recoveryCodes.userId, id));
		await invalidateUserSessions(id);
		await audit(event, 'user.mfa_reset', 'user', id);
		return { saved: true };
	},
	revoke: async (event) => {
		requirePermission(event, 'user:manage');
		const id = String((await event.request.formData()).get('id'));
		if (!/^[0-9a-f-]{36}$/.test(id)) return fail(400, { error: 'Inválido' });
		await invalidateUserSessions(id);
		await audit(event, 'user.sessions_revoked', 'user', id);
		return { saved: true };
	}
};
