import { fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';
import { audit } from '$lib/server/security/audit';
import { slugify } from '$lib/format';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'property:write');
	const [types, locations] = await Promise.all([
		db.select().from(s.propertyTypes).orderBy(asc(s.propertyTypes.id)),
		db.select().from(s.locations).orderBy(asc(s.locations.sector))
	]);
	return { types, locations };
};

const schema = z
	.object({
		title: z.string().trim().min(5, 'Mínimo 5 caracteres').max(140),
		operation: z.enum(['venta', 'arriendo_anual', 'arriendo_temporal']),
		propertyTypeId: z.coerce.number().int().min(1),
		locationId: z.string().uuid()
	})
	.strict();

export const actions: Actions = {
	default: async (event) => {
		const user = requirePermission(event, 'property:write');
		const raw = Object.fromEntries(await event.request.formData()) as Record<string, string>;
		const parsed = schema.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.issues[0].message, values: raw });
		const d = parsed.data;
		let slug = slugify(d.title) || 'propiedad';
		const exists = await db.select({ id: s.properties.id }).from(s.properties).where(eq(s.properties.slug, slug)).limit(1);
		if (exists.length) slug = `${slug}-${Date.now().toString(36)}`;
		const [row] = await db
			.insert(s.properties)
			.values({ ...d, slug, publishState: 'draft', createdBy: user.id, updatedBy: user.id })
			.returning({ id: s.properties.id });
		await db.insert(s.propertySpecs).values({ propertyId: row.id });
		await audit(event, 'property.create', 'property', row.id, { title: d.title });
		redirect(303, `/admin/propiedades/${row.id}/?nuevo=1`);
	}
};
