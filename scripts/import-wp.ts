/*
 * Importación única desde el WordPress antiguo (plan F / C.2 paso 6).
 *
 *  - Blog: WP REST API /wp-json/wp/v2/posts (+ medios destacados e imágenes del contenido)
 *  - Propiedades: el CPT de portafolio no está expuesto en REST, por lo que se lee el HTML estático
 *    de cada /propiedades/{slug}/ (solo texto y URLs de imágenes; NUNCA se ejecuta JS del sitio
 *    comprometido).
 *  - Toda imagen pasa por sharp: se decodifica y re-codifica a WebP (elimina EXIF/GPS y cualquier
 *    payload oculto), se generan variantes 640/1440 px y se guarda en Neon (media + media_blobs).
 *
 * Uso: npm run db:seed            (requiere DATABASE_URL en .env)
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql, eq } from 'drizzle-orm';
import * as s from '../src/lib/server/db/schema';
import {
	PROPERTIES,
	PROPERTY_TYPES,
	LOCATIONS,
	FEATURES,
	POST_CATEGORIES,
	SERVICES
} from './seed-data';

const OLD = 'https://mallerym.cl';
const CACHE = path.resolve('scripts/.cache');
const WIDTHS = [640, 1440];
const MAX_GALLERY = 12;
const MAX_INLINE_IMAGES = 6;

fs.mkdirSync(CACHE, { recursive: true });
const db = drizzle(neon(process.env.DATABASE_URL!), { schema: s });

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const decode = (t: string) =>
	t
		.replace(/&nbsp;/g, ' ')
		.replace(/&#8211;/g, '–')
		.replace(/&#8212;/g, '—')
		.replace(/&#8220;|&#8221;|&#171;|&#187;|&laquo;|&raquo;/g, '"')
		.replace(/&#8216;|&#8217;/g, '’')
		.replace(/&#8230;/g, '…')
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
		.replace(/&quot;/g, '"')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');

async function fetchCached(url: string, binary = false): Promise<Buffer> {
	const key = crypto.createHash('sha1').update(url).digest('hex');
	const file = path.join(CACHE, key);
	if (fs.existsSync(file)) return fs.readFileSync(file);
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const res = await fetch(url, {
				headers: { 'User-Agent': 'MallerM-migration/1.0' },
				signal: AbortSignal.timeout(60_000)
			});
			if (!res.ok) throw new Error(`${res.status} ${url}`);
			const buf = Buffer.from(await res.arrayBuffer());
			fs.writeFileSync(file, buf);
			return buf;
		} catch (e) {
			if (attempt === 2) throw e;
		}
	}
	throw new Error('unreachable');
}

const mediaCache = new Map<string, string>();

/** Descarga → valida (magic bytes vía sharp) → re-codifica → guarda en Neon. Devuelve media.id */
async function importImage(url: string, alt: string, folder: string): Promise<string | null> {
	if (mediaCache.has(url)) return mediaCache.get(url)!;
	let input: Buffer;
	try {
		input = await fetchCached(url, true);
	} catch (e) {
		console.warn('  ! no se pudo descargar', url, (e as Error).message);
		return null;
	}
	let meta: Awaited<ReturnType<ReturnType<typeof sharp>['metadata']>>;
	try {
		meta = await sharp(input).metadata();
		if (!['jpeg', 'png', 'webp', 'avif', 'gif'].includes(meta.format ?? '')) throw new Error('formato no permitido');
	} catch (e) {
		console.warn('  ! archivo rechazado', url, (e as Error).message);
		return null;
	}
	const base = sharp(input, { failOn: 'error' }).rotate(); // aplica orientación EXIF y luego se descarta todo metadato
	const { dominant } = await base.clone().stats();
	const placeholder =
		'#' + [dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, '0')).join('');

	const blobs: { width: number; data: Buffer; w: number; h: number }[] = [];
	for (const w of WIDTHS) {
		const { data, info } = await base
			.clone()
			.resize({ width: w, withoutEnlargement: true })
			.webp({ quality: w <= 640 ? 70 : 72, effort: 5 })
			.toBuffer({ resolveWithObject: true });
		blobs.push({ width: w, data, w: info.width, h: info.height });
	}
	const largest = blobs[blobs.length - 1];
	const sha = crypto.createHash('sha256').update(largest.data).digest('hex');

	const [row] = await db
		.insert(s.media)
		.values({
			kind: 'image',
			folder,
			mime: 'image/webp',
			width: largest.w,
			height: largest.h,
			bytes: largest.data.length,
			sha256: sha,
			altText: alt.slice(0, 200),
			placeholder,
			variants: WIDTHS,
			sourceUrl: url
		})
		.returning({ id: s.media.id });
	for (const b of blobs) {
		await db.insert(s.mediaBlobs).values({
			mediaId: row.id,
			width: b.width,
			mime: 'image/webp',
			bytes: b.data.length,
			data: new Uint8Array(b.data)
		});
	}
	mediaCache.set(url, row.id);
	return row.id;
}

