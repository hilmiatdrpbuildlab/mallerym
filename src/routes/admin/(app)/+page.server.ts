import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { requirePermission, can } from '$lib/server/auth/rbac';

export const load: PageServerLoad = async (event) => {
	const user = requirePermission(event, 'dashboard:read');
	const q = async <T>(query: ReturnType<typeof sql>) => (await db.execute(query)).rows as T[];
	const [leadStats, leadByType, props, pending, recentLeads, activity, security] = await Promise.all([
		q<{ d7: number; d30: number; nuevos: number; total: number }>(sql`SELECT
			count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS d7,
			count(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS d30,
			count(*) FILTER (WHERE status = 'nuevo')::int AS nuevos,
			count(*)::int AS total FROM leads WHERE status <> 'spam'`),
		q<{ type: string; n: number }>(sql`SELECT type, count(*)::int AS n FROM leads
			WHERE created_at > now() - interval '30 days' AND status <> 'spam' GROUP BY type ORDER BY n DESC`),
		q<{ operation: string; availability: string; n: number }>(sql`SELECT operation, availability, count(*)::int AS n
			FROM properties WHERE deleted_at IS NULL AND publish_state = 'published' GROUP BY 1, 2`),
		q<{ id: string; title: string; kind: string; state: string; updated_at: string }>(sql`
			(SELECT id, title, 'propiedad' AS kind, publish_state::text AS state, updated_at FROM properties WHERE publish_state IN ('draft','review') AND deleted_at IS NULL)
			UNION ALL
			(SELECT id, title, 'artículo' AS kind, publish_state::text AS state, updated_at FROM posts WHERE publish_state IN ('draft','review') AND deleted_at IS NULL)
			ORDER BY updated_at DESC LIMIT 6`),
		can(user.role, 'lead:read')
			? q<{ id: string; first_name: string; last_name: string | null; type: string; status: string; created_at: string; property: string | null }>(sql`
				SELECT l.id, l.first_name, l.last_name, l.type, l.status, l.created_at, p.title AS property
				FROM leads l LEFT JOIN properties p ON p.id = l.property_id
				WHERE l.status <> 'spam' ORDER BY l.created_at DESC LIMIT 6`)
			: Promise.resolve([]),
		can(user.role, 'audit:read')
			? q<{ action: string; entity: string; actor_email: string | null; created_at: string }>(sql`
				SELECT action, entity, actor_email, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 8`)
			: Promise.resolve([]),
		q<{ users: number; mfa: number; sessions: number; failed24: number }>(sql`SELECT
			(SELECT count(*)::int FROM users WHERE active) AS users,
			(SELECT count(*)::int FROM users WHERE active AND mfa_enabled) AS mfa,
			(SELECT count(*)::int FROM sessions WHERE expires_at > now() AND mfa_verified_at IS NOT NULL) AS sessions,
			(SELECT count(*)::int FROM audit_logs WHERE action IN ('auth.login_failed','auth.mfa_failed') AND created_at > now() - interval '24 hours') AS failed24`)
	]);
	return { leadStats: leadStats[0], leadByType, props, pending, recentLeads, activity, security: security[0] };
};
