import { sql, eq, and, isNull, desc, asc, inArray } from 'drizzle-orm';
import { db, schema as s } from './db/client';
import type { Operation, Currency, PricePeriod, Availability } from '$lib/format';

export type MediaRef = {
	id: string;
	alt: string;
	width: number | null;
	height: number | null;
	placeholder: string | null;
};

export type PropertyCard = {
	id: string;
	slug: string;
	title: string;
	operation: Operation;
	availability: Availability;
	featured: boolean;
	typeName: string;
	typeSlug: string;
	sector: string | null;
	comuna: string;
	condominium: string | null;
	summary: string | null;
	publishedAt: string | null;
	price: { amount: number; currency: Currency; period: PricePeriod; isFrom: boolean } | null;
	specs: {
		builtM2: number | null;
		landM2: number | null;
		bedrooms: number | null;
		bathrooms: number | null;
		guests: number | null;
	};
	cover: MediaRef | null;
};

export type PropertyFilters = {
	operacion?: Operation;
	tipo?: string;
	zona?: string;
	min?: number;
	max?: number;
	moneda?: Currency;
	dorm?: number;
	orden?: 'recientes' | 'precio-asc' | 'precio-desc';
	destacadas?: boolean;
	limit?: number;
	excludeId?: string;
	includeClosed?: boolean;
};

const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function rowToCard(r: Record<string, unknown>): PropertyCard {
	return {
		id: r.id as string,
		slug: r.slug as string,
		title: r.title as string,
		operation: r.operation as Operation,
		availability: r.availability as Availability,
		featured: !!r.featured,
		typeName: r.type_name as string,
		typeSlug: r.type_slug as string,
		sector: (r.sector as string) ?? null,
		comuna: r.comuna as string,
		condominium: (r.condominium as string) ?? null,
		summary: (r.summary as string) ?? null,
		publishedAt: r.published_at ? new Date(r.published_at as string).toISOString() : null,
		price:
			r.price_amount !== null && r.price_amount !== undefined
				? {
						amount: Number(r.price_amount),
						currency: r.price_currency as Currency,
						period: r.price_period as PricePeriod,
						isFrom: !!r.price_is_from
					}
				: null,
		specs: {
			builtM2: n(r.built_m2),
			landM2: n(r.land_m2),
			bedrooms: n(r.bedrooms),
			bathrooms: n(r.bathrooms),
			guests: n(r.guests)
		},
		cover: r.cover_id
			? {
					id: r.cover_id as string,
					alt: (r.cover_alt as string) ?? '',
					width: n(r.cover_w),
					height: n(r.cover_h),
					placeholder: (r.cover_ph as string) ?? null
				}
			: null
	};
}

/** Listado público: solo filas published y sin soft-delete. Todo parametrizado. */
export async function listProperties(f: PropertyFilters = {}): Promise<PropertyCard[]> {
	const where = [sql`p.publish_state = 'published'`, sql`p.deleted_at IS NULL`];
	if (!f.includeClosed) where.push(sql`p.availability IN ('disponible','reservada')`);
	if (f.operacion) where.push(sql`p.operation = ${f.operacion}`);
	if (f.tipo) where.push(sql`t.slug = ${f.tipo}`);
	if (f.zona) where.push(sql`l.slug = ${f.zona}`);
	if (f.destacadas) where.push(sql`p.featured = true`);
	if (f.dorm) where.push(sql`sp.bedrooms >= ${f.dorm}`);
	if (f.excludeId) where.push(sql`p.id <> ${f.excludeId}`);
	if (f.moneda && (f.min || f.max)) {
		where.push(sql`pr.currency = ${f.moneda}`);
		if (f.min) where.push(sql`pr.amount >= ${f.min}`);
		if (f.max) where.push(sql`pr.amount <= ${f.max}`);
	}
	const order =
		f.orden === 'precio-asc'
			? sql`pr.currency DESC, pr.amount ASC NULLS LAST`
			: f.orden === 'precio-desc'
				? sql`pr.currency DESC, pr.amount DESC NULLS LAST`
				: sql`p.published_at DESC NULLS LAST, p.sort_order ASC`;

	const res = await db.execute(sql`
		SELECT p.id, p.slug, p.title, p.operation, p.availability, p.featured, p.condominium, p.summary, p.published_at,
		       t.name AS type_name, t.slug AS type_slug, l.sector, l.comuna,
		       pr.amount AS price_amount, pr.currency AS price_currency, pr.period AS price_period, pr.is_from AS price_is_from,
		       sp.built_m2, sp.land_m2, sp.bedrooms, sp.bathrooms, sp.guests,
		       m.id AS cover_id, m.alt_text AS cover_alt, m.width AS cover_w, m.height AS cover_h, m.placeholder AS cover_ph
		FROM properties p
		JOIN property_types t ON t.id = p.property_type_id
		JOIN locations l ON l.id = p.location_id
		LEFT JOIN property_specs sp ON sp.property_id = p.id
		LEFT JOIN LATERAL (
			SELECT amount, currency, period, is_from FROM property_prices
			WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1
		) pr ON true
		LEFT JOIN LATERAL (
			SELECT pm.media_id FROM property_media pm WHERE pm.property_id = p.id
			ORDER BY (pm.role = 'cover') DESC, pm.sort_order ASC LIMIT 1
		) c ON true
		LEFT JOIN media m ON m.id = c.media_id
		WHERE ${sql.join(where, sql` AND `)}
		ORDER BY ${order}
		LIMIT ${f.limit ?? 200}`);
	return (res.rows as Record<string, unknown>[]).map(rowToCard);
}

