import { fail, type RequestEvent } from '@sveltejs/kit';
import { leadSchema, LEAD_META_FIELDS } from '$lib/schemas/lead';
import { db, schema as s } from './db/client';
import { verifyTurnstile, looksLikeBot } from './security/turnstile';
import { rateLimit } from './security/ratelimit';
import { hashIp } from './security/crypto';

export type LeadFormState = {
	ok?: boolean;
	error?: string;
	errors?: Record<string, string>;
	values?: Record<string, string>;
};

/**
 * Pipeline de un formulario público:
 * 1) rate limit por IP → 2) honeypot + tiempo mínimo → 3) Turnstile (siteverify) → 4) Zod .strict()
 * → 5) insert parametrizado. El lead nunca se guarda si una capa falla.
 */
export async function handleLeadForm(event: RequestEvent, defaults: Record<string, string> = {}) {
	const ip = event.getClientAddress();
	const form = await event.request.formData();
	const values: Record<string, string> = {};
	for (const [k, v] of form.entries()) if (typeof v === 'string' && !LEAD_META_FIELDS.includes(k)) values[k] = v;

	if (!(await rateLimit(`lead:${await hashIp(ip)}`, 10, 60))) {
		return fail(429, { error: 'Demasiados envíos. Intenta nuevamente en un minuto.', values } satisfies LeadFormState);
	}
	if (looksLikeBot(form)) {
		// Respuesta "exitosa" silenciosa para no dar pistas a bots.
		return { ok: true } satisfies LeadFormState;
	}
	if (!(await verifyTurnstile(form.get('cf-turnstile-response'), ip))) {
		return fail(400, {
			error: 'No pudimos verificar que eres una persona. Recarga la página e inténtalo de nuevo.',
			values
		} satisfies LeadFormState);
	}

	const input: Record<string, string> = { ...defaults };
	for (const [k, v] of Object.entries(values)) if (v !== '') input[k] = v;
	const parsed = leadSchema.safeParse(input);
	if (!parsed.success) {
		const errors: Record<string, string> = {};
		for (const issue of parsed.error.issues) {
			const key = String(issue.path[0] ?? 'form');
			errors[key] ??= issue.code === 'unrecognized_keys' ? 'Campo no permitido' : issue.message;
		}
		return fail(400, { error: 'Revisa los campos marcados.', errors, values } satisfies LeadFormState);
	}
	const d = parsed.data;
	const utm: Record<string, string> = {};
	for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) {
		const v = event.url.searchParams.get(k);
		if (v) utm[k] = v.slice(0, 100);
	}
	await db.insert(s.leads).values({
		type: d.type,
		firstName: d.firstName,
		lastName: d.lastName ?? null,
		email: d.email,
		phone: d.phone ?? null,
		preferredChannel: d.preferredChannel,
		propertyId: d.propertyId ?? null,
		comuna: d.comuna ?? null,
		message: d.message ?? null,
		sourcePage: d.sourcePage ?? event.url.pathname,
		utm: Object.keys(utm).length ? utm : null,
		consentAt: new Date(),
		ipHash: await hashIp(ip)
	});
	return { ok: true } satisfies LeadFormState;
}
