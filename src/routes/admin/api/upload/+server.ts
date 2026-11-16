import { error, json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { requirePermission, can } from '$lib/server/auth/rbac';
import { putBlob, sniffMime, webpSize } from '$lib/server/storage/media';
import { rateLimit } from '$lib/server/security/ratelimit';
import { audit } from '$lib/server/security/audit';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';

export const trailingSlash = 'always';

const MAX_VARIANT_BYTES = 4 * 1024 * 1024;
const meta = z
	.object({
		alt: z.string().trim().min(3, 'El texto alternativo es obligatorio').max(200),
		folder: z.enum(['propiedades', 'blog', 'equipo', 'site']),
		propertyId: z.string().uuid().optional(),
		width: z.coerce.number().int().min(1).max(2600),
		height: z.coerce.number().int().min(1).max(4000),
		placeholder: z.string().regex(/^#[0-9a-f]{6}$/i).optional()
	})
	.strict();

/** Ancho/alto de un JPEG leyendo el marcador SOF (sin decodificar). */
function jpegSize(b: Uint8Array): { width: number; height: number } | null {
	let i = 2;
	while (i < b.length) {
		if (b[i] !== 0xff) return null;
		const marker = b[i + 1];
		const len = (b[i + 2] << 8) | b[i + 3];
		if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xcb)) {
			return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
		}
		i += 2 + len;
	}
	return null;
}

export const POST: RequestHandler = async (event) => {
	const user = requirePermission(event, 'media:write');
	// Defensa adicional a la verificación de Origin de SvelteKit
	const site = event.request.headers.get('sec-fetch-site');
	if (site && site !== 'same-origin') error(403, 'Origen no permitido');
	if (!(await rateLimit(`upload:${user.id}`, 60, 600))) error(429, 'Demasiadas subidas, espera unos minutos.');

	const len = Number(event.request.headers.get('content-length') ?? 0);
	if (len > 2 * MAX_VARIANT_BYTES + 64 * 1024) error(413, 'Archivo demasiado grande');

	const form = await event.request.formData();
	const fields: Record<string, string> = {};
	for (const [k, v] of form) if (typeof v === 'string') fields[k] = v;
	const parsed = meta.safeParse(fields);
	if (!parsed.success) error(400, parsed.error.issues[0]?.message ?? 'Datos inválidos');
	const m = parsed.data;
	if (m.propertyId && !can(user.role, 'property:write')) error(403, 'Sin permiso');

	const blobs: { width: number; data: Uint8Array; mime: string }[] = [];
	for (const w of [640, 1440]) {
		const file = form.get(`v${w}`);
		if (!(file instanceof File)) error(400, `Falta la variante ${w}`);
		if (file.size > MAX_VARIANT_BYTES) error(413, 'Variante demasiado grande');
		const data = new Uint8Array(await file.arrayBuffer());
		// Magic bytes: solo WebP/JPEG re-codificados (SVG, HTML, PDF, etc. se rechazan)
		const mime = sniffMime(data);
		if (mime !== 'image/webp' && mime !== 'image/jpeg') error(415, 'Tipo de archivo no permitido');
		const size = mime === 'image/webp' ? webpSize(data) : jpegSize(data);
		if (!size || size.width > 2600 || size.height > 4000 || size.width < 1) error(400, 'Dimensiones inválidas');
		if (w === 1440 && (Math.abs(size.width - m.width) > 1 || Math.abs(size.height - m.height) > 1))
			error(400, 'Las dimensiones declaradas no coinciden');
		blobs.push({ width: w, data, mime });
	}
	const largest = blobs[1];
	const [row] = await db
		.insert(s.media)
		.values({
			kind: 'image',
			folder: m.folder,
			mime: largest.mime,
			width: m.width,
			height: m.height,
			bytes: largest.data.byteLength,
			sha256: encodeHexLowerCase(sha256(largest.data)),
			altText: m.alt,
			placeholder: m.placeholder ?? null,
			variants: [640, 1440],
			scanStatus: 'clean',
			createdBy: user.id
		})
		.returning({ id: s.media.id });
	for (const b of blobs) await putBlob(row.id, b.width, b.mime, b.data);

	if (m.propertyId) {
		const res = await db.execute(sql`SELECT coalesce(max(sort_order), -1)::int AS mx, count(*)::int AS n FROM property_media WHERE property_id = ${m.propertyId}`);
		const { mx, n } = res.rows[0] as { mx: number; n: number };
		await db.insert(s.propertyMedia).values({
			propertyId: m.propertyId,
			mediaId: row.id,
			role: n === 0 ? 'cover' : 'gallery',
			sortOrder: mx + 1
		});
	}
	await audit(event, 'media.upload', 'media', row.id, { folder: m.folder, propertyId: m.propertyId, bytes: largest.data.byteLength });
	return json({ id: row.id, width: m.width, height: m.height, alt: m.alt });
};
