import type { RequestHandler } from './$types';
import { PUBLIC_SITE_URL } from '$app/env/public';

export const trailingSlash = 'never';

export const GET: RequestHandler = () => {
	const expires = new Date(Date.now() + 180 * 86400_000).toISOString();
	return new Response(
		`Contact: mailto:seguridad@mallerym.cl\nExpires: ${expires}\nPreferred-Languages: es, en\nCanonical: ${PUBLIC_SITE_URL}/.well-known/security.txt\n`,
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
	);
};
