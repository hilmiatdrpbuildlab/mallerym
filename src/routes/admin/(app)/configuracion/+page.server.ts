import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';
import { audit } from '$lib/server/security/audit';
import { getSettings } from '$lib/server/content';
import { chileanPhone } from '$lib/schemas/lead';

const url = z
	.string()
	.trim()
	.max(200)
	.refine((v) => v === '' || /^https:\/\//.test(v), 'Debe comenzar con https://');

const schema = z
	.object({
		phone1: chileanPhone,
		phone2: z.string().trim().optional().transform((v) => (v ? v : undefined)).pipe(chileanPhone.optional()),
		whatsapp: chileanPhone,
		email: z.string().trim().email(),
		address: z.string().trim().min(5).max(200),
		mapQuery: z.string().trim().min(3).max(120),
		hours: z.string().trim().max(120).default(''),
		instagram: url,
		facebook: url,
		linkedin: url,
		defaultDescription: z.string().trim().min(50).max(160)
	})
	.strict();

const pretty = (p: string) => p.replace(/^\+56(9)(\d{4})(\d{4})$/, '+56 $1 $2 $3');

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'settings:write');
	return { settings: await getSettings() };
};

export const actions: Actions = {
	default: async (event) => {
		requirePermission(event, 'settings:write');
		const parsed = schema.safeParse(Object.fromEntries(await event.request.formData()));
		if (!parsed.success) return fail(400, { error: `${String(parsed.error.issues[0].path[0])}: ${parsed.error.issues[0].message}` });
		const d = parsed.data;
		const current = await getSettings();
		const values = {
			contact: {
				phones: [d.phone1, d.phone2].filter(Boolean).map((p) => pretty(p!)),
				whatsapp: pretty(d.whatsapp),
				email: d.email,
				address: d.address,
				mapQuery: d.mapQuery,
				hours: d.hours
			},
			social: { instagram: d.instagram, facebook: d.facebook, linkedin: d.linkedin },
			seo: { ...current.seo, defaultDescription: d.defaultDescription }
		};
		for (const [key, value] of Object.entries(values)) {
			await db.insert(s.siteSettings).values({ key, value }).onConflictDoUpdate({ target: s.siteSettings.key, set: { value, updatedAt: new Date() } });
		}
		await audit(event, 'settings.update', 'site_settings', null, { keys: Object.keys(values) });
		return { saved: true };
	}
};