export async function getPropertyBySlug(slug: string, { preview = false } = {}) {
	const rows = await db.execute(sql`
		SELECT p.*, t.name AS type_name, t.slug AS type_slug, l.sector, l.comuna, l.region, l.lat, l.lng, l.slug AS location_slug,
		       sp.built_m2, sp.terrace_m2, sp.land_m2, sp.bedrooms, sp.bathrooms, sp.parking, sp.floors, sp.guests, sp.min_nights,
		       tm.name AS agent_name, tm.role AS agent_role, tm.phone AS agent_phone, tm.email AS agent_email, tm.photo_id AS agent_photo
		FROM properties p
		JOIN property_types t ON t.id = p.property_type_id
		JOIN locations l ON l.id = p.location_id
		LEFT JOIN property_specs sp ON sp.property_id = p.id
		LEFT JOIN team_members tm ON tm.id = p.agent_id
		WHERE p.slug = ${slug} AND p.deleted_at IS NULL
		  AND (${preview} OR p.publish_state = 'published')
		LIMIT 1`);
	const p = rows.rows[0] as Record<string, any> | undefined;
	if (!p) return null;

	const [prices, gallery, feats, avail] = await Promise.all([
		db
			.select()
			.from(s.propertyPrices)
			.where(eq(s.propertyPrices.propertyId, p.id))
			.orderBy(desc(s.propertyPrices.validFrom))
			.limit(1),
		db
			.select({
				id: s.media.id,
				alt: s.media.altText,
				width: s.media.width,
				height: s.media.height,
				placeholder: s.media.placeholder,
				role: s.propertyMedia.role,
				caption: s.propertyMedia.caption
			})
			.from(s.propertyMedia)
			.innerJoin(s.media, eq(s.media.id, s.propertyMedia.mediaId))
			.where(eq(s.propertyMedia.propertyId, p.id))
			.orderBy(sql`(${s.propertyMedia.role} = 'cover') DESC`, asc(s.propertyMedia.sortOrder)),
		db
			.select({ name: s.features.name, group: s.features.groupKey, slug: s.features.slug })
			.from(s.propertyFeatures)
			.innerJoin(s.features, eq(s.features.id, s.propertyFeatures.featureId))
			.where(eq(s.propertyFeatures.propertyId, p.id))
			.orderBy(asc(s.features.id)),
		db
			.select()
			.from(s.rentalAvailability)
			.where(eq(s.rentalAvailability.propertyId, p.id))
			.orderBy(asc(s.rentalAvailability.startsOn))
	]);
	const price = prices[0];
	return {
		id: p.id as string,
		slug: p.slug as string,
		title: p.title as string,
		operation: p.operation as Operation,
		availability: p.availability as Availability,
		publishState: p.publish_state as string,
		featured: !!p.featured,
		condominium: p.condominium as string | null,
		summary: p.summary as string | null,
		body: p.body as string,
		locationNotes: p.location_notes as string | null,
		typeName: p.type_name as string,
		typeSlug: p.type_slug as string,
		propertyTypeId: Number(p.property_type_id),
		locationId: p.location_id as string,
		location: {
			slug: p.location_slug as string,
			sector: p.sector as string,
			comuna: p.comuna as string,
			region: p.region as string,
			lat: n(p.lat),
			lng: n(p.lng)
		},
		specs: {
			builtM2: n(p.built_m2),
			terraceM2: n(p.terrace_m2),
			landM2: n(p.land_m2),
			bedrooms: n(p.bedrooms),
			bathrooms: n(p.bathrooms),
			parking: n(p.parking),
			floors: n(p.floors),
			guests: n(p.guests),
			minNights: n(p.min_nights)
		},
		price: price
			? {
					amount: Number(price.amount),
					currency: price.currency,
					period: price.period,
					isFrom: price.isFrom
				}
			: null,
		gallery,
		features: feats,
		availabilityRanges: avail,
		agent: p.agent_name
			? {
					name: p.agent_name as string,
					role: p.agent_role as string,
					phone: p.agent_phone as string | null,
					email: p.agent_email as string | null,
					photoId: p.agent_photo as string | null
				}
			: null,
		metaTitle: p.meta_title as string | null,
		metaDescription: p.meta_description as string | null,
		publishedAt: p.published_at ? new Date(p.published_at).toISOString() : null,
		updatedAt: new Date(p.updated_at).toISOString()
	};
}
export type PropertyDetail = NonNullable<Awaited<ReturnType<typeof getPropertyBySlug>>>;

