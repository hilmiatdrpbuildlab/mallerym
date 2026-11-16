import { fail } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';
import { audit } from '$lib/server/security/audit';

const usage = sql`(
	(SELECT count(*) FROM property_media pm WHERE pm.media_id = m.id) +
	(SELECT count(*) FROM posts p WHERE p.cover_id = m.id OR p.body LIKE '%' || m.id::text || '%') +
	(SELECT count(*) FROM team_members t WHERE t.photo_id = m.id) +
	(SELECT count(*) FROM services sv WHERE sv.image_id = m.id) +
	(SELECT count(*) FROM page_blocks b WHERE b.data::text LIKE '%' || m.id::text || '%') +
	(SELECT count(*) FROM site_settings ss WHERE ss.value::text LIKE '%' || m.id::text || '%')
)::int`;

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'media:write');
	const folder = event.url.searchParams.get('carpeta') ?? '';
	const q = (event.url.searchParams.get('q') ?? '').slice(0, 60);
	const where = [sql`true`];
	if (/^[a-z]+$/.test(folder)) where.push(sql`m.folder = ${folder}`);
	if (q) where.push(sql`m.alt_text ILIKE ${'%' + q + '%'}`);
	const [rows, stats] = await Promise.all([
		db.execute(sql`SELECT m.id, m.alt_text, m.folder, m.width, m.height, m.bytes, m.created_at, ${usage} AS used
			FROM media m WHERE ${sql.join(where, sql` AND `)} ORDER BY m.created_at DESC LIMIT 150`),
		db.execute(sql`SELECT count(*)::int AS n, pg_size_pretty(coalesce(sum(bytes),0)) AS size FROM media_blobs`)
	]);
	return { rows: rows.rows as any[], stats: stats.rows[0] as { n: number; size: string }, folder, q };
};

export const actions: Actions = {
	alt: async (event) => {
		requirePermission(event, 'media:write');
		const f = await event.request.formData();
		const id = String(f.get('id'));
		const alt = String(f.get('alt') ?? '').trim();
		if (!/^[0-9a-f-]{36}$/.test(id) || alt.length < 3 || alt.length > 200) return fail(400, { error: 'Texto alternativo inválido (3–200 caracteres).' });
		await db.update(s.media).set({ altText: alt, updatedAt: new Date() }).where(eq(s.media.id, id));
		await audit(event, 'media.alt', 'media', id);
		return { saved: id };
	},
	remove: async (event) => {
		requirePermission(event, 'media:write');
		const id = String((await event.request.formData()).get('id'));
		if (!/^[0-9a-f-]{36}$/.test(id)) return fail(400, { error: 'Inválido' });
		const r = await db.execute(sql`SELECT ${usage} AS used FROM media m WHERE m.id = ${id}`);
		if (Number((r.rows[0] as { used: number } | undefined)?.used ?? 0) > 0) return fail(400, { error: 'La imagen está en uso y no puede eliminarse.' });
		await db.delete(s.media).where(eq(s.media.id, id));
		await audit(event, 'media.delete', 'media', id);
		return { saved: 'deleted' };
	}
};
