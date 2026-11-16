import type { PageServerLoad, Actions } from './$types';
import { handleLeadForm } from '$lib/server/leads';

const MOTIVOS = ['consulta_propiedad', 'quiero_vender', 'quiero_arrendar', 'diseno', 'general'];

export const load: PageServerLoad = async ({ url }) => {
	const motivo = url.searchParams.get('motivo') ?? '';
	const mensaje = (url.searchParams.get('mensaje') ?? '').slice(0, 300);
	return { motivo: MOTIVOS.includes(motivo) ? motivo : 'general', mensaje };
};

export const actions: Actions = {
	lead: (event) => handleLeadForm(event, { sourcePage: '/contacto-y-ubicacion/' })
};
