import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { requirePermission, can } from '$lib/server/auth/rbac';

const STATUSES = ['nuevo', 'contactado', 'visita', 'negociacion', 'cerrado', 'spam'];
const TYPES = ['consulta_propiedad', 'quiero_vender', 'quiero_arrendar', 'diseno', 'general'];

export const load: PageServerLoad = async (event) => {
	const user = requirePermission(event, 'lead:read');
	const sp = event.url.searchParams;
	const status = STATUSES.includes(sp.get('estado') ?? '') ? sp.get('estado')! : '';
	const type = TYPES.includes(sp.get('tipo') ?? '') ? sp.get('tipo')! : '';
	const q = (sp.get('q') ?? '').slice(0, 80);
	const where = [status ? sql`l.status = ${status}` : sql`l.status <> 'spam'`];
	if (type) where.push(sql`l.type = ${type}`);
	if (q) where.push(sql`(l.first_name ILIKE ${'%' + q + '%'} OR l.last_name ILIKE ${'%' + q + '%'} OR l.email ILIKE ${'%' + q + '%'} OR l.phone ILIKE ${'%' + q + '%'})`);
	const [rows, counts] = await Promise.all([
		db.execute(sql`SELECT l.id, l.first_name, l.last_name, l.email, l.phone, l.type, l.status, l.preferred_channel, l.created_at,
			p.title AS property, u.name AS assignee
			FROM leads l LEFT JOIN properties p ON p.id = l.property_id LEFT JOIN users u ON u.id = l.assigned_to
			WHERE ${sql.join(where, sql` AND `)} ORDER BY l.created_at DESC LIMIT 300`),
		db.execute(sql`SELECT status, count(*)::int AS n FROM leads GROUP BY status`)
	]);
	return {
		rows: rows.rows as any[],
		counts: Object.fromEntries((counts.rows as { status: string; n: number }[]).map((r) => [r.status, r.n])),
		status,
		type,
		q,
		canExport: can(user.role, 'lead:write')
	};
};
