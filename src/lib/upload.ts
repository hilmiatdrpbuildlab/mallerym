/*
 * Procesamiento de imágenes en el navegador antes de subir (plan C.2 paso 1, adaptado a Workers):
 * se decodifica y re-codifica en canvas → se descartan EXIF/GPS y cualquier payload oculto,
 * se generan variantes 1440/640 px. El servidor vuelve a validar magic bytes, tamaño y dimensiones.
 */
export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];
export const MAX_INPUT_BYTES = 20 * 1024 * 1024;
export const WIDTHS = [640, 1440] as const;

export type Processed = {
	variants: Record<number, Blob>;
	width: number;
	height: number;
	placeholder: string;
	mime: string;
};

async function encode(canvas: HTMLCanvasElement): Promise<Blob> {
	const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.8));
	if (webp && webp.type === 'image/webp') return webp;
	// Safari no codifica WebP en canvas → JPEG (igualmente re-codificado y sin metadatos)
	const jpg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.84));
	if (!jpg) throw new Error('No se pudo procesar la imagen');
	return jpg;
}

export async function processImage(file: File): Promise<Processed> {
	if (!ACCEPTED.includes(file.type)) throw new Error(`Formato no permitido (${file.type || 'desconocido'}). Usa JPG, PNG, WebP o AVIF.`);
	if (file.size > MAX_INPUT_BYTES) throw new Error('La imagen supera 20 MB.');
	let bmp: ImageBitmap;
	try {
		bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
	} catch {
		throw new Error('El archivo no es una imagen válida.');
	}
	if (bmp.width < 320 || bmp.height < 200) throw new Error('La imagen es demasiado pequeña (mín. 320×200 px).');

	const variants: Record<number, Blob> = {};
	let outW = 0;
	let outH = 0;
	let mime = 'image/webp';
	for (const w of WIDTHS) {
		const scale = Math.min(1, w / bmp.width);
		const cw = Math.round(bmp.width * scale);
		const ch = Math.round(bmp.height * scale);
		const c = document.createElement('canvas');
		c.width = cw;
		c.height = ch;
		const ctx = c.getContext('2d')!;
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(bmp, 0, 0, cw, ch);
		const blob = await encode(c);
		variants[w] = blob;
		mime = blob.type;
		if (w === 1440) {
			outW = cw;
			outH = ch;
		}
	}
	const p = document.createElement('canvas');
	p.width = p.height = 1;
	const pctx = p.getContext('2d')!;
	pctx.drawImage(bmp, 0, 0, 1, 1);
	const [r, g, b] = pctx.getImageData(0, 0, 1, 1).data;
	bmp.close();
	return {
		variants,
		width: outW,
		height: outH,
		placeholder: '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join(''),
		mime
	};
}

export async function uploadImage(
	file: File,
	opts: { alt: string; folder: string; propertyId?: string },
	onProgress?: (msg: string) => void
): Promise<{ id: string; width: number; height: number; alt: string }> {
	onProgress?.('Procesando…');
	const p = await processImage(file);
	const fd = new FormData();
	fd.set('alt', opts.alt);
	fd.set('folder', opts.folder);
	if (opts.propertyId) fd.set('propertyId', opts.propertyId);
	fd.set('width', String(p.width));
	fd.set('height', String(p.height));
	fd.set('placeholder', p.placeholder);
	for (const w of WIDTHS) fd.set(`v${w}`, p.variants[w], `${w}.${p.mime === 'image/webp' ? 'webp' : 'jpg'}`);
	onProgress?.('Subiendo…');
	const res = await fetch('/admin/api/upload/', { method: 'POST', body: fd, headers: { 'x-requested-with': 'fetch' } });
	const data = (await res.json().catch(() => ({}))) as { message?: string; id: string; width: number; height: number; alt: string };
	if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);
	return data;
}
