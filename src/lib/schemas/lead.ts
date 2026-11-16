import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().max(max);
const optional = (max: number) =>
	z
		.string()
		.trim()
		.max(max)
		.optional()
		.transform((v) => (v ? v : undefined));

/** Teléfono chileno: acepta +56 9 XXXX XXXX con o sin espacios, o 9 XXXX XXXX. */
export const chileanPhone = z
	.string()
	.trim()
	.transform((v) => v.replace(/[\s().-]/g, ''))
	.refine((v) => /^(\+?56)?9\d{8}$/.test(v) || /^\+\d{8,15}$/.test(v), 'Ingresa un teléfono válido, ej. +56 9 1234 5678')
	.transform((v) => (v.startsWith('+') ? v : v.startsWith('56') ? `+${v}` : `+56${v}`));

export const leadSchema = z
	.object({
		type: z.enum(['consulta_propiedad', 'quiero_vender', 'quiero_arrendar', 'diseno', 'general']),
		firstName: trimmed(80).min(2, 'Ingresa tu nombre'),
		lastName: optional(80),
		email: z.string().trim().toLowerCase().max(160).email('Ingresa un correo válido'),
		phone: z
			.string()
			.trim()
			.max(30)
			.optional()
			.transform((v) => (v ? v : undefined))
			.pipe(chileanPhone.optional()),
		preferredChannel: z.enum(['whatsapp', 'correo', 'telefono']).default('whatsapp'),
		propertyId: z.string().uuid().optional(),
		comuna: optional(80),
		message: optional(2000),
		sourcePage: optional(300),
		consent: z.literal('on', { message: 'Debes aceptar la política de privacidad' })
	})
	.strict();

export type LeadInput = z.infer<typeof leadSchema>;

/** Campos técnicos del formulario que no forman parte del lead. */
export const LEAD_META_FIELDS = ['cf-turnstile-response', 'website', '_t', 'utm'];
