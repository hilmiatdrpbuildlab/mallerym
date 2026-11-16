import type { PageServerLoad } from './$types';
import { z } from 'zod';
import { listProperties, getFilterOptions, getUF } from '$lib/server/content';
import { OPERATION_SLUG } from '$lib/format';

// Parámetros de URL validados (valores desconocidos se ignoran, nunca llegan a SQL sin parametrizar)
const params = z.object({
	operacion: z.enum(['venta', 'arriendo', 'arriendo-temporal']).optional().catch(undefined),
	tipo: z.string().regex(/^[a-z-]{2,30}$/).optional().catch(undefined),
	zona: z.string().regex(/^[a-z-]{2,40}$/).optional().catch(undefined),
	moneda: z.enum(['UF', 'CLP']).optional().catch(undefined),
	min: z.coerce.number().int().positive().max(1e10).optional().catch(undefined),
	max: z.coerce.number().int().positive().max(1e10).optional().catch(undefined),
	dorm: z.coerce.number().int().min(1).max(10).optional().catch(undefined),
	orden: z.enum(['recientes', 'precio-asc', 'precio-desc']).optional().catch(undefined),
	ver: z.enum(['todas']).optional().catch(undefined)
});

export const load: PageServerLoad = async ({ url }) => {
	const raw = Object.fromEntries([...url.searchParams].filter(([, v]) => v !== ''));
	const f = params.parse(raw);
	const [items, options, uf] = await Promise.all([
		listProperties({
			operacion: f.operacion ? OPERATION_SLUG[f.operacion] : undefined,
			tipo: f.tipo,
			zona: f.zona,
			moneda: f.moneda ?? (f.min || f.max ? 'UF' : undefined),
			min: f.min,
			max: f.max,
			dorm: f.dorm,
			orden: f.orden,
			includeClosed: f.ver === 'todas'
		}),
		getFilterOptions(),
		getUF()
	]);
	return { items, options, filters: f, uf };
};
