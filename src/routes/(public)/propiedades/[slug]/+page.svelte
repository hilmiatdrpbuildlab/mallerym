<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import Gallery from '$lib/components/Gallery.svelte';
	import PriceTag from '$lib/components/PriceTag.svelte';
	import PropertyCard from '$lib/components/PropertyCard.svelte';
	import LeadForm from '$lib/components/LeadForm.svelte';
	import MapEmbed from '$lib/components/MapEmbed.svelte';
	import Picture from '$lib/components/Picture.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { renderRichText, plainText } from '$lib/richtext';
	import { OPERATION_LABEL, AVAILABILITY_LABEL, fmtM2, fmtDate, waLink, phoneDigits, OPERATION_TO_SLUG } from '$lib/format';
	import { PUBLIC_SITE_URL } from '$app/env/public';

	let { data, form } = $props();
	const p = $derived(data.p);
	const html = $derived(renderRichText(p.body));
	const groups = $derived(
		[
			['interior', 'Interior'],
			['exterior', 'Exterior'],
			['condominio', 'Condominio y servicios']
		]
			.map(([key, label]) => ({ key, label, items: p.features.filter((f) => f.group === key) }))
			.filter((g) => g.items.length)
	);
	const specs = $derived(
		[
			p.specs.builtM2 && { icon: 'area', label: 'Construidos', value: fmtM2(p.specs.builtM2) },
			p.specs.terraceM2 && { icon: 'layers', label: 'Terrazas', value: fmtM2(p.specs.terraceM2) },
			p.specs.landM2 && { icon: 'land', label: 'Terreno', value: fmtM2(p.specs.landM2) },
			p.specs.bedrooms && { icon: 'bed', label: 'Dormitorios', value: String(p.specs.bedrooms) },
			p.specs.bathrooms && { icon: 'bath', label: 'Baños', value: String(p.specs.bathrooms) },
			p.specs.parking && { icon: 'car', label: 'Estacionamientos', value: String(p.specs.parking) },
			p.specs.floors && { icon: 'layers', label: 'Pisos', value: String(p.specs.floors) },
			p.specs.guests && { icon: 'users', label: 'Huéspedes', value: String(p.specs.guests) },
			p.specs.minNights && { icon: 'moon', label: 'Estadía mínima', value: `${p.specs.minNights} noches` }
		].filter(Boolean) as { icon: any; label: string; value: string }[]
	);
	const wa = $derived(p.agent?.phone ?? data.settings.contact.whatsapp);
	$effect(() => {
		document.body.classList.add('sticky-cta');
		return () => document.body.classList.remove('sticky-cta');
	});
	const closed = $derived(p.availability === 'vendida' || p.availability === 'arrendada');
	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@type': 'RealEstateListing',
		name: p.title,
		description: plainText(p.summary || p.body, 300),
		url: `${PUBLIC_SITE_URL}/propiedades/${p.slug}/`,
		datePosted: p.publishedAt,
		image: p.gallery.slice(0, 6).map((g) => `${PUBLIC_SITE_URL}/media/${g.id}/1440.webp`),
		offers: p.price
			? {
					'@type': 'Offer',
					price: p.price.amount,
					priceCurrency: p.price.currency === 'UF' ? 'CLF' : 'CLP',
					availability: closed ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
					businessFunction: p.operation === 'venta' ? 'http://purl.org/goodrelations/v1#Sell' : 'http://purl.org/goodrelations/v1#LeaseOut'
				}
			: undefined,
		address: { '@type': 'PostalAddress', addressLocality: p.location.sector, addressRegion: 'Valparaíso', addressCountry: 'CL' }
	});
</script>

<Seo
	title={p.metaTitle || `${p.title} · ${OPERATION_LABEL[p.operation]} en ${p.location.sector}`}
	description={p.metaDescription || plainText(p.summary || p.body, 158)}
	image={p.gallery[0] ? `/media/${p.gallery[0].id}/1440.webp` : null}
	noindex={data.preview}
	{jsonld}
/>

