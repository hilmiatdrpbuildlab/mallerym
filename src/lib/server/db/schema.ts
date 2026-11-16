import { sql } from 'drizzle-orm';
import {
	pgTable,
	pgEnum,
	uuid,
	text,
	integer,
	smallint,
	boolean,
	timestamp,
	numeric,
	jsonb,
	customType,
	primaryKey,
	index,
	uniqueIndex,
	date,
	doublePrecision,
	check
} from 'drizzle-orm/pg-core';

/* ------------------------------------------------------------------ */
/* Tipos auxiliares                                                    */
/* ------------------------------------------------------------------ */

/** bytea <-> Uint8Array. El driver HTTP de Neon devuelve bytea como texto hex ("\\x…"). */
export const bytea = customType<{ data: Uint8Array; driverData: string | Uint8Array }>({
	dataType: () => 'bytea',
	toDriver: (value) => '\\x' + Array.from(value, (b) => b.toString(16).padStart(2, '0')).join(''),
	fromDriver: (value) => {
		if (typeof value !== 'string') return new Uint8Array(value as Uint8Array);
		const hex = value.startsWith('\\x') ? value.slice(2) : value;
		const out = new Uint8Array(hex.length / 2);
		for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
		return out;
	}
});

const id = () =>
	uuid('id')
		.primaryKey()
		.default(sql`uuidv7()`);

const audit = {
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
};

export const roleEnum = pgEnum('role', ['super_admin', 'editor', 'corredor', 'viewer']);
export const operationEnum = pgEnum('operation', ['venta', 'arriendo_anual', 'arriendo_temporal']);
export const publishStateEnum = pgEnum('publish_state', ['draft', 'review', 'published', 'archived']);
export const availabilityEnum = pgEnum('availability', ['disponible', 'reservada', 'vendida', 'arrendada']);
export const currencyEnum = pgEnum('currency', ['UF', 'CLP']);
export const pricePeriodEnum = pgEnum('price_period', ['total', 'mes', 'noche', 'dia']);
export const leadTypeEnum = pgEnum('lead_type', [
	'consulta_propiedad',
	'quiero_vender',
	'quiero_arrendar',
	'diseno',
	'general'
]);
export const leadStatusEnum = pgEnum('lead_status', [
	'nuevo',
	'contactado',
	'visita',
	'negociacion',
	'cerrado',
	'spam'
]);
export const channelEnum = pgEnum('contact_channel', ['whatsapp', 'correo', 'telefono']);

/* ------------------------------------------------------------------ */
/* Identidad y acceso                                                  */
/* ------------------------------------------------------------------ */

export const users = pgTable('users', {
	id: id(),
	email: text('email').notNull().unique(),
	name: text('name').notNull(),
	passwordHash: text('password_hash').notNull(),
	role: roleEnum('role').notNull().default('viewer'),
	active: boolean('active').notNull().default(true),
	mfaEnabled: boolean('mfa_enabled').notNull().default(false),
	totpSecretEnc: text('totp_secret_enc'),
	failedAttempts: integer('failed_attempts').notNull().default(0),
	lockedUntil: timestamp('locked_until', { withTimezone: true }),
	lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
	...audit
});

