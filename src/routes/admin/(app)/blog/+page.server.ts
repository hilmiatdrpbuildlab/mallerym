import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'post:write');
	const res = await db.execute(sql`SELECT p.id, p.slug, p.title, p.publish_state, p.published_at, p.updated_at, p.cover_id,
		coalesce((SELECT string_agg(pc.name, ', ') FROM post_category_map m JOIN post_categories pc ON pc.id = m.category_id WHERE m.post_id = p.id), '') AS cats
		FROM posts p WHERE p.deleted_at IS NULL ORDER BY coalesce(p.published_at, p.updated_at) DESC`);
	return { rows: res.rows as any[] };
};
