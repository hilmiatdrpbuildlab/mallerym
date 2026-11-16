/*
 * Adaptador de almacenamiento de medios.
 * Implementación actual: Neon Postgres (tabla media_blobs, bytea) — una sola base de datos para datos y
 * archivos en la demo. La interfaz (put / get / remove) es la misma que tendría un adaptador S3/R2,
 * de modo que migrar a object storage solo requiere cambiar este archivo.
 */
import { and, eq } from 'drizzle-orm';
import { db, schema as s } from '../db/client';

export async function getBlob(mediaId: string, width: number) {
	const rows = await db
		.select({ data: s.mediaBlobs.data, mime: s.mediaBlobs.mime, bytes: s.mediaBlobs.bytes })
		.from(s.mediaBlobs)
		.where(and(eq(s.mediaBlobs.mediaId, mediaId), eq(s.mediaBlobs.width, width)))
		.limit(1);
	return rows[0] ?? null;
}

export async function putBlob(mediaId: string, width: number, mime: string, data: Uint8Array) {
	await db.insert(s.mediaBlobs).values({ mediaId, width, mime, bytes: data.byteLength, data });
}

export async function removeMedia(mediaId: string) {
	await db.delete(s.media).where(eq(s.media.id, mediaId)); // cascade → media_blobs
}

/* ---------------- Validación de archivos (magic bytes) ---------------- */

export function sniffMime(buf: Uint8Array): string | null {
	const b = buf;
	if (b.length < 12) return null;
	if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
		return 'image/webp';
	if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
	if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
	if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return 'application/pdf';
	return null;
}

/** Lee ancho/alto desde la cabecera WebP (VP8 / VP8L / VP8X) sin decodificar. */
export function webpSize(b: Uint8Array): { width: number; height: number } | null {
	const chunk = String.fromCharCode(b[12], b[13], b[14], b[15]);
	if (chunk === 'VP8 ') {
		return { width: (b[26] | (b[27] << 8)) & 0x3fff, height: (b[28] | (b[29] << 8)) & 0x3fff };
	}
	if (chunk === 'VP8L') {
		const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
		return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
	}
	if (chunk === 'VP8X') {
		return {
			width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)),
			height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16))
		};
	}
	return null;
}

/** PDF: rechaza JavaScript, acciones de lanzamiento y archivos embebidos. */
export function pdfLooksDangerous(buf: Uint8Array): boolean {
	const text = new TextDecoder('latin1').decode(buf);
	return /\/(JavaScript|JS|Launch|EmbeddedFile|OpenAction|AA|RichMedia|XFA)\b/.test(text);
}
