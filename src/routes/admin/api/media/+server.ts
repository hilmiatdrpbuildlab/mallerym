import { json } from '@sveltejs/kit';
import { and, desc, eq, ilike } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';

export const trailingSlash = 'always';

/** Listado JSON para el selector de medios del CMS. */
export const GET: RequestHandler = async (event) => {
	requirePermission(event, 'media:write');
	const folder = event.url.searchParams.get('folder');
	const q = (event.url.searchParams.get('q') ?? '').slice(0, 60);
	const rows = await db
		.select({ id: s.media.id, alt: s.media.altText, width: s.media.width, height: s.media.height, folder: s.media.folder })
		.from(s.media)
		.where(
			and(
				folder && /^[a-z]+$/.test(folder) ? eq(s.media.folder, folder) : undefined,
				q ? ilike(s.media.altText, `%${q.replace(/[%_\\]/g, '\\$&')}%`) : undefined
			)
		)
		.orderBy(desc(s.media.createdAt))
		.limit(120);
	return json(rows);
};