export const sessions = pgTable(
	'sessions',
	{
		id: text('id').primaryKey(), // SHA-256(token) en hex
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		absoluteExpiresAt: timestamp('absolute_expires_at', { withTimezone: true }).notNull(),
		mfaVerifiedAt: timestamp('mfa_verified_at', { withTimezone: true }),
		ipHash: text('ip_hash'),
		userAgent: text('user_agent'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('sessions_user_idx').on(t.userId), index('sessions_expires_idx').on(t.expiresAt)]
);

export const recoveryCodes = pgTable('recovery_codes', {
	id: id(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	codeHash: text('code_hash').notNull(),
	usedAt: timestamp('used_at', { withTimezone: true })
});

export const auditLogs = pgTable(
	'audit_logs',
	{
		id: id(),
		actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
		actorEmail: text('actor_email'),
		action: text('action').notNull(),
		entity: text('entity').notNull(),
		entityId: text('entity_id'),
		diff: jsonb('diff'),
		ipHash: text('ip_hash'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('audit_created_idx').on(t.createdAt)]
);

export const rateLimits = pgTable('rate_limits', {
	key: text('key').primaryKey(),
	count: integer('count').notNull(),
	resetAt: timestamp('reset_at', { withTimezone: true }).notNull()
});

/* ------------------------------------------------------------------ */
/* Media (almacenada en Neon)                                          */
/* ------------------------------------------------------------------ */

export const media = pgTable('media', {
	id: id(),
	kind: text('kind').notNull().default('image'), // image | pdf
	folder: text('folder').notNull().default('site'), // propiedades | blog | equipo | site
	mime: text('mime').notNull(),
	width: integer('width'),
	height: integer('height'),
	bytes: integer('bytes').notNull(),
	sha256: text('sha256').notNull(),
	altText: text('alt_text').notNull(),
	placeholder: text('placeholder'), // color dominante #rrggbb
	variants: jsonb('variants').$type<number[]>().notNull().default([]),
	scanStatus: text('scan_status').notNull().default('clean'),
	sourceUrl: text('source_url'),
	createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
	...audit
});

export const mediaBlobs = pgTable(
	'media_blobs',
	{
		mediaId: uuid('media_id')
			.notNull()
			.references(() => media.id, { onDelete: 'cascade' }),
		width: integer('width').notNull(), // 0 = original (PDF)
		mime: text('mime').notNull(),
		bytes: integer('bytes').notNull(),
		data: bytea('data').notNull()
	},
	(t) => [primaryKey({ columns: [t.mediaId, t.width] })]
);

/* ------------------------------------------------------------------ */
/* Propiedades                                                         */
/* ------------------------------------------------------------------ */

export const propertyTypes = pgTable('property_types', {
	id: smallint('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	plural: text('plural').notNull()
});

export const locations = pgTable('locations', {
	id: id(),
	slug: text('slug').notNull().unique(),
	region: text('region').notNull().default('Valparaíso'),
	comuna: text('comuna').notNull(),
	sector: text('sector'),
	lat: doublePrecision('lat'),
	lng: doublePrecision('lng')
});

export const teamMembers = pgTable('team_members', {
	id: id(),
	name: text('name').notNull(),
	role: text('role').notNull(),
	bio: text('bio').notNull().default(''),
	phone: text('phone'),
	email: text('email'),
	photoId: uuid('photo_id').references(() => media.id, { onDelete: 'set null' }),
	showInContact: boolean('show_in_contact').notNull().default(true),
	sortOrder: integer('sort_order').notNull().default(0),
	...audit
});

export const properties = pgTable(
	'properties',
	{
		id: id(),
		slug: text('slug').notNull().unique(),
		title: text('title').notNull(),
		operation: operationEnum('operation').notNull(),
		propertyTypeId: smallint('property_type_id')
			.notNull()
			.references(() => propertyTypes.id),
		locationId: uuid('location_id')
			.notNull()
			.references(() => locations.id),
		condominium: text('condominium'),
		summary: text('summary'),
		body: text('body').notNull().default(''), // texto estructurado (Markdown limitado, ver lib/richtext)
		locationNotes: text('location_notes'),
		availability: availabilityEnum('availability').notNull().default('disponible'),
		featured: boolean('featured').notNull().default(false),
		sortOrder: integer('sort_order').notNull().default(0),
		publishState: publishStateEnum('publish_state').notNull().default('draft'),
		publishedAt: timestamp('published_at', { withTimezone: true }),
		agentId: uuid('agent_id').references(() => teamMembers.id, { onDelete: 'set null' }),
		metaTitle: text('meta_title'),
		metaDescription: text('meta_description'),
		version: integer('version').notNull().default(1),
		createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
		updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
		deletedAt: timestamp('deleted_at', { withTimezone: true }),
		...audit
	},
	(t) => [
		index('properties_public_idx')
			.on(t.publishState, t.operation, t.propertyTypeId, t.locationId)
			.where(sql`${t.deletedAt} IS NULL`),
		check('properties_slug_chk', sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
		check('properties_title_chk', sql`char_length(${t.title}) BETWEEN 5 AND 140`)
	]
);

export const propertyPrices = pgTable(
	'property_prices',
	{
		id: id(),
		propertyId: uuid('property_id')
			.notNull()
			.references(() => properties.id, { onDelete: 'cascade' }),
		amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
		currency: currencyEnum('currency').notNull(),
		period: pricePeriodEnum('period').notNull().default('total'),
		isFrom: boolean('is_from').notNull().default(false),
		validFrom: timestamp('valid_from', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('property_prices_prop_idx').on(t.propertyId, t.validFrom), check('price_pos', sql`${t.amount} > 0`)]
);

export const propertySpecs = pgTable(
	'property_specs',
	{
		propertyId: uuid('property_id')
			.primaryKey()
			.references(() => properties.id, { onDelete: 'cascade' }),
		builtM2: numeric('built_m2', { mode: 'number' }),
		terraceM2: numeric('terrace_m2', { mode: 'number' }),
		landM2: numeric('land_m2', { mode: 'number' }),
		bedrooms: smallint('bedrooms'),
		bathrooms: smallint('bathrooms'),
		parking: smallint('parking'),
		floors: smallint('floors'),
		guests: smallint('guests'),
		minNights: smallint('min_nights')
	},
	(t) => [index('specs_filter_idx').on(t.bedrooms, t.builtM2, t.landM2)]
);

export const features = pgTable('features', {
	id: smallint('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	groupKey: text('group_key').notNull() // interior | exterior | condominio
});

export const propertyFeatures = pgTable(
	'property_features',
	{
		propertyId: uuid('property_id')
			.notNull()
			.references(() => properties.id, { onDelete: 'cascade' }),
		featureId: smallint('feature_id')
			.notNull()
			.references(() => features.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.propertyId, t.featureId] })]
);

export const propertyMedia = pgTable(
	'property_media',
	{
		propertyId: uuid('property_id')
			.notNull()
			.references(() => properties.id, { onDelete: 'cascade' }),
		mediaId: uuid('media_id')
			.notNull()
			.references(() => media.id, { onDelete: 'cascade' }),
		role: text('role').notNull().default('gallery'), // cover | gallery | plano
		caption: text('caption'),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(t) => [primaryKey({ columns: [t.propertyId, t.mediaId] })]
);

export const rentalAvailability = pgTable('rental_availability', {
	id: id(),
	propertyId: uuid('property_id')
		.notNull()
		.references(() => properties.id, { onDelete: 'cascade' }),
	startsOn: date('starts_on').notNull(),
	endsOn: date('ends_on').notNull(),
	status: text('status').notNull().default('disponible') // disponible | ocupado
});

/* ------------------------------------------------------------------ */
/* Contenido                                                           */
/* ------------------------------------------------------------------ */

export const services = pgTable('services', {
	id: id(),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	summary: text('summary').notNull(),
	body: text('body').notNull().default(''),
	includes: jsonb('includes').$type<string[]>().notNull().default([]),
	steps: jsonb('steps').$type<{ title: string; text: string }[]>().notNull().default([]),
	faq: jsonb('faq').$type<{ q: string; a: string }[]>().notNull().default([]),
	ctaLabel: text('cta_label').notNull().default('Contáctanos'),
	leadType: leadTypeEnum('lead_type').notNull().default('general'),
	imageId: uuid('image_id').references(() => media.id, { onDelete: 'set null' }),
	sortOrder: integer('sort_order').notNull().default(0),
	...audit
});

export const postCategories = pgTable('post_categories', {
	id: smallint('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull()
});

export const posts = pgTable('posts', {
	id: id(),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	excerpt: text('excerpt').notNull().default(''),
	body: text('body').notNull().default(''),
	coverId: uuid('cover_id').references(() => media.id, { onDelete: 'set null' }),
	authorId: uuid('author_id').references(() => teamMembers.id, { onDelete: 'set null' }),
	publishState: publishStateEnum('publish_state').notNull().default('draft'),
	publishedAt: timestamp('published_at', { withTimezone: true }),
	metaTitle: text('meta_title'),
	metaDescription: text('meta_description'),
	version: integer('version').notNull().default(1),
	deletedAt: timestamp('deleted_at', { withTimezone: true }),
	...audit
});

export const postCategoryMap = pgTable(
	'post_category_map',
	{
		postId: uuid('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		categoryId: smallint('category_id')
			.notNull()
			.references(() => postCategories.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.postId, t.categoryId] })]
);

/** Bloques de página (hero, destacado, promos, trust bar, partner, quienes somos…) validados con Zod. */
export const pageBlocks = pgTable(
	'page_blocks',
	{
		id: id(),
		pageKey: text('page_key').notNull(),
		blockKey: text('block_key').notNull(),
		data: jsonb('data').notNull(),
		version: integer('version').notNull().default(1),
		updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
		...audit
	},
	(t) => [uniqueIndex('page_blocks_key_idx').on(t.pageKey, t.blockKey)]
);

export const siteSettings = pgTable('site_settings', {
	key: text('key').primaryKey(),
	value: jsonb('value').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

/* ------------------------------------------------------------------ */
/* Leads                                                               */
/* ------------------------------------------------------------------ */

export const leads = pgTable(
	'leads',
	{
		id: id(),
		type: leadTypeEnum('type').notNull().default('general'),
		firstName: text('first_name').notNull(),
		lastName: text('last_name'),
		email: text('email').notNull(),
		phone: text('phone'),
		preferredChannel: channelEnum('preferred_channel').notNull().default('whatsapp'),
		propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
		comuna: text('comuna'),
		message: text('message'),
		sourcePage: text('source_page'),
		utm: jsonb('utm'),
		status: leadStatusEnum('status').notNull().default('nuevo'),
		assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
		consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
		ipHash: text('ip_hash'),
		...audit
	},
	(t) => [index('leads_status_idx').on(t.status, t.createdAt)]
);

export const leadNotes = pgTable('lead_notes', {
	id: id(),
	leadId: uuid('lead_id')
		.notNull()
		.references(() => leads.id, { onDelete: 'cascade' }),
	authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
	body: text('body').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

/* ------------------------------------------------------------------ */
/* SEO                                                                 */
/* ------------------------------------------------------------------ */

export const redirects = pgTable('redirects', {
	id: id(),
	fromPath: text('from_path').notNull().unique(),
	toPath: text('to_path').notNull(),
	statusCode: smallint('status_code').notNull().default(301),
	hits: integer('hits').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
