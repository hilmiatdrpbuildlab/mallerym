import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBlob } from '$lib/server/storage/media';

export const trailingSlash = 'never';

const UUID =/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Sirve variantes desde Neon con caché inmutable en el borde de Cloudflare (Cache API).
 * Content-Type fijo + nosniff + sin ejecución: el almacenamiento nunca sirve contenido activo.
 */
export const GET: RequestHandler = async ({ params, request, platform }) => {
	const m = params.file.match(/^(\d{1,4})\.(webp|pdf)$/);
	if (!UUID.test(params.id) || !m) error(404, 'No encontrado');
	const width = Number(m[1]);

	const cache = platform?.caches?.default;
	const cacheKey = new Request(new URL(request.url).toString(), { method: 'GET' });
	if (cache) {
		const hit = await cache.match(cacheKey);
		if (hit) return hit;
	}

	const blob = await getBlob(params.id, width);
	if (!blob) error(404, 'No encontrado');

	const response = new Response(blob.data as unknown as BodyInit, {
		headers: {
			'Content-Type': blob.mime,
			'Content-Length': String(blob.bytes),
			'Cache-Control': 'public, max-age=31536000, immutable',
			'X-Content-Type-Options': 'nosniff',
			'Content-Disposition': blob.mime === 'application/pdf' ? 'attachment' : 'inline',
			'Content-Security-Policy': "default-src 'none'; sandbox",
			'Cross-Origin-Resource-Policy': 'same-site'
		}
	});
	if (cache) platform?.ctx?.waitUntil(cache.put(cacheKey, response.clone()));
	return response;
};