export async function getFilterOptions() {
	const [types, locs] = await Promise.all([
		db.execute(sql`SELECT t.slug, t.plural AS name, count(p.id)::int AS n FROM property_types t
			JOIN properties p ON p.property_type_id = t.id AND p.publish_state='published' AND p.deleted_at IS NULL
			GROUP BY t.id ORDER BY t.id`),
		db.execute(sql`SELECT l.slug, l.sector AS name, l.comuna, count(p.id)::int AS n FROM locations l
			JOIN properties p ON p.location_id = l.id AND p.publish_state='published' AND p.deleted_at IS NULL
			GROUP BY l.id ORDER BY count(p.id) DESC, l.sector`)
	]);
	return {
		types: types.rows as { slug: string; name: string; n: number }[],
		zones: locs.rows as { slug: string; name: string; comuna: string; n: number }[]
	};
}

/* --------------------------- Blog --------------------------- */

export type PostCard = {
	id: string;
	slug: string;
	title: string;
	excerpt: string;
	publishedAt: string | null;
	cover: MediaRef | null;
	categories: { slug: string; name: string }[];
	readingMinutes: number;
};

export async function listPosts(opts: { categoria?: string; limit?: number; excludeId?: string } = {}) {
	const where = [sql`p.publish_state = 'published'`, sql`p.deleted_at IS NULL`, sql`p.published_at <= now()`];
	if (opts.categoria)
		where.push(
			sql`EXISTS (SELECT 1 FROM post_category_map pcm JOIN post_categories pc ON pc.id = pcm.category_id WHERE pcm.post_id = p.id AND pc.slug = ${opts.categoria})`
		);
	if (opts.excludeId) where.push(sql`p.id <> ${opts.excludeId}`);
	const res = await db.execute(sql`
		SELECT p.id, p.slug, p.title, p.excerpt, p.published_at, length(p.body) AS body_len,
		       m.id AS cover_id, m.alt_text AS cover_alt, m.width AS cover_w, m.height AS cover_h, m.placeholder AS cover_ph,
		       coalesce((SELECT json_agg(json_build_object('slug', pc.slug, 'name', pc.name) ORDER BY pc.id)
		                 FROM post_category_map pcm JOIN post_categories pc ON pc.id = pcm.category_id
		                 WHERE pcm.post_id = p.id), '[]') AS categories
		FROM posts p LEFT JOIN media m ON m.id = p.cover_id
		WHERE ${sql.join(where, sql` AND `)}
		ORDER BY p.published_at DESC
		LIMIT ${opts.limit ?? 100}`);
	return (res.rows as Record<string, any>[]).map(
		(r): PostCard => ({
			id: r.id,
			slug: r.slug,
			title: r.title,
			excerpt: r.excerpt,
			publishedAt: r.published_at ? new Date(r.published_at).toISOString() : null,
			cover: r.cover_id
				? { id: r.cover_id, alt: r.cover_alt, width: n(r.cover_w), height: n(r.cover_h), placeholder: r.cover_ph }
				: null,
			categories: typeof r.categories === 'string' ? JSON.parse(r.categories) : r.categories,
			readingMinutes: Math.max(1, Math.round(Number(r.body_len) / 6 / 200))
		})
	);
}

export async function listPostCategories() {
	const res = await db.execute(sql`SELECT pc.slug, pc.name, count(p.id)::int AS n FROM post_categories pc
		JOIN post_category_map m ON m.category_id = pc.id
		JOIN posts p ON p.id = m.post_id AND p.publish_state = 'published' AND p.deleted_at IS NULL
		GROUP BY pc.id ORDER BY pc.id`);
	return res.rows as { slug: string; name: string; n: number }[];
}

