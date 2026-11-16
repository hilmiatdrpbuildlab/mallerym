import { error, type RequestEvent } from '@sveltejs/kit';
import { can, type Permission } from '$lib/permissions';

export * from '$lib/permissions';

/** Se llama en CADA load y action del panel: nunca basta con ocultar botones en la UI. */
export function requirePermission(event: RequestEvent, perm: Permission) {
	const user = event.locals.user;
	if (!user || !event.locals.session?.mfaVerifiedAt) error(401, 'No autenticado');
	if (!can(user.role, perm)) error(403, 'No tienes permiso para realizar esta acción');
	return user;
}
