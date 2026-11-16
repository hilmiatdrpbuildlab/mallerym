import type { RequestHandler } from './$types';
import { PUBLIC_SITE_URL } from '$app/env/public';
import { listProperties, listPosts, getServices } from '$lib/server/content';

export const trailingSlash = 'never';

export const GET: RequestHandler = async () => {
	const [props, posts, services] = await Promise.all([listProperties({ includeClosed: true, limit: 1000 }), listPosts({ limit: 1000 }), getServices()]);
	const staticPaths = ['/', '/servicios/', '/propiedades/', '/blog/', '/quienes-somos/', '/contacto-y-ubicacion/', '/politica-de-privacidad/'];
	const urls: { loc: string; lastmod?: string }[] = [
		...staticPaths.map((p) => ({ loc: p })),
		...services.map((s) => ({ loc: `/servicios/${s.slug}/`, lastmod: s.updatedAt?.toISOString() })),
		...props.map((p) => ({ loc: `/propiedades/${p.slug}/`, lastmod: p.publishedAt ?? undefined })),
		...posts.map((p) => ({ loc: `/blog/${p.slug}/`, lastmod: p.publishedAt ?? undefined }))
	];
	const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(PUBLIC_SITE_URL + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`;
	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
	});
};
