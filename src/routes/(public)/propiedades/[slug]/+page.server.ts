import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getPropertyBySlug, listProperties, getUF } from '$lib/server/content';
import { handleLeadForm } from '$lib/server/leads';
import { can } from '$lib/permissions';

export const load: PageServerLoad = async ({ params, url, locals, setHeaders }) => {
	if (!/^[a-z0-9-]{1,120}$/.test(params.slug)) error(404, 'Propiedad no encontrada');
	// Vista previa de borradores solo para usuarios del CMS con sesión + MFA (nunca con un parámetro público)
	const preview =
		url.searchParams.has('preview') && !!locals.session?.mfaVerifiedAt && can(locals.user?.role, 'property:write');
	const p = await getPropertyBySlug(params.slug, { preview });
	if (!p) error(404, 'Propiedad no encontrada');
	if (preview) setHeaders({ 'Cache-Control': 'private, no-store' });

	const [similarSame, uf] = await Promise.all([
		listProperties({ operacion: p.operation, excludeId: p.id, limit: 6 }),
		getUF()
	]);
	const similar = [
		...similarSame.filter((x) => x.typeSlug === p.typeSlug),
		...similarSame.filter((x) => x.typeSlug !== p.typeSlug)
	].slice(0, 3);

	return {
		p,
		similar,
		uf,
		preview: preview && p.publishState !== 'published',
		waText: `Hola, me interesa la propiedad "${p.title}" (${url.origin}/propiedades/${p.slug}/). ¿Sigue disponible?`
	};
};

export const actions: Actions = {
	lead: async (event) => {
		const p = await getPropertyBySlug(event.params.slug);
		if (!p) error(404, 'Propiedad no encontrada');
		return handleLeadForm(event, {
			type: 'consulta_propiedad',
			propertyId: p.id,
			sourcePage: `/propiedades/${p.slug}/`
		});
	}
};
