import { z } from 'zod';

/** "16.600" / "16600,5" / "$2.200.000" → número (formato es-CL) */
export const clNumber = z
	.string()
	.trim()
	.transform((v) => v.replace(/[$\sA-Za-z]/g, '').replace(/\./g, '').replace(',', '.'))
	.pipe(z.string().regex(/^\d+(\.\d+)?$/, 'Ingresa un número válido'))
	.transform(Number);

const optNum = (max: number) =>
	z
		.string()
		.trim()
		.optional()
		.transform((v) => (v ? Number(v.replace(/\./g, '').replace(',', '.')) : undefined))
		.pipe(z.number({ message: 'Ingresa un número válido' }).min(0).max(max).optional());

const optText = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `Máximo ${max} caracteres`)
		.optional()
		.transform((v) => (v ? v : null));

export const propertySchema = z
	.object({
		version: z.coerce.number().int().min(1),
		title: z.string().trim().min(5, 'El título debe tener al menos 5 caracteres').max(140, 'Máximo 140 caracteres'),
		slug: z
			.string()
			.trim()
			.toLowerCase()
			.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones')
			.max(120),
		operation: z.enum(['venta', 'arriendo_anual', 'arriendo_temporal']),
		propertyTypeId: z.coerce.number().int().min(1).max(50),
		locationId: z.string().uuid('Selecciona una zona'),
		condominium: optText(120),
		summary: optText(300),
		body: z.string().max(20000).default(''),
		locationNotes: optText(600),
		availability: z.enum(['disponible', 'reservada', 'vendida', 'arrendada']),
		featured: z.literal('on').optional().transform((v) => v === 'on'),
		agentId: z
			.string()
			.optional()
			.transform((v) => (v ? v : null))
			.pipe(z.string().uuid().nullable()),
		priceAmount: clNumber.refine((n) => n > 0 && n < 1e11, 'El precio debe ser mayor que 0'),
		priceCurrency: z.enum(['UF', 'CLP']),
		pricePeriod: z.enum(['total', 'mes', 'noche', 'dia']),
		priceIsFrom: z.literal('on').optional().transform((v) => v === 'on'),
		builtM2: optNum(100000),
		terraceM2: optNum(100000),
		landM2: optNum(10000000),
		bedrooms: optNum(50),
		bathrooms: optNum(50),
		parking: optNum(50),
		floors: optNum(20),
		guests: optNum(100),
		minNights: optNum(60),
		metaTitle: optText(60),
		metaDescription: optText(160)
	})
	.strict()
	.superRefine((d, ctx) => {
		// Precio siempre emparejado con moneda y periodo coherentes con la operación
		if (d.operation === 'venta' && d.pricePeriod !== 'total')
			ctx.addIssue({ code: 'custom', path: ['pricePeriod'], message: 'En venta el precio es total' });
		if (d.operation === 'arriendo_anual' && d.pricePeriod !== 'mes')
			ctx.addIssue({ code: 'custom', path: ['pricePeriod'], message: 'El arriendo anual se expresa por mes' });
		if (d.operation === 'arriendo_temporal' && !['noche', 'dia'].includes(d.pricePeriod))
			ctx.addIssue({ code: 'custom', path: ['pricePeriod'], message: 'El arriendo temporal se expresa por noche o por día' });
	});

export type PropertyInput = z.infer<typeof propertySchema>;

export function suggestTitle(o: {
	type?: string;
	condominium?: string | null;
	sector?: string;
	builtM2?: string | number | null;
	landM2?: string | number | null;
}) {
	const parts = [`${o.type ?? 'Propiedad'}${o.condominium ? ` en Cond. ${o.condominium}` : ''}${o.sector ? `, ${o.sector}` : ''}`];
	if (o.builtM2) parts.push(`${o.builtM2} m²`);
	else if (o.landM2) parts.push(`${o.landM2} m² de terreno`);
	return parts.join(' · ');
}
