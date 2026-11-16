import { fail } from '@sveltejs/kit';
import { and, asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';
import { audit } from '$lib/server/security/audit';
import { getBlocks } from '$lib/server/content';

const t = (max: number, min = 0) => z.string().trim().min(min).max(max);
const img = z.string().optional().transform((v) => (v ? v : null)).pipe(z.string().uuid().nullable());
const href = z
	.string()
	.trim()
	.max(300)
	.refine((v) => /^(\/(?!\/)|https:\/\/)/.test(v), 'Usa una ruta interna (/…) o un enlace https://');

// Un esquema Zod por tipo de bloque: el editor nunca escribe JSON libre.
const SCHEMAS = {
	hero: z.object({ eyebrow: t(80), title: t(90, 10), subtitle: t(240), imageId: img }).strict(),
	trust: z
		.object({ items: z.array(z.object({ value: t(30, 1), label: t(80, 2) })).min(2).max(4) })
		.strict(),
	destacado: z
		.object({ label: t(30, 2), title: t(80, 3), text: t(400, 10), propertySlug: t(140, 1), ctaLabel: t(40, 2), imageIds: z.array(z.string().uuid()).max(8) })
		.strict(),
	promos: z
		.object({ items: z.array(z.object({ title: t(80, 3), text: t(300, 10), imageId: img, ctaLabel: t(40, 2), href })).min(1).max(3) })
		.strict(),
	owner: z.object({ title: t(90, 5), text: t(300, 10), imageId: img }).strict(),
	partner: z.object({ title: t(80, 3), text: t(300, 10), ctaLabel: t(60, 2), url: href, imageId: img, logoId: img }).strict()
} as const;
type Key = keyof typeof SCHEMAS;

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'content:write');
	const [blocks, props, versions] = await Promise.all([
		getBlocks('inicio'),
		db
			.select({ slug: s.properties.slug, title: s.properties.title })
			.from(s.properties)
			.where(and(eq(s.properties.publishState, 'published'), sql`${s.properties.deletedAt} IS NULL`))
			.orderBy(asc(s.properties.title)),
		db.select({ key: s.pageBlocks.blockKey, version: s.pageBlocks.version, updatedAt: s.pageBlocks.updatedAt }).from(s.pageBlocks).where(eq(s.pageBlocks.pageKey, 'inicio'))
	]);
	return { blocks: blocks as Record<string, any>, props, versions };
};

function collect(form: FormData, key: Key): unknown {
	const g = (k: string) => String(form.get(k) ?? '');
	switch (key) {
		case 'trust':
			return { items: [0, 1, 2, 3].map((i) => ({ value: g(`value_${i}`), label: g(`label_${i}`) })).filter((x) => x.value || x.label) };
		case 'promos':
			return {
				items: [0, 1, 2]
					.map((i) => ({ title: g(`title_${i}`), text: g(`text_${i}`), imageId: g(`imageId_${i}`), ctaLabel: g(`ctaLabel_${i}`), href: g(`href_${i}`) }))
					.filter((x) => x.title)
			};
		case 'destacado':
			return {
				label: g('label'),
				title: g('title'),
				text: g('text'),
				propertySlug: g('propertySlug'),
				ctaLabel: g('ctaLabel'),
				imageIds: form.getAll('imageIds').map(String).filter(Boolean)
			};
		default: {
			const out: Record<string, string> = {};
			for (const [k, v] of form) if (typeof v === 'string' && k !== 'block') out[k] = v;
			return out;
		}
	}
}

export const actions: Actions = {
	default: async (event) => {
		const user = requirePermission(event, 'content:write');
		const form = await event.request.formData();
		const key = String(form.get('block')) as Key;
		if (!(key in SCHEMAS)) return fail(400, { error: 'Bloque desconocido', block: key });
		const parsed = SCHEMAS[key].safeParse(collect(form, key));
		if (!parsed.success) return fail(400, { block: key, error: `${parsed.error.issues[0].path.join('.')}: ${parsed.error.issues[0].message}` });
		await db
			.insert(s.pageBlocks)
			.values({ pageKey: 'inicio', blockKey: key, data: parsed.data, updatedBy: user.id })
			.onConflictDoUpdate({
				target: [s.pageBlocks.pageKey, s.pageBlocks.blockKey],
				set: { data: parsed.data, version: sql`${s.pageBlocks.version} + 1`, updatedAt: new Date(), updatedBy: user.id }
			});
		await audit(event, 'content.block_update', 'page_block', `inicio/${key}`);
		return { saved: key };
	}
};
