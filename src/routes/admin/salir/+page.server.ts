import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { invalidateSession, deleteSessionCookie } from '$lib/server/auth/session';
import { audit } from '$lib/server/security/audit';

// Cerrar sesión solo vía POST (sin mutaciones por GET; CSRF protegido por verificación de Origin).
export const load: PageServerLoad = async () => redirect(303, '/admin/');

export const actions: Actions = {
	default: async (event) => {
		if (event.locals.session) {
			await audit(event, 'auth.logout', 'user', event.locals.user?.id);
			await invalidateSession(event.locals.session.id);
		}
		deleteSessionCookie(event.cookies);
		redirect(303, '/admin/login/');
	}
};