async function pool<T, R>(items: T[], n: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
	const out: R[] = new Array(items.length);
	let i = 0;
	await Promise.all(
		Array.from({ length: n }, async () => {
			while (i < items.length) {
				const idx = i++;
				out[idx] = await fn(items[idx], idx);
			}
		})
	);
	return out;
}

/* ------------------------------------------------------------------ */
/* Propiedades: HTML → texto estructurado                              */
/* ------------------------------------------------------------------ */

const SECTION_RE = /^(descripci[oó]n( y ubicaci[oó]n)?|ubicaci[oó]n( privilegiada)?|caracter[ií]sticas( de las? propiedad(es)?| y condiciones)?|exterior|entorno)\.?:?$/i;

function propertyToMarkdown(lines: string[]): { body: string; summary: string; locationNotes: string } {
	const out: string[] = [];
	let section = '';
	const locLines: string[] = [];
	for (let line of lines) {
		line = line.replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').trim();
		if (!line || /^\[caldera_form/i.test(line) || /^fotograf[ií]as:?$/i.test(line) || line === '.') continue;
		if (SECTION_RE.test(line)) {
			section = line.replace(/[.:]$/, '');
			section = section.charAt(0).toUpperCase() + section.slice(1);
			out.push('', `## ${section}`, '');
			continue;
		}
		if (/^[^.]{2,40}:$/.test(line)) {
			out.push('', `### ${line.replace(/:$/, '')}`, '');
			continue;
		}
		if (/^ubicaci/i.test(section)) locLines.push(line);
		if (/^caracter|^exterior|^entorno/i.test(section) && line.length < 160) out.push(`- ${line}`);
		else out.push('', line, '');
	}
	const body = out
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
	const firstPara = lines.find((l) => l.length > 40 && !SECTION_RE.test(l.trim())) ?? '';
	const summary = firstPara.replace(/\s+/g, ' ').trim().slice(0, 280);
	return { body, summary, locationNotes: locLines.join(' ').slice(0, 600) };
}

function extractProperty(html: string) {
	const i = html.indexOf('<div class="entry-content content"');
	const j = html.indexOf('</article>', i);
	const body = html.slice(i, j);
	const fi = body.search(/Fotograf/i);
	const ci = body.search(/Consultar por esta propiedad/);
	const gal = body.slice(fi > 0 ? fi : 0, ci > 0 ? ci : body.length);
	const images = [
		...new Set(
			[...gal.matchAll(/(https:\/\/mallerym\.cl\/wp-content\/uploads\/[^"' ]+?\.(?:jpe?g|png|webp))/gi)]
				.map((m) => m[1])
				.filter((u) => !/-\d+x\d+\.(jpe?g|png|webp)$/i.test(u))
		)
	];
	const textHtml = body.slice(0, fi > 0 ? fi : ci > 0 ? ci : body.length);
	const lines = decode(
		textHtml
			.replace(/<script[\s\S]*?<\/script>/g, '')
			.replace(/<style[\s\S]*?<\/style>/g, '')
			.replace(/<br\s*\/?>/g, '\n')
			.replace(/<\/(p|li|div|h[1-6])>/g, '\n')
			.replace(/<[^>]+>/g, '')
	)
		.split('\n')
		.map((l) => l.replace(/\s+/g, ' ').trim())
		.filter(Boolean);
	return { images, lines };
}

/* ------------------------------------------------------------------ */
/* Blog: HTML de WordPress → texto estructurado                        */
/* ------------------------------------------------------------------ */

async function postHtmlToMarkdown(html: string, title: string): Promise<string> {
	let h = html
		.replace(/<script[\s\S]*?<\/script>/gi, '')
		.replace(/<style[\s\S]*?<\/style>/gi, '')
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/\[\/?[a-z_]+[^\]]*\]/gi, ''); // shortcodes

	// Imágenes del contenido → biblioteca de medios (máx. MAX_INLINE_IMAGES)
	const imgs = [...h.matchAll(/<img[^>]+>/gi)];
	let count = 0;
	const replacements = new Map<string, string>();
	for (const m of imgs) {
		const tag = m[0];
		const src = (tag.match(/src="([^"]+)"/) || [])[1];
		const alt = decode((tag.match(/alt="([^"]*)"/) || [])[1] || '');
		if (!src || !src.startsWith(OLD) || count >= MAX_INLINE_IMAGES) {
			replacements.set(tag, '');
			continue;
		}
		const full = src.replace(/-\d+x\d+(\.(?:jpe?g|png|webp))$/i, '$1');
		const id = await importImage(full, alt && !/^image$/i.test(alt) ? alt : title, 'blog');
		if (id) {
			count++;
			replacements.set(tag, `\n\n![${(alt && !/^image$/i.test(alt) ? alt : '').replace(/[[\]]/g, '')}](/media/${id})\n\n`);
		} else replacements.set(tag, '');
	}
	for (const [tag, rep] of replacements) h = h.split(tag).join(rep);

	h = h
		.replace(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi, (_, t) => `\n\n## ${t}\n\n`)
		.replace(/<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>/gi, (_, t) => `\n\n### ${t}\n\n`)
		.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `\n- ${t.replace(/\n/g, ' ')}`)
		.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, t) => (t.trim() ? `**${t.trim()}**` : ''))
		.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, t) => (t.trim() ? `*${t.trim()}*` : ''))
		.replace(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, t) => {
			const label = t.replace(/<[^>]+>/g, '').trim();
			if (!label) return '';
			const url = href.startsWith(OLD) ? href.replace(OLD, '') : href;
			return `[${label}](${url})`;
		})
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|div|ul|ol|figure|blockquote)>/gi, '\n\n')
		.replace(/<[^>]+>/g, '');

	return decode(h)
		.split('\n')
		.map((l) => l.replace(/[ \t]+/g, ' ').trim())
		.join('\n')
		.replace(/^(#{2,3}) \*\*(.+)\*\*$/gm, '$1 $2')
		.replace(/^\*\*\s*\*\*$/gm, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/* ------------------------------------------------------------------ */
/* Contraseña (mismo formato que src/lib/server/auth/password.ts)      */
/* ------------------------------------------------------------------ */
async function hashPassword(password: string) {
	const salt = crypto.randomBytes(16);
	const key = await crypto.webcrypto.subtle.importKey('raw', new TextEncoder().encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
	const bits = await crypto.webcrypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 }, key, 256);
	return `pbkdf2_sha256$100000$${salt.toString('base64')}$${Buffer.from(bits).toString('base64')}`;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
	console.log('→ Limpiando datos de contenido…');
	await db.execute(sql`TRUNCATE property_features, property_media, property_prices, property_specs, rental_availability,
		lead_notes, leads, properties, post_category_map, posts, post_categories, services, page_blocks, site_settings,
		team_members, features, locations, property_types, redirects, media_blobs, media RESTART IDENTITY CASCADE`);

	/* Catálogos */
	await db.insert(s.propertyTypes).values(PROPERTY_TYPES);
	const locRows = await db.insert(s.locations).values(LOCATIONS).returning({ id: s.locations.id, slug: s.locations.slug });
	const locId = Object.fromEntries(locRows.map((r) => [r.slug, r.id]));
	await db.insert(s.features).values(FEATURES.map(({ re: _re, group, ...f }) => ({ ...f, groupKey: group })));
	await db.insert(s.postCategories).values(POST_CATEGORIES.map(({ wp: _wp, ...c }) => c));

	/* Imágenes del sitio */
	console.log('→ Imágenes del sitio y equipo…');
	const U = (p: string) => `${OLD}/wp-content/uploads/${p}`;
	const siteImg = {
		hero: await importImage(U('2025/07/IMG-20250708-WA0044.jpg'), 'Surfista en una ola al atardecer en la costa de Maitencillo', 'site'),
		aerial: await importImage(U('2025/07/IMG-20250708-WA0031.jpg'), 'Vista aérea de la playa y el mar en Maitencillo', 'site'),
		paraglide: await importImage(U('2025/08/Foto-a-cambiar-x-aerea-marina.jpg'), 'Parapentes sobre los acantilados y la playa de Maitencillo', 'site'),
		lobos: await importImage(U('2025/07/IMG-20250708-WA0032.jpg'), 'Lobos marinos descansando en la playa', 'site'),
		modular: await importImage(U('2025/08/Casa-modelo-para-Plegahome.jpg'), 'Casa modular plegable con terraza y jardín', 'site'),
		santiago: await importImage(U('2025/08/panoramica_santiago_mallerym.cl_.jpg'), 'Panorámica de Santiago con la cordillera de fondo', 'site'),
		casivar: await importImage(U('2025/08/logo_casivar_300px.png'), 'Logo Casivar Gestión Inmobiliaria', 'site')
	};

	/* Equipo */
	const team = [
		{
			key: 'cecilia', name: 'Cecilia Maller A.', role: 'Socia fundadora y Asesora Inmobiliaria',
			phone: '+56 9 7621 7727', email: 'mallermpropiedades@gmail.com', photo: '2025/07/Integrante2.jpg',
			bio: 'Profesora de Inglés y Asesora Inmobiliaria, con experiencia previa en Engel & Völkers Chicureo y Ciudad Empresarial de Huechuraba y Ponce Propiedades Maitencillo. 7 años en el rubro, con especial foco en Maitencillo y alrededores. Conoce el comportamiento del mercado del litoral y mantiene una red activa de clientes interesados en inversión inmobiliaria.'
		},
		{
			key: 'alicia', name: 'Alicia Manríquez C.', role: 'Socia fundadora y Corredora de Propiedades',
			phone: '+56 9 9591 2021', email: null, photo: '2025/08/Alicia.jpg',
			bio: 'Experiencia en Assisten S.A. (servicios integrales y corretaje de propiedades Santiago–Algarrobo), Inmobiliaria Alto Maitencillo y Costamai Maitencillo. Más de 15 años en el área inmobiliaria de Maitencillo, enfocada en prestar un servicio eficaz y con ética.'
		},
		{
			key: 'carmen', name: 'Carmen Casivar', role: 'Asesora legal',
			phone: null, email: null, photo: '2025/07/Integrante1.jpg', showInContact: false,
			bio: 'Abogada titulada de la U. Gabriela Mistral. Ha desarrollado su carrera en Derecho Civil con énfasis en Derecho Inmobiliario y Sucesorio: estudio de títulos, escrituras de compraventa, contratos privados, cesión de derechos y subdivisión de terrenos rústicos.'
		},
		{
			key: 'catalina', name: 'Catalina Pastén M.', role: 'Diseñadora de interiores',
			phone: '+56 9 4276 2968', email: 'cata.pasten@gmail.com', photo: '2025/07/Integrante3.jpg',
			bio: 'Diseñadora de Interiores titulada de la Universidad del Pacífico, con experiencia en Chile y Nueva Zelanda (The Popular Design, Area Design, Moblash, Freedom Furniture, Nood Furniture). Proyectos residenciales y de oficina centrados en la funcionalidad y el estilo de vida de cada cliente.'
		}
	];
	const teamId: Record<string, string> = {};
	for (const [i, t] of team.entries()) {
		const photoId = await importImage(U(t.photo), `Retrato de ${t.name}, ${t.role}`, 'equipo');
		const [row] = await db
			.insert(s.teamMembers)
			.values({
				name: t.name, role: t.role, bio: t.bio, phone: t.phone, email: t.email, photoId,
				showInContact: t.showInContact ?? true, sortOrder: i
			})
			.returning({ id: s.teamMembers.id });
		teamId[t.key] = row.id;
	}

	/* Propiedades */
	console.log('→ Propiedades…');
	const typeId = Object.fromEntries(PROPERTY_TYPES.map((t) => [t.slug, t.id]));
	const propId: Record<string, string> = {};
	const coverOf: Record<string, string> = {};
	const now = Date.now();
	const redirects: { fromPath: string; toPath: string }[] = [];

	for (const [i, p] of PROPERTIES.entries()) {
		const html = (await fetchCached(`${OLD}/propiedades/${p.slug}/`)).toString('utf8');
		const { images, lines } = extractProperty(html);
		const { body, summary, locationNotes } = propertyToMarkdown(lines);
		const fullText = lines.join(' ');
		const published = new Date(now - i * 9 * 86400_000);
		const [row] = await db
			.insert(s.properties)
			.values({
				slug: p.slug,
				title: p.title,
				operation: p.operation,
				propertyTypeId: typeId[p.type],
				locationId: locId[p.location],
				condominium: p.condominium ?? null,
				summary,
				body: p.note ? body : body,
				locationNotes,
				featured: !!p.featured,
				sortOrder: i,
				publishState: p.duplicateOf ? 'archived' : 'published',
				publishedAt: published,
				agentId: p.agent ? teamId[p.agent] : null,
				metaTitle: null,
				metaDescription: summary.slice(0, 158)
			})
			.returning({ id: s.properties.id });
		propId[p.slug] = row.id;
		await db.insert(s.propertyPrices).values({
			propertyId: row.id,
			amount: p.price.amount,
			currency: p.price.currency,
			period: p.price.period ?? 'total',
			isFrom: !!p.price.from
		});
		await db.insert(s.propertySpecs).values({ propertyId: row.id, ...(p.specs ?? {}) });
		const feats = FEATURES.filter((f) => f.re.test(fullText)).map((f) => ({ propertyId: row.id, featureId: f.id }));
		if (feats.length) await db.insert(s.propertyFeatures).values(feats);

		if (p.duplicateOf) {
			redirects.push({ fromPath: `/propiedades/${p.slug}/`, toPath: `/propiedades/${p.duplicateOf}/` });
			console.log(`  · ${p.slug} (duplicado → archivado + 301)`);
			continue;
		}
		const ids = await pool(images.slice(0, MAX_GALLERY), 4, (u, k) =>
			importImage(u, k === 0 ? p.title : `${p.title} — fotografía ${k + 1}`, 'propiedades')
		);
		const valid = ids.filter((x): x is string => !!x);
		if (valid.length) {
			await db.insert(s.propertyMedia).values(
				valid.map((mediaId, k) => ({ propertyId: row.id, mediaId, role: k === 0 ? 'cover' : 'gallery', sortOrder: k }))
			);
			coverOf[p.slug] = valid[0];
		}
		console.log(`  · ${p.slug} (${valid.length} fotos, ${feats.length} características)`);
	}

	// Temporada de verano para arriendos temporales (demostración de disponibilidad)
	for (const p of PROPERTIES.filter((x) => x.operation === 'arriendo_temporal' && !x.duplicateOf)) {
		await db.insert(s.rentalAvailability).values([
			{ propertyId: propId[p.slug], startsOn: '2026-12-15', endsOn: '2026-12-31', status: 'disponible' },
			{ propertyId: propId[p.slug], startsOn: '2027-01-01', endsOn: '2027-01-15', status: 'ocupado' },
			{ propertyId: propId[p.slug], startsOn: '2027-01-16', endsOn: '2027-02-28', status: 'disponible' }
		]);
	}

	/* Blog */
	console.log('→ Blog…');
	const posts = JSON.parse(
		(await fetchCached(`${OLD}/wp-json/wp/v2/posts?per_page=100&_embed=wp:featuredmedia`)).toString('utf8')
	) as any[];
	for (const wp of posts) {
		const title = decode(wp.title.rendered).replace(/^[“"]|[”»"]$/g, '').trim();
		const body = await postHtmlToMarkdown(wp.content.rendered, title);
		const excerpt = decode(wp.excerpt.rendered.replace(/<[^>]+>/g, ''))
			.replace(/\[…\]|\[&hellip;\]|…$/g, '')
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, 240);
		const fm = wp._embedded?.['wp:featuredmedia']?.[0];
		const coverId = fm?.source_url ? await importImage(fm.source_url, decode(fm.alt_text || '') || title, 'blog') : null;
		const [row] = await db
			.insert(s.posts)
			.values({
				slug: wp.slug,
				title,
				excerpt,
				body,
				coverId,
				authorId: teamId.catalina,
				publishState: 'published',
				publishedAt: new Date(wp.date_gmt + 'Z'),
				metaDescription: excerpt.slice(0, 158)
			})
			.returning({ id: s.posts.id });
		const cats = POST_CATEGORIES.filter((c) => c.wp.some((w) => wp.categories.includes(w)));
		if (!cats.length) cats.push(POST_CATEGORIES[0]);
		await db.insert(s.postCategoryMap).values(cats.map((c) => ({ postId: row.id, categoryId: c.id })));
		redirects.push({ fromPath: `/${wp.slug}/`, toPath: `/blog/${wp.slug}/` });
		console.log(`  · ${wp.slug}`);
	}
	redirects.push({ fromPath: '/blog-2/', toPath: '/blog/' });
	await db.insert(s.redirects).values(redirects.map((r) => ({ ...r, statusCode: 301 })));

	/* Servicios */
	const serviceImages: Record<string, string | null> = {
		compra: coverOf['casa-cond-maitenes-14-900uf'] ?? null,
		venta: coverOf['casa-en-condominio-altavista-zapallar-12-800-uf'] ?? null,
		arriendo: coverOf['departamento-arriendo-temporal-en-papudo-135-000-por-noche'] ?? null,
		diseno: (await db.select({ id: s.posts.coverId }).from(s.posts).where(eq(s.posts.slug, 'decorando-un-airbnb')))[0]?.id ?? null
	};
	await db.insert(s.services).values(
		SERVICES.map((sv, i) => ({ ...sv, imageId: serviceImages[sv.slug], sortOrder: i }))
	);

	/* Bloques de página */
	const santaMaria = 'casas-nuevas-en-santa-maria-de-maitencillo-130m2-desde-11-600uf';
	const smGallery = await db
		.select({ id: s.propertyMedia.mediaId })
		.from(s.propertyMedia)
		.where(eq(s.propertyMedia.propertyId, propId[santaMaria]))
		.orderBy(s.propertyMedia.sortOrder);
	const blocks: { pageKey: string; blockKey: string; data: unknown }[] = [
		{
			pageKey: 'inicio',
			blockKey: 'hero',
			data: {
				eyebrow: 'Corredora de propiedades · Maitencillo',
				title: 'Tu propiedad en la costa, con asesoría integral',
				subtitle:
					'Compra, venta y arriendo desde Papudo a Valparaíso. Marketing, fotografía, gestión legal y acompañamiento hasta la firma.',
				imageId: siteImg.hero
			}
		},
		{
			pageKey: 'inicio',
			blockKey: 'trust',
			data: {
				items: [
					{ value: '15+', label: 'años en el mercado inmobiliario de Maitencillo' },
					{ value: '{propiedades}', label: 'propiedades publicadas' },
					{ value: 'Papudo → Valparaíso', label: 'cobertura en el litoral' },
					{ value: 'Legal y diseño', label: 'asesoría integral en el mismo equipo' }
				]
			}
		},
		{
			pageKey: 'inicio',
			blockKey: 'destacado',
			data: {
				label: 'Destacado',
				title: 'Proyecto Santa María',
				text: 'Preciosas casas en dos pisos, luminosas y muy costeras. Amplios y cómodos espacios que invitan a disfrutar con familia y amigos, tanto dentro como fuera de la propiedad — cerca de Playa Abanico.',
				propertySlug: santaMaria,
				imageIds: smGallery.slice(0, 5).map((g) => g.id),
				ctaLabel: 'Ver proyecto'
			}
		},
		{
			pageKey: 'inicio',
			blockKey: 'promos',
			data: {
				items: [
					{
						title: 'Casas modulares',
						text: 'Compra tu casa modular plegable soñada con nosotros. Beneficios con nuestra corredora: visita técnica gratuita y 50% de descuento en la instalación.',
						imageId: siteImg.modular,
						ctaLabel: '¡Quiero contactarlos!',
						href: '/contacto-y-ubicacion/?motivo=general&mensaje=Me%20interesan%20las%20casas%20modulares'
					},
					{
						title: 'Sitios Raíces del Mauco, Concón',
						text: 'Maravillosos sitios de 1.000 m² muy cerca de la playa, con rol propio y excelente conectividad. Inversión y plusvalía desde 1.079 UF.',
						imageId: coverOf['lotes-raices-del-mauco-concon-desde-1079-uf'] ?? null,
						ctaLabel: 'Ver sitios',
						href: '/propiedades/lotes-raices-del-mauco-concon-desde-1079-uf/'
					}
				]
			}
		},
		{
			pageKey: 'inicio',
			blockKey: 'owner',
			data: {
				title: '¿Quieres vender o arrendar tu propiedad?',
				text: 'Nos encargamos de todo: tasación, fotografía, difusión, visitas y gestión legal. Déjanos tus datos y te llamamos.',
				imageId: siteImg.aerial
			}
		},
		{
			pageKey: 'inicio',
			blockKey: 'partner',
			data: {
				title: '¿Buscas invertir en Santiago?',
				text: 'Tenemos excelentes oportunidades con nuestros partners, encargados de entregarte la mejor opción en la gran capital.',
				ctaLabel: '¡Quiero ver propiedades en Santiago!',
				url: 'https://casivar.cl',
				imageId: siteImg.santiago,
				logoId: siteImg.casivar
			}
		},
		{
			pageKey: 'quienes-somos',
			blockKey: 'intro',
			data: {
				title: 'Una corredora apasionada por la costa',
				text: 'Somos una corredora de propiedades apasionada por lo que hacemos, responsables y creativas. Brindamos un servicio personalizado conectando a nuestros clientes con maravillosos espacios.\n\nOfrecemos un servicio integral que incluye marketing digital, fotografía, gestión legal y acompañamiento hasta la firma. Utilizamos redes sociales y publicidad segmentada para maximizar la visibilidad de cada propiedad.\n\nCubrimos desde Papudo a Valparaíso por la costa, Catapilco y Puchuncaví.',
				imageId: siteImg.paraglide
			}
		},
		{
			pageKey: 'quienes-somos',
			blockKey: 'mision_vision',
			data: {
				mision:
					'Brindar un servicio integral, confiable y personalizado en la gestión de compra, venta y arriendo de bienes raíces, acompañando a nuestros clientes con profesionalismo, transparencia y compromiso en cada etapa del proceso.',
				vision:
					'Ser una corredora de propiedades reconocida por su excelencia, confianza y compromiso en el mercado inmobiliario de la zona; liderar con innovación, ética y cercanía, siendo una de las mejores opciones para quienes desean comprar, vender o arrendar propiedades en la zona.',
				nota: 'Textos de Misión y Visión intercambiados respecto del sitio antiguo (pendiente de confirmar con el cliente).'
			}
		}
	];
	await db.insert(s.pageBlocks).values(blocks);

	/* Configuración */
	const settings: Record<string, unknown> = {
		contact: {
			phones: ['+56 9 7621 7727', '+56 9 9591 2021'],
			whatsapp: '+56 9 7621 7727',
			email: 'mallermpropiedades@gmail.com',
			address: 'Camino Antiguo a Maitencillo; Condominios Las Hermanas, El Mirador parcela 7. Maitencillo.',
			mapQuery: 'Condominios Las Hermanas El Mirador, Maitencillo, Chile',
			hours: ''
		},
		social: {
			instagram: 'https://www.instagram.com/mallermpropiedades/',
			facebook: '',
			linkedin: ''
		},
		seo: {
			siteName: 'Maller&M Propiedades',
			defaultDescription:
				'Corredora de propiedades en Maitencillo: compra, venta y arriendo de casas, departamentos, parcelas y sitios desde Papudo a Valparaíso. Asesoría legal y diseño de interiores.',
			ogImageId: siteImg.hero
		},
		bands: { ctaImageId: siteImg.aerial, lobosImageId: siteImg.lobos }
	};
	await db.insert(s.siteSettings).values(Object.entries(settings).map(([key, value]) => ({ key, value })));

	/* Usuario administrador (solo si no existe) */
	const adminEmail = 'admin@mallerym.cl';
	const existing = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, adminEmail));
	if (!existing.length) {
		const password = crypto.randomBytes(12).toString('base64url');
		await db.insert(s.users).values({
			email: adminEmail,
			name: 'Administrador demo',
			passwordHash: await hashPassword(password),
			role: 'super_admin'
		});
		fs.writeFileSync('.admin-credentials', `email: ${adminEmail}\npassword: ${password}\n`);
		console.log(`\n✔ Usuario creado: ${adminEmail} / ${password}  (guardado en .admin-credentials)`);
	}

	const [{ n }] = (await db.execute(sql`select pg_size_pretty(pg_total_relation_size('media_blobs')) as n`)).rows as any;
	console.log(`\n✔ Importación completa. Tamaño media_blobs: ${n}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
