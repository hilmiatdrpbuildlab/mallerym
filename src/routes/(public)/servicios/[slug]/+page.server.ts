import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getService, listProperties, listPosts } from '$lib/server/content';
import { handleLeadForm } from '$lib/server/leads';

export const load: PageServerLoad = async ({ params }) => {
	const service = await getService(params.slug);
	if (!service) error(404, 'Servicio no encontrado');
	const [props, posts] = await Promise.all([
		service.slug === 'arriendo'
			? listProperties({ operacion: 'arriendo_temporal', limit: 3 })
			: service.slug === 'diseno'
				? Promise.resolve([])
				: listProperties({ operacion: 'venta', limit: 3 }),
		service.slug === 'diseno' || service.slug === 'venta' ? listPosts({ limit: 3 }) : Promise.resolve([])
	]);
	return { service, props, posts };
};

export const actions: Actions = {
	lead: async (event) => {
		const service = await getService(event.params.slug);
		if (!service) error(404, 'Servicio no encontrado');
		return handleLeadForm(event, { type: service.leadType, sourcePage: `/servicios/${service.slug}/` });
	}
};
