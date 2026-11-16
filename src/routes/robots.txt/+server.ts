import type { RequestHandler } from './$types';
import { PUBLIC_SITE_URL } from '$app/env/public';

export const trailingSlash = 'never';

export const GET: RequestHandler = () =>
	new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${PUBLIC_SITE_URL}/sitemap.xml\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' }
	});
