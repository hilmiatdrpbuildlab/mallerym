import { redirect } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user || !event.locals.session?.mfaVerifiedAt) redirect(303, '/admin/login/');
	const user = requirePermission(event, 'dashboard:read');
	const res = await db.execute(sql`SELECT count(*)::int AS n FROM leads WHERE status = 'nuevo'`);
	return { user, newLeads: Number((res.rows[0] as { n: number }).n) };
};