<div class="has-sticky-cta">
	{#if data.preview}
		<div class="preview-bar" role="status"><Icon name="eye" size={18} /> Vista previa — esta propiedad aún no está publicada.</div>
	{/if}
	<section class="top">
		<div class="container">
			<nav class="crumbs" aria-label="Migas de pan">
				<a href="/">Inicio</a> / <a href="/propiedades/">Propiedades</a> /
				<a href="/propiedades/?operacion={OPERATION_TO_SLUG[p.operation]}">{OPERATION_LABEL[p.operation]}</a> /
				<span aria-current="page">{p.typeName}</span>
			</nav>
			<Gallery images={p.gallery} title={p.title} />
		</div>
	</section>

	<section class="section main-sec">
		<div class="container detail">
			<article class="content">
				<header class="head">
					<div class="badges">
						<span class="badge badge--{p.operation === 'arriendo_temporal' ? 'arriendo_anual' : p.operation}">{OPERATION_LABEL[p.operation]}</span>
						<span class="badge badge--muted">{p.typeName}</span>
						{#if p.availability !== 'disponible'}<span class="badge badge--sold">{AVAILABILITY_LABEL[p.availability]}</span>{/if}
						{#if p.featured}<span class="badge badge--gold">Destacado</span>{/if}
					</div>
					<h1>{p.title}</h1>
					<p class="loc"><Icon name="pin" size={18} /> {p.condominium ? `${p.condominium} · ` : ''}{p.location.sector}, {p.location.comuna}</p>
					<div class="price-mobile"><PriceTag price={p.price} uf={data.uf} size="lg" /></div>
				</header>

				{#if specs.length}
					<ul class="specs" aria-label="Ficha técnica">
						{#each specs as s (s.label)}
							<li><Icon name={s.icon} size={22} /><span class="v">{s.value}</span><span class="l">{s.label}</span></li>
						{/each}
					</ul>
				{/if}

				<div class="prose body">{@html html}</div>

				{#if groups.length}
					<section class="block" aria-labelledby="car-title">
						<h2 id="car-title">Características</h2>
						<div class="feat-groups">
							{#each groups as g (g.key)}
								<div>
									<h3>{g.label}</h3>
									<ul class="feats">
										{#each g.items as f (f.slug)}<li><Icon name="check" size={16} /> {f.name}</li>{/each}
									</ul>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				{#if p.availabilityRanges.length && p.operation === 'arriendo_temporal'}
					<section class="block" aria-labelledby="disp-title">
						<h2 id="disp-title">Disponibilidad</h2>
						<ul class="avail">
							{#each p.availabilityRanges as r (r.id)}
								<li class={r.status}>
									<Icon name="calendar" size={18} />
									<span>{fmtDate(r.startsOn + 'T12:00:00')} — {fmtDate(r.endsOn + 'T12:00:00')}</span>
									<strong>{r.status === 'disponible' ? 'Disponible' : 'Ocupado'}</strong>
								</li>
							{/each}
						</ul>
						<p class="hint">Confirma fechas exactas por WhatsApp antes de reservar.</p>
					</section>
				{/if}

				<section class="block" aria-labelledby="ubi-title">
					<h2 id="ubi-title">Ubicación</h2>
					<p class="hint">Ubicación aproximada del sector ({p.location.sector}). La dirección exacta se entrega al coordinar la visita.</p>
					<MapEmbed lat={p.location.lat} lng={p.location.lng} label="{p.location.sector}, {p.location.comuna}" />
				</section>
			</article>

			<aside class="side" aria-label="Consultar por esta propiedad">
				<div class="panel">
					<div class="price-desk"><PriceTag price={p.price} uf={data.uf} size="lg" /></div>
					{#if p.agent}
						<div class="agent">
							{#if p.agent.photoId}
								<div class="avatar"><Picture media={{ id: p.agent.photoId, width: 908, height: 1100 }} alt="" sizes="56px" /></div>
							{/if}
							<div>
								<strong>{p.agent.name}</strong>
								<span>{p.agent.role}</span>
							</div>
						</div>
					{/if}
					<div class="quick-ctas">
						<a class="btn btn--whatsapp btn--block" href={waLink(wa, data.waText)} target="_blank" rel="noopener"><Icon name="whatsapp" /> Consultar por WhatsApp</a>
						<a class="btn btn--secondary btn--block" href="tel:+{phoneDigits(wa)}"><Icon name="phone" /> Llamar</a>
					</div>
					<div class="divider"><span>o déjanos tus datos</span></div>
					<h2 class="form-title" id="consultar">Consultar por esta propiedad</h2>
					<LeadForm form={form as any} action="?/lead" variant="property" type="consulta_propiedad" propertyId={p.id} propertyTitle={p.title} idPrefix="prop" />
				</div>
			</aside>
		</div>
	</section>

	{#if data.similar.length}
		<section class="section section--alt" aria-labelledby="sim-title">
			<div class="container">
				<div class="section-head">
					<div>
						<p class="eyebrow">También te puede interesar</p>
						<h2 id="sim-title">Propiedades similares</h2>
					</div>
					<a class="link-arrow" href="/propiedades/?operacion={OPERATION_TO_SLUG[p.operation]}">Ver más</a>
				</div>
				<div class="grid grid--3">
					{#each data.similar as s (s.id)}<PropertyCard p={s} />{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- Barra inferior móvil -->
	<div class="mbar">
		<div class="mbar-price"><PriceTag price={p.price} size="sm" /></div>
		<a class="btn btn--whatsapp btn--sm" href={waLink(wa, data.waText)} target="_blank" rel="noopener" aria-label="Consultar por WhatsApp"><Icon name="whatsapp" /></a>
		<a class="btn btn--sm" href="#consultar">Consultar</a>
	</div>
</div>

<style>
	.preview-bar {
		display: flex;
		gap: 8px;
		align-items: center;
		justify-content: center;
		padding: 10px;
		background: var(--warning-bg);
		color: var(--warning);
		font-weight: 700;
	}
	.top {
		padding-top: var(--sp-5);
	}
	.crumbs {
		font-size: var(--fs-small);
		color: var(--ink-muted);
		margin-bottom: var(--sp-4);
	}
	.crumbs a {
		color: var(--ink-muted);
	}
	.main-sec {
		padding-top: var(--sp-7);
	}
	.detail {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 400px;
		gap: clamp(32px, 5vw, 72px);
		align-items: start;
	}
	@media (max-width: 1000px) {
		.detail {
			grid-template-columns: 1fr;
		}
	}
	.head h1 {
		font-size: clamp(1.75rem, 1.4rem + 1.5vw, 2.6rem);
		margin: var(--sp-3) 0 var(--sp-2);
	}
	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.badges :global(.badge--arriendo_anual) {
		background: var(--brand-primary-600);
	}
	.loc {
		display: flex;
		gap: 6px;
		align-items: center;
		color: var(--ink-soft);
		margin: 0 0 var(--sp-4);
	}
	.price-mobile {
		display: none;
	}
	.specs {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1px;
		list-style: none;
		padding: 0;
		margin: var(--sp-6) 0 var(--sp-7);
		background: #fff;
		border: 1px solid var(--line);
		border-radius: var(--radius-card);
		overflow: hidden;
	}
	.specs li {
		display: grid;
		gap: 2px;
		padding: var(--sp-4);
		background: #fff;
		box-shadow: 0 0 0 1px var(--line);
	}
	.specs :global(svg) {
		color: var(--brand-primary);
		margin-bottom: 6px;
	}
	.specs .v {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.2rem;
		font-variant-numeric: tabular-nums;
	}
	.specs .l {
		font-size: var(--fs-small);
		color: var(--ink-muted);
	}
	.body {
		max-width: 72ch;
	}
	.block {
		margin-top: var(--sp-8);
		padding-top: var(--sp-7);
		border-top: 1px solid var(--line);
	}
	.block h2 {
		font-size: var(--fs-h3);
	}
	.feat-groups {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--sp-6);
	}
	.feat-groups h3 {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--brand-gold-ink);
	}
	.feats {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 10px;
	}
	.feats li {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.feats :global(svg) {
		color: var(--success);
	}
	.avail {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 8px;
	}
	.avail li {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		border-radius: var(--radius-btn);
		background: var(--success-bg);
	}
	.avail li.ocupado {
		background: #f1f1f1;
		color: var(--ink-muted);
	}
	.avail strong {
		margin-left: auto;
		font-size: var(--fs-small);
	}
	.hint {
		color: var(--ink-muted);
		font-size: var(--fs-small);
	}
	.side {
		position: sticky;
		top: 92px;
	}
	.panel {
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: var(--sp-6);
		box-shadow: var(--shadow-card);
		background: #fff;
	}
	.agent {
		display: flex;
		gap: 12px;
		align-items: center;
		margin: var(--sp-5) 0;
		padding: var(--sp-3);
		background: var(--surface-sand);
		border-radius: var(--radius-btn);
	}
	.avatar {
		width: 52px;
		height: 52px;
		border-radius: 50%;
		overflow: hidden;
		flex: none;
	}
	.avatar :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 50% 20%;
	}
	.agent strong {
		display: block;
	}
	.agent span {
		font-size: var(--fs-small);
		color: var(--ink-muted);
	}
	.quick-ctas {
		display: grid;
		gap: var(--sp-2);
	}
	.divider {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: var(--sp-5) 0;
		color: var(--ink-muted);
		font-size: var(--fs-small);
	}
	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--line);
	}
	.form-title {
		font-size: 1.1rem;
		scroll-margin-top: 100px;
	}
	.mbar {
		display: none;
	}
	@media (max-width: 1000px) {
		.side {
			position: static;
		}
		.price-desk {
			display: none;
		}
		.price-mobile {
			display: block;
		}
		.mbar {
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 45;
			display: flex;
			gap: 8px;
			align-items: center;
			padding: 10px var(--gutter) max(10px, env(safe-area-inset-bottom));
			background: #fff;
			border-top: 1px solid var(--line);
			box-shadow: 0 -6px 20px rgba(10, 37, 64, 0.1);
		}
		.mbar-price {
			flex: 1;
			min-width: 0;
		}
		:global(.has-sticky-cta) {
			padding-bottom: 72px;
		}
	}
</style>
