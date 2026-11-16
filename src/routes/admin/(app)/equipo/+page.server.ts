import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';
import { audit } from '$lib/server/security/audit';
import { chileanPhone } from '$lib/schemas/lead';

const member = z
	.object({
		id: z.string().optional(),
		name: z.string().trim().min(3).max(80),
		role: z.string().trim().min(3).max(80),
		bio: z.string().trim().max(1200).default(''),
		phone: z.string().trim().max(30).optional().transform((v) => (v ? v : undefined)).pipe(chileanPhone.optional()),
		email: z.string().trim().max(160).optional().transform((v) => (v ? v : undefined)).pipe(z.string().email('Correo inválido').optional()),
		photoId: z.string().optional().transform((v) => (v ? v : null)).pipe(z.string().uuid().nullable()),
		sortOrder: z.coerce.number().int().min(0).max(100),
		showInContact: z.literal('on').optional().transform((v) => v === 'on')
	})
	.strict();

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'content:write');
	return { team: await db.select().from(s.teamMembers).orderBy(asc(s.teamMembers.sortOrder)) };
};

export const actions: Actions = {
	save: async (event) => {
		requirePermission(event, 'content:write');
		const raw = Object.fromEntries(await event.request.formData()) as Record<string, string>;
		const parsed = member.safeParse(raw);
		if (!parsed.success) return fail(400, { id: raw.id, error: `${String(parsed.error.issues[0].path[0])}: ${parsed.error.issues[0].message}` });
		const { id, ...d } = parsed.data;
		const values = { ...d, phone: d.phone ?? null, email: d.email ?? null, updatedAt: new Date() };
		if (id && /^[0-9a-f-]{36}$/.test(id)) {
			await db.update(s.teamMembers).set(values).where(eq(s.teamMembers.id, id));
			await audit(event, 'team.update', 'team_member', id);
		} else {
			const [row] = await db.insert(s.teamMembers).values(values).returning({ id: s.teamMembers.id });
			await audit(event, 'team.create', 'team_member', row.id);
		}
		return { saved: id ?? 'new' };
	},
	remove: async (event) => {
		requirePermission(event, 'content:write');
		const id = String((await event.request.formData()).get('id'));
		if (!/^[0-9a-f-]{36}$/.test(id)) return fail(400, { error: 'Inválido' });
		await db.delete(s.teamMembers).where(eq(s.teamMembers.id, id));
		await audit(event, 'team.delete', 'team_member', id);
		return { saved: 'deleted' };
	}
};
