import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'audit:read');
	const q = (event.url.searchParams.get('accion') ?? '').slice(0, 60);
	const actor = (event.url.searchParams.get('actor') ?? '').slice(0, 160);
	const where = [sql`true`];
	if (q) where.push(sql`action ILIKE ${q + '%'}`);
	if (actor) where.push(sql`actor_email ILIKE ${'%' + actor + '%'}`);
	const rows = await db.execute(sql`SELECT id, action, entity, entity_id, actor_email, diff, ip_hash, created_at FROM audit_logs
		WHERE ${sql.join(where, sql` AND `)} ORDER BY created_at DESC LIMIT 300`);
	return { rows: rows.rows as any[], q, actor };
};
