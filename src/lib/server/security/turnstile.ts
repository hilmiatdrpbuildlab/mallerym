import { TURNSTILE_SECRET_KEY } from '$app/env/private';

/** Verificación server-side (siteverify). Se ejecuta ANTES de cualquier otra validación. */
export async function verifyTurnstile(token: FormDataEntryValue | null, ip: string | null): Promise<boolean> {
	if (typeof token !== 'string' || !token || token.length > 2048) return false;
	const body = new FormData();
	body.set('secret', TURNSTILE_SECRET_KEY);
	body.set('response', token);
	if (ip) body.set('remoteip', ip);
	try {
		const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			body,
			signal: AbortSignal.timeout(5000)
		});
		const data = (await res.json()) as { success: boolean };
		return data.success === true;
	} catch {
		return false;
	}
}

/** Honeypot + tiempo mínimo de llenado (3 s). */
export function looksLikeBot(form: FormData): boolean {
	if (String(form.get('website') ?? '') !== '') return true;
	const started = Number(form.get('_t') ?? 0);
	if (!started || Date.now() - started < 3000) return true;
	return false;
}
