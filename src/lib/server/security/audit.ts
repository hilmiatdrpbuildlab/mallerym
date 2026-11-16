import type { RequestEvent } from '@sveltejs/kit';
import { db, schema } from '../db/client';
import { hashIp } from './crypto';

/** Registro append-only (el rol de la app no tiene UPDATE/DELETE sobre audit_logs). */
export async function audit(
	event: RequestEvent,
	action: string,
	entity: string,
	entityId?: string | null,
	diff?: unknown
) {
	await db.insert(schema.auditLogs).values({
		actorId: event.locals.user?.id ?? null,
		actorEmail: event.locals.user?.email ?? null,
		action,
		entity,
		entityId: entityId ?? null,
		diff: diff ?? null,
		ipHash: await hashIp(event.getClientAddress())
	});
}
