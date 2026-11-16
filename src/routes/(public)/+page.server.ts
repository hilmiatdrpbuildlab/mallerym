import type { PageServerLoad, Actions } from './$types';
import { getBlocks, listProperties, listPosts, getServices, getFilterOptions, getUF, getPropertyBySlug } from '$lib/server/content';
import { handleLeadForm } from '$lib/server/leads';

export const load: PageServerLoad = async () => {
	const blocks = await getBlocks('inicio');
	const destacadoSlug = blocks.destacado?.propertySlug as string | undefined;
	const [latest, posts, services, filters, uf, destacado, all] = await Promise.all([
		listProperties({ limit: 6 }),
		listPosts({ limit: 3 }),
		getServices(),
		getFilterOptions(),
		getUF(),
		destacadoSlug ? getPropertyBySlug(destacadoSlug) : null,
		listProperties({ includeClosed: true, limit: 500 })
	]);
	return {
		blocks,
		latest,
		posts,
		services: services.map((s) => ({ slug: s.slug, title: s.title, summary: s.summary, imageId: s.imageId })),
		filters,
		uf,
		destacado,
		totalProperties: all.length
	};
};

export const actions: Actions = {
	owner: (event) => handleLeadForm(event, { type: 'quiero_vender', sourcePage: '/' })
};
