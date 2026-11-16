import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'property:write');
	const sp = event.url.searchParams;
	const q = (sp.get('q') ?? '').slice(0, 80);
	const estado = sp.get('estado') ?? '';
	const op = sp.get('op') ?? '';
	const where = [sql`p.deleted_at IS NULL`];
	if (q) where.push(sql`(p.title ILIKE ${'%' + q + '%'} OR p.slug ILIKE ${'%' + q + '%'} OR p.condominium ILIKE ${'%' + q + '%'})`);
	if (['draft', 'review', 'published', 'archived'].includes(estado)) where.push(sql`p.publish_state = ${estado}`);
	if (['venta', 'arriendo_anual', 'arriendo_temporal'].includes(op)) where.push(sql`p.operation = ${op}`);
	const res = await db.execute(sql`
		SELECT p.id, p.slug, p.title, p.operation, p.availability, p.publish_state, p.featured, p.updated_at,
		       t.name AS type_name, l.sector,
		       pr.amount, pr.currency, pr.period, pr.is_from,
		       (SELECT count(*)::int FROM property_media pm WHERE pm.property_id = p.id) AS photos,
		       (SELECT pm.media_id FROM property_media pm WHERE pm.property_id = p.id ORDER BY (pm.role='cover') DESC, pm.sort_order LIMIT 1) AS cover,
		       (SELECT count(*)::int FROM leads ld WHERE ld.property_id = p.id) AS leads
		FROM properties p
		JOIN property_types t ON t.id = p.property_type_id
		JOIN locations l ON l.id = p.location_id
		LEFT JOIN LATERAL (SELECT amount, currency, period, is_from FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pr ON true
		WHERE ${sql.join(where, sql` AND `)}
		ORDER BY p.updated_at DESC`);
	return { rows: res.rows as any[], q, estado, op };
};
