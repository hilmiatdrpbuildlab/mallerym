import { error, fail } from '@sveltejs/kit';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { requirePermission, can } from '$lib/server/auth/rbac';
import { audit } from '$lib/server/security/audit';

async function getLead(id: string) {
	if (!/^[0-9a-f-]{36}$/.test(id)) error(404, 'No encontrado');
	const [l] = await db.select().from(s.leads).where(eq(s.leads.id, id)).limit(1);
	if (!l) error(404, 'Lead no encontrado');
	return l;
}

export const load: PageServerLoad = async (event) => {
	const user = requirePermission(event, 'lead:read');
	const lead = await getLead(event.params.id);
	const [notes, users, property, history] = await Promise.all([
		db
			.select({ id: s.leadNotes.id, body: s.leadNotes.body, createdAt: s.leadNotes.createdAt, author: s.users.name })
			.from(s.leadNotes)
			.leftJoin(s.users, eq(s.users.id, s.leadNotes.authorId))
			.where(eq(s.leadNotes.leadId, lead.id))
			.orderBy(desc(s.leadNotes.createdAt)),
		db.select({ id: s.users.id, name: s.users.name }).from(s.users).where(eq(s.users.active, true)).orderBy(asc(s.users.name)),
		lead.propertyId
			? db.select({ title: s.properties.title, slug: s.properties.slug, id: s.properties.id }).from(s.properties).where(eq(s.properties.id, lead.propertyId)).limit(1)
			: Promise.resolve([]),
		db.execute(sql`SELECT action, actor_email, diff, created_at FROM audit_logs WHERE entity = 'lead' AND entity_id = ${lead.id} ORDER BY created_at DESC LIMIT 20`)
	]);
	await audit(event, 'lead.view', 'lead', lead.id);
	return { lead, notes, users, property: property[0] ?? null, history: history.rows as any[], canWrite: can(user.role, 'lead:write') };
};

export const actions: Actions = {
	update: async (event) => {
		requirePermission(event, 'lead:write');
		const lead = await getLead(event.params.id);
		const parsed = z
			.object({
				status: z.enum(['nuevo', 'contactado', 'visita', 'negociacion', 'cerrado', 'spam']),
				assignedTo: z
					.string()
					.optional()
					.transform((v) => (v ? v : null))
					.pipe(z.string().uuid().nullable())
			})
			.strict()
			.safeParse(Object.fromEntries(await event.request.formData()));
		if (!parsed.success) return fail(400, { error: 'Datos inválidos' });
		await db.update(s.leads).set({ ...parsed.data, updatedAt: new Date() }).where(eq(s.leads.id, lead.id));
		await audit(event, 'lead.update', 'lead', lead.id, { from: { status: lead.status, assignedTo: lead.assignedTo }, to: parsed.data });
		return { saved: true };
	},
	note: async (event) => {
		const user = requirePermission(event, 'lead:write');
		const lead = await getLead(event.params.id);
		const body = String((await event.request.formData()).get('body') ?? '').trim().slice(0, 2000);
		if (body.length < 2) return fail(400, { error: 'La nota está vacía' });
		await db.insert(s.leadNotes).values({ leadId: lead.id, authorId: user.id, body });
		if (lead.status === 'nuevo') await db.update(s.leads).set({ status: 'contactado', updatedAt: new Date() }).where(eq(s.leads.id, lead.id));
		await audit(event, 'lead.note', 'lead', lead.id);
		return { saved: true };
	}
};
