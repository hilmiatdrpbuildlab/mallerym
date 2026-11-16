import { error, fail, redirect } from '@sveltejs/kit';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';
import { audit } from '$lib/server/security/audit';

const postSchema = z
	.object({
		version: z.coerce.number().int().min(0),
		title: z.string().trim().min(5, 'Mínimo 5 caracteres').max(160),
		slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones').max(140),
		excerpt: z.string().trim().max(300).default(''),
		body: z.string().max(40000).default(''),
		coverId: z.string().optional().transform((v) => (v ? v : null)).pipe(z.string().uuid().nullable()),
		authorId: z.string().optional().transform((v) => (v ? v : null)).pipe(z.string().uuid().nullable()),
		publishState: z.enum(['draft', 'review', 'published', 'archived']),
		publishedAt: z.string().optional().transform((v) => (v ? new Date(v) : null)),
		metaTitle: z.string().trim().max(60).optional().transform((v) => v || null),
		metaDescription: z.string().trim().max(160).optional().transform((v) => v || null)
	})
	.strict();

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'post:write');
	const [cats, authors] = await Promise.all([
		db.select().from(s.postCategories).orderBy(asc(s.postCategories.id)),
		db.select({ id: s.teamMembers.id, name: s.teamMembers.name }).from(s.teamMembers).orderBy(asc(s.teamMembers.sortOrder))
	]);
	if (event.params.id === 'nuevo') return { post: null, cats, authors, selected: [] as number[] };
	if (!/^[0-9a-f-]{36}$/.test(event.params.id)) error(404, 'No encontrado');
	const [post] = await db.select().from(s.posts).where(and(eq(s.posts.id, event.params.id), isNull(s.posts.deletedAt))).limit(1);
	if (!post) error(404, 'Artículo no encontrado');
	const sel = await db.select({ id: s.postCategoryMap.categoryId }).from(s.postCategoryMap).where(eq(s.postCategoryMap.postId, post.id));
	return { post, cats, authors, selected: sel.map((x) => x.id) };
};

export const actions: Actions = {
	save: async (event) => {
		requirePermission(event, 'post:write');
		const form = await event.request.formData();
		const catIds = form.getAll('category').map(Number).filter((n) => Number.isInteger(n) && n > 0);
		const raw: Record<string, string> = {};
		for (const [k, v] of form) if (typeof v === 'string' && k !== 'category') raw[k] = v;
		const parsed = postSchema.safeParse(raw);
		if (!parsed.success) {
			const errors: Record<string, string> = {};
			for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
			return fail(400, { error: 'Revisa los campos marcados.', errors });
		}
		const { version, ...d } = parsed.data;
		if (d.publishState === 'published' && !d.publishedAt) d.publishedAt = new Date();
		const isNew = event.params.id === 'nuevo';
		const clash = await db.select({ id: s.posts.id }).from(s.posts).where(eq(s.posts.slug, d.slug)).limit(1);
		if (clash.length && (isNew || clash[0].id !== event.params.id)) return fail(400, { error: 'El slug ya existe.', errors: { slug: 'Slug duplicado' } });

		let id = event.params.id;
		if (isNew) {
			const [row] = await db.insert(s.posts).values({ ...d, version: 1 }).returning({ id: s.posts.id });
			id = row.id;
		} else {
			const up = await db
				.update(s.posts)
				.set({ ...d, version: version + 1, updatedAt: new Date() })
				.where(and(eq(s.posts.id, id), eq(s.posts.version, version)))
				.returning({ id: s.posts.id });
			if (!up.length) return fail(409, { error: 'Otra persona guardó este artículo mientras editabas. Recarga para continuar.' });
		}
		await db.delete(s.postCategoryMap).where(eq(s.postCategoryMap.postId, id));
		if (catIds.length) await db.insert(s.postCategoryMap).values(catIds.map((categoryId) => ({ postId: id, categoryId })));
		await audit(event, isNew ? 'post.create' : 'post.update', 'post', id, { state: d.publishState });
		if (isNew) redirect(303, `/admin/blog/${id}/`);
		return { saved: true };
	},
	remove: async (event) => {
		requirePermission(event, 'post:write');
		if (!/^[0-9a-f-]{36}$/.test(event.params.id)) error(404);
		await db.update(s.posts).set({ deletedAt: new Date(), publishState: 'archived' }).where(eq(s.posts.id, event.params.id));
		await audit(event, 'post.delete', 'post', event.params.id);
		redirect(303, '/admin/blog/');
	}
};
