import { error, fail, redirect } from '@sveltejs/kit';
import { and, asc, desc, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad, RequestEvent } from './$types';
import { db, schema as s } from '$lib/server/db/client';
import { requirePermission, can } from '$lib/server/auth/rbac';
import { audit } from '$lib/server/security/audit';
import { propertySchema } from '$lib/schemas/property';

const UUID = /^[0-9a-f-]{36}$/;

async function getProperty(id: string) {
	if (!UUID.test(id)) error(404, 'No encontrada');
	const [p] = await db
		.select()
		.from(s.properties)
		.where(and(eq(s.properties.id, id), sql`${s.properties.deletedAt} IS NULL`))
		.limit(1);
	if (!p) error(404, 'Propiedad no encontrada');
	return p;
}

async function gallery(id: string) {
	return db
		.select({ id: s.media.id, alt: s.media.altText, width: s.media.width, height: s.media.height, role: s.propertyMedia.role, sortOrder: s.propertyMedia.sortOrder })
		.from(s.propertyMedia)
		.innerJoin(s.media, eq(s.media.id, s.propertyMedia.mediaId))
		.where(eq(s.propertyMedia.propertyId, id))
		.orderBy(sql`(${s.propertyMedia.role} = 'cover') DESC`, asc(s.propertyMedia.sortOrder));
}

function checklist(p: { metaDescription: string | null; summary: string | null }, price: unknown, specs: Record<string, unknown> | undefined, gal: { alt: string; role: string }[]) {
	const specCount = specs ? Object.entries(specs).filter(([k, v]) => k !== 'propertyId' && v !== null).length : 0;
	return [
		{ ok: gal.some((g) => g.role === 'cover'), label: 'Foto de portada definida' },
		{ ok: gal.length >= 5, label: `Mínimo 5 fotografías (${gal.length})` },
		{ ok: gal.length > 0 && gal.every((g) => g.alt && g.alt.trim().length >= 5), label: 'Texto alternativo en todas las fotos' },
		{ ok: !!price, label: 'Precio con moneda y periodo' },
		{ ok: specCount > 0, label: 'Al menos una superficie o especificación' },
		{ ok: !!(p.summary && p.summary.length >= 40), label: 'Resumen (40+ caracteres)' },
		{ ok: !!p.metaDescription, label: 'Meta descripción SEO' }
	];
}

export const load: PageServerLoad = async (event) => {
	const user = requirePermission(event, 'property:write');
	const p = await getProperty(event.params.id);
	const [specs, prices, allFeatures, selFeatures, gal, ranges, types, locations, agents, leadCount] = await Promise.all([
		db.select().from(s.propertySpecs).where(eq(s.propertySpecs.propertyId, p.id)).limit(1),
		db.select().from(s.propertyPrices).where(eq(s.propertyPrices.propertyId, p.id)).orderBy(desc(s.propertyPrices.validFrom)).limit(6),
		db.select().from(s.features).orderBy(asc(s.features.id)),
		db.select({ id: s.propertyFeatures.featureId }).from(s.propertyFeatures).where(eq(s.propertyFeatures.propertyId, p.id)),
		gallery(p.id),
		db.select().from(s.rentalAvailability).where(eq(s.rentalAvailability.propertyId, p.id)).orderBy(asc(s.rentalAvailability.startsOn)),
		db.select().from(s.propertyTypes).orderBy(asc(s.propertyTypes.id)),
		db.select().from(s.locations).orderBy(asc(s.locations.sector)),
		db.select({ id: s.teamMembers.id, name: s.teamMembers.name }).from(s.teamMembers).orderBy(asc(s.teamMembers.sortOrder)),
		db.execute(sql`SELECT count(*)::int AS n FROM leads WHERE property_id = ${p.id}`)
	]);
	// Detección de posibles duplicados (mismo tipo, zona y condominio)
	const dups = await db
		.select({ id: s.properties.id, title: s.properties.title, slug: s.properties.slug, state: s.properties.publishState })
		.from(s.properties)
		.where(
			and(
				ne(s.properties.id, p.id),
				eq(s.properties.propertyTypeId, p.propertyTypeId),
				eq(s.properties.locationId, p.locationId),
				eq(s.properties.operation, p.operation),
				p.condominium ? eq(s.properties.condominium, p.condominium) : sql`false`,
				sql`${s.properties.deletedAt} IS NULL`
			)
		)
		.limit(5);
	return {
		p,
		specs: specs[0] ?? null,
		prices,
		features: allFeatures,
		selected: selFeatures.map((f) => f.id),
		gallery: gal,
		ranges,
		types,
		locations,
		agents,
		dups,
		leadCount: Number((leadCount.rows[0] as { n: number }).n),
		checklist: checklist(p, prices[0], specs[0] as any, gal),
		canPublish: can(user.role, 'property:publish')
	};
};