export async function getPostBySlug(slug: string, { preview = false } = {}) {
	const rows = await db
		.select({
			post: s.posts,
			cover: { id: s.media.id, alt: s.media.altText, width: s.media.width, height: s.media.height, placeholder: s.media.placeholder },
			author: { name: s.teamMembers.name, role: s.teamMembers.role, photoId: s.teamMembers.photoId }
		})
		.from(s.posts)
		.leftJoin(s.media, eq(s.media.id, s.posts.coverId))
		.leftJoin(s.teamMembers, eq(s.teamMembers.id, s.posts.authorId))
		.where(
			and(
				eq(s.posts.slug, slug),
				isNull(s.posts.deletedAt),
				preview ? undefined : eq(s.posts.publishState, 'published')
			)
		)
		.limit(1);
	const r = rows[0];
	if (!r) return null;
	const cats = await db
		.select({ slug: s.postCategories.slug, name: s.postCategories.name })
		.from(s.postCategoryMap)
		.innerJoin(s.postCategories, eq(s.postCategories.id, s.postCategoryMap.categoryId))
		.where(eq(s.postCategoryMap.postId, r.post.id));
	return { ...r.post, cover: r.cover?.id ? r.cover : null, author: r.author?.name ? r.author : null, categories: cats };
}

export async function mediaMeta(ids: string[]) {
	if (!ids.length) return {};
	const rows = await db
		.select({ id: s.media.id, width: s.media.width, height: s.media.height })
		.from(s.media)
		.where(inArray(s.media.id, ids));
	return Object.fromEntries(rows.map((r) => [r.id, r]));
}

/* --------------------------- Sitio --------------------------- */

export type SiteSettings = {
	contact: {
		phones: string[];
		whatsapp: string;
		email: string;
		address: string;
		mapQuery: string;
		hours: string;
	};
	social: { instagram: string; facebook: string; linkedin: string };
	seo: { siteName: string; defaultDescription: string; ogImageId: string | null };
	bands: { ctaImageId: string | null; lobosImageId: string | null };
};

export async function getSettings(): Promise<SiteSettings> {
	const rows = await db.select().from(s.siteSettings);
	const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
	return {
		contact: { phones: [], whatsapp: '', email: '', address: '', mapQuery: '', hours: '', ...(map.contact as object) },
		social: { instagram: '', facebook: '', linkedin: '', ...(map.social as object) },
		seo: { siteName: 'Maller&M Propiedades', defaultDescription: '', ogImageId: null, ...(map.seo as object) },
		bands: { ctaImageId: null, lobosImageId: null, ...(map.bands as object) }
	} as SiteSettings;
}

export async function getBlocks<T = Record<string, any>>(pageKey: string): Promise<Record<string, T>> {
	const rows = await db.select().from(s.pageBlocks).where(eq(s.pageBlocks.pageKey, pageKey));
	return Object.fromEntries(rows.map((r) => [r.blockKey, r.data as T]));
}

export async function getTeam(onlyContact = false) {
	const rows = await db
		.select()
		.from(s.teamMembers)
		.where(onlyContact ? eq(s.teamMembers.showInContact, true) : undefined)
		.orderBy(asc(s.teamMembers.sortOrder));
	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		role: r.role,
		bio: r.bio,
		phone: r.phone,
		email: r.email,
		photoId: r.photoId,
		showInContact: r.showInContact
	}));
}

export async function getServices() {
	return db.select().from(s.services).orderBy(asc(s.services.sortOrder));
}

export async function getService(slug: string) {
	const rows = await db.select().from(s.services).where(eq(s.services.slug, slug)).limit(1);
	return rows[0] ?? null;
}

/* --------------------------- UF --------------------------- */

/**
 * Valor UF del día (mindicador.cl, fuente: Banco Central). Caché 24 h en site_settings.
 * Si la API falla y no hay caché reciente (< 72 h), se devuelve null y la UI oculta la estimación CLP
 * en lugar de inventarla.
 */
export async function getUF(): Promise<{ value: number; date: string } | null> {
	const rows = await db.select().from(s.siteSettings).where(eq(s.siteSettings.key, 'uf')).limit(1);
	const cached = rows[0]?.value as { value: number; date: string; fetchedAt: number } | undefined;
	if (cached && Date.now() - cached.fetchedAt < 24 * 3600_000) return cached;
	try {
		const res = await fetch('https://mindicador.cl/api/uf', { signal: AbortSignal.timeout(2500) });
		const data = (await res.json()) as { serie: { fecha: string; valor: number }[] };
		const last = data.serie?.[0];
		if (!last?.valor) throw new Error('sin datos');
		const value = { value: last.valor, date: last.fecha, fetchedAt: Date.now() };
		await db
			.insert(s.siteSettings)
			.values({ key: 'uf', value })
			.onConflictDoUpdate({ target: s.siteSettings.key, set: { value, updatedAt: new Date() } });
		return value;
	} catch {
		if (cached && Date.now() - cached.fetchedAt < 72 * 3600_000) return cached;
		return null;
	}
}