async function touch(event: RequestEvent, id: string) {
	await db.update(s.properties).set({ updatedAt: new Date(), updatedBy: event.locals.user!.id }).where(eq(s.properties.id, id));
}

export const actions: Actions = {
	save: async (event) => {
		const user = requirePermission(event, 'property:write');
		const p = await getProperty(event.params.id);
		const form = await event.request.formData();
		const featureIds = form.getAll('feature').map(Number).filter((n) => Number.isInteger(n) && n > 0 && n < 1000);
		const raw: Record<string, string> = {};
		for (const [k, v] of form) if (typeof v === 'string' && k !== 'feature' && !k.startsWith('_')) raw[k] = v;
		const parsed = propertySchema.safeParse(raw);
		if (!parsed.success) {
			const errors: Record<string, string> = {};
			for (const i of parsed.error.issues) errors[String(i.path[0] ?? 'form')] ??= i.message;
			return fail(400, { error: 'Revisa los campos marcados.', errors });
		}
		const d = parsed.data;
		if (d.slug !== p.slug) {
			const taken = await db.select({ id: s.properties.id }).from(s.properties).where(eq(s.properties.slug, d.slug)).limit(1);
			if (taken.length) return fail(400, { error: 'El slug ya está en uso.', errors: { slug: 'Slug duplicado' } });
		}
		// Bloqueo optimista: solo se actualiza si nadie guardó una versión más nueva
		const updated = await db
			.update(s.properties)
			.set({
				title: d.title,
				slug: d.slug,
				operation: d.operation,
				propertyTypeId: d.propertyTypeId,
				locationId: d.locationId,
				condominium: d.condominium,
				summary: d.summary,
				body: d.body,
				locationNotes: d.locationNotes,
				availability: d.availability,
				featured: d.featured,
				agentId: d.agentId,
				metaTitle: d.metaTitle,
				metaDescription: d.metaDescription,
				version: d.version + 1,
				updatedAt: new Date(),
				updatedBy: user.id
			})
			.where(and(eq(s.properties.id, p.id), eq(s.properties.version, d.version)))
			.returning({ id: s.properties.id });
		if (!updated.length) {
			return fail(409, { error: 'Otra persona guardó cambios en esta propiedad mientras editabas. Recarga la página para ver la versión actual.' });
		}
		const specs = {
			builtM2: d.builtM2 ?? null,
			terraceM2: d.terraceM2 ?? null,
			landM2: d.landM2 ?? null,
			bedrooms: d.bedrooms ?? null,
			bathrooms: d.bathrooms ?? null,
			parking: d.parking ?? null,
			floors: d.floors ?? null,
			guests: d.guests ?? null,
			minNights: d.minNights ?? null
		};
		await db.insert(s.propertySpecs).values({ propertyId: p.id, ...specs }).onConflictDoUpdate({ target: s.propertySpecs.propertyId, set: specs });

		// Historial de precios: se inserta una fila nueva solo si cambió
		const [last] = await db.select().from(s.propertyPrices).where(eq(s.propertyPrices.propertyId, p.id)).orderBy(desc(s.propertyPrices.validFrom)).limit(1);
		const priceChanged =
			!last || Number(last.amount) !== d.priceAmount || last.currency !== d.priceCurrency || last.period !== d.pricePeriod || last.isFrom !== d.priceIsFrom;
		if (priceChanged)
			await db.insert(s.propertyPrices).values({ propertyId: p.id, amount: d.priceAmount, currency: d.priceCurrency, period: d.pricePeriod, isFrom: d.priceIsFrom });

		await db.delete(s.propertyFeatures).where(eq(s.propertyFeatures.propertyId, p.id));
		if (featureIds.length) await db.insert(s.propertyFeatures).values(featureIds.map((featureId) => ({ propertyId: p.id, featureId })));

		const changed = (Object.keys(d) as (keyof typeof d)[]).filter((k) => k in p && (p as any)[k] !== (d as any)[k] && k !== 'version');
		await audit(event, 'property.update', 'property', p.id, { changed, priceChanged, ...(priceChanged ? { price: [last?.amount, d.priceAmount] } : {}) });
		if (d.slug !== p.slug && p.publishState === 'published') {
			// Si cambia el slug de una propiedad publicada, el antiguo redirige (no se rompen enlaces compartidos)
			await db
				.insert(s.redirects)
				.values({ fromPath: `/propiedades/${p.slug}/`, toPath: `/propiedades/${d.slug}/`, statusCode: 301 })
				.onConflictDoUpdate({ target: s.redirects.fromPath, set: { toPath: `/propiedades/${d.slug}/` } });
		}
		return { saved: true };
	},

	transition: async (event) => {
		const user = requirePermission(event, 'property:write');
		const p = await getProperty(event.params.id);
		const to = String((await event.request.formData()).get('to'));
		if (!['draft', 'review', 'published', 'archived'].includes(to)) return fail(400, { error: 'Estado inválido' });
		if ((to === 'published' || to === 'archived') && !can(user.role, 'property:publish'))
			return fail(403, { error: 'Tu rol no puede publicar. Envía la propiedad a revisión.' });
		if (to === 'published') {
			const [specs, prices, gal] = await Promise.all([
				db.select().from(s.propertySpecs).where(eq(s.propertySpecs.propertyId, p.id)),
				db.select().from(s.propertyPrices).where(eq(s.propertyPrices.propertyId, p.id)).limit(1),
				gallery(p.id)
			]);
			const missing = checklist(p, prices[0], specs[0] as any, gal).filter((c) => !c.ok);
			if (missing.length) return fail(400, { error: `No se puede publicar todavía: ${missing.map((m) => m.label.toLowerCase()).join('; ')}.` });
		}
		await db
			.update(s.properties)
			.set({ publishState: to as any, publishedAt: to === 'published' ? (p.publishedAt ?? new Date()) : p.publishedAt, updatedAt: new Date(), updatedBy: user.id, version: p.version + 1 })
			.where(eq(s.properties.id, p.id));
		await audit(event, `property.${to}`, 'property', p.id, { from: p.publishState });
		return { saved: true, transitioned: to };
	},

	duplicate: async (event) => {
		const user = requirePermission(event, 'property:write');
		const p = await getProperty(event.params.id);
		const { id: _id, createdAt: _c, updatedAt: _u, publishedAt: _p, version: _v, ...rest } = p;
		const [copy] = await db
			.insert(s.properties)
			.values({ ...rest, slug: `${p.slug}-copia-${Date.now().toString(36)}`, title: `${p.title} (copia)`.slice(0, 140), publishState: 'draft', featured: false, createdBy: user.id, updatedBy: user.id })
			.returning({ id: s.properties.id });
		const [specs] = await db.select().from(s.propertySpecs).where(eq(s.propertySpecs.propertyId, p.id));
		if (specs) await db.insert(s.propertySpecs).values({ ...specs, propertyId: copy.id });
		const [price] = await db.select().from(s.propertyPrices).where(eq(s.propertyPrices.propertyId, p.id)).orderBy(desc(s.propertyPrices.validFrom)).limit(1);
		if (price) await db.insert(s.propertyPrices).values({ propertyId: copy.id, amount: price.amount, currency: price.currency, period: price.period, isFrom: price.isFrom });
		const feats = await db.select().from(s.propertyFeatures).where(eq(s.propertyFeatures.propertyId, p.id));
		if (feats.length) await db.insert(s.propertyFeatures).values(feats.map((f) => ({ ...f, propertyId: copy.id })));
		await audit(event, 'property.duplicate', 'property', copy.id, { from: p.id });
		redirect(303, `/admin/propiedades/${copy.id}/`);
	},

	remove: async (event) => {
		requirePermission(event, 'property:publish');
		const p = await getProperty(event.params.id);
		await db.update(s.properties).set({ deletedAt: new Date(), publishState: 'archived' }).where(eq(s.properties.id, p.id));
		await audit(event, 'property.delete', 'property', p.id, { title: p.title });
		redirect(303, '/admin/propiedades/');
	},

	gallery: async (event) => {
		requirePermission(event, 'property:write');
		const p = await getProperty(event.params.id);
		const form = await event.request.formData();
		const order = form.getAll('order').map(String).filter((x) => UUID.test(x));
		const cover = String(form.get('cover') ?? '');
		const current = await gallery(p.id);
		const valid = new Set(current.map((g) => g.id));
		for (const [i, mediaId] of order.entries()) {
			if (!valid.has(mediaId)) continue;
			await db
				.update(s.propertyMedia)
				.set({ sortOrder: i, role: mediaId === cover ? 'cover' : 'gallery' })
				.where(and(eq(s.propertyMedia.propertyId, p.id), eq(s.propertyMedia.mediaId, mediaId)));
			const alt = String(form.get(`alt_${mediaId}`) ?? '').trim().slice(0, 200);
			if (alt.length >= 3) await db.update(s.media).set({ altText: alt, updatedAt: new Date() }).where(eq(s.media.id, mediaId));
		}
		await touch(event, p.id);
		await audit(event, 'property.gallery', 'property', p.id, { count: order.length, cover });
		return { saved: true };
	},

	galleryRemove: async (event) => {
		requirePermission(event, 'property:write');
		const p = await getProperty(event.params.id);
		const mediaId = String((await event.request.formData()).get('mediaId'));
		if (!UUID.test(mediaId)) return fail(400, { error: 'Imagen inválida' });
		await db.delete(s.propertyMedia).where(and(eq(s.propertyMedia.propertyId, p.id), eq(s.propertyMedia.mediaId, mediaId)));
		// Si ya nadie la usa, se elimina también del almacenamiento
		const used = await db.execute(sql`SELECT
			(SELECT count(*) FROM property_media WHERE media_id = ${mediaId}) + (SELECT count(*) FROM posts WHERE cover_id = ${mediaId})
			+ (SELECT count(*) FROM team_members WHERE photo_id = ${mediaId}) + (SELECT count(*) FROM services WHERE image_id = ${mediaId}) AS n`);
		if (Number((used.rows[0] as { n: number }).n) === 0) await db.delete(s.media).where(eq(s.media.id, mediaId));
		await touch(event, p.id);
		await audit(event, 'property.gallery_remove', 'property', p.id, { mediaId });
		return { saved: true };
	},

	availAdd: async (event) => {
		requirePermission(event, 'property:write');
		const p = await getProperty(event.params.id);
		const f = Object.fromEntries(await event.request.formData());
		const parsed = z
			.object({ startsOn: z.iso.date(), endsOn: z.iso.date(), status: z.enum(['disponible', 'ocupado']) })
			.strict()
			.refine((d) => d.endsOn >= d.startsOn, 'La fecha final debe ser posterior')
			.safeParse(f);
		if (!parsed.success) return fail(400, { error: parsed.error.issues[0].message });
		await db.insert(s.rentalAvailability).values({ propertyId: p.id, ...parsed.data });
		await audit(event, 'property.availability_add', 'property', p.id, parsed.data);
		return { saved: true };
	},

	availRemove: async (event) => {
		requirePermission(event, 'property:write');
		const p = await getProperty(event.params.id);
		const rid = String((await event.request.formData()).get('rid'));
		if (!UUID.test(rid)) return fail(400, { error: 'Inválido' });
		await db.delete(s.rentalAvailability).where(and(eq(s.rentalAvailability.id, rid), eq(s.rentalAvailability.propertyId, p.id)));
		await audit(event, 'property.availability_remove', 'property', p.id, { rid });
		return { saved: true };
	}
};
