<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import Picture from '$lib/components/Picture.svelte';
	import PropertyCard from '$lib/components/PropertyCard.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import PriceTag from '$lib/components/PriceTag.svelte';
	import LeadForm from '$lib/components/LeadForm.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import TeamCard from '$lib/components/TeamCard.svelte';
	import { fmtM2 } from '$lib/format';
	import { PUBLIC_SITE_URL } from '$app/env/public';

	let { data, form } = $props();
	const b = $derived(data.blocks as Record<string, any>);
	const d = $derived(data.destacado);
	let slide = $state(0);
	const slides = $derived<string[]>(b.destacado?.imageIds ?? []);

	const serviceIcon: Record<string, 'key' | 'home' | 'calendar' | 'pen'> = {
		compra: 'key',
		venta: 'home',
		arriendo: 'calendar',
		diseno: 'pen'
	};

	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@type': 'RealEstateAgent',
		name: 'Maller&M Propiedades',
		url: PUBLIC_SITE_URL,
		image: `${PUBLIC_SITE_URL}/logo-color.png`,
		telephone: data.settings.contact.phones[0],
		email: data.settings.contact.email,
		address: {
			'@type': 'PostalAddress',
			streetAddress: data.settings.contact.address,
			addressLocality: 'Maitencillo',
			addressRegion: 'Valparaíso',
			addressCountry: 'CL'
		},
		areaServed: ['Maitencillo', 'Zapallar', 'Papudo', 'Puchuncaví', 'Concón'],
		sameAs: [data.settings.social.instagram].filter(Boolean)
	});
	const trustValue = (v: string) => v.replace('{propiedades}', String(data.totalProperties));
</script>

<Seo
	title="Maller&M Propiedades — Corredora de propiedades en Maitencillo"
	description={data.settings.seo.defaultDescription}
	image={b.hero?.imageId ? `/media/${b.hero.imageId}/1440.webp` : null}
	{jsonld}
/>

<!-- 1. Hero + búsqueda rápida -->
<section class="hero">
	{#if b.hero?.imageId}
		<div class="hero-bg">
			<Picture
				media={{ id: b.hero.imageId, width: 1440, height: 901 }}
				alt=""
				sizes="100vw"
				loading="eager"
				fetchpriority="high"
			/>
		</div>
	{/if}
	<div class="container hero-inner on-dark">
		<p class="eyebrow reveal">{b.hero?.eyebrow}</p>
		<h1 class="reveal">{b.hero?.title}</h1>
		<p class="hero-sub reveal">{b.hero?.subtitle}</p>

		<form class="quick" action="/propiedades/" method="GET" role="search" aria-label="Buscar propiedades">
			<div class="qf">
				<label for="q-op">Operación</label>
				<select id="q-op" name="operacion" class="select">
					<option value="">Todas</option>
					<option value="venta">Comprar</option>
					<option value="arriendo">Arrendar</option>
					<option value="arriendo-temporal">Arriendo temporal</option>
				</select>
			</div>
			<div class="qf">
				<label for="q-tipo">Tipo</label>
				<select id="q-tipo" name="tipo" class="select">
					<option value="">Todos</option>
					{#each data.filters.types as t (t.slug)}<option value={t.slug}>{t.name}</option>{/each}
				</select>
			</div>
			<div class="qf">
				<label for="q-zona">Zona</label>
				<select id="q-zona" name="zona" class="select">
					<option value="">Todas</option>
					{#each data.filters.zones as z (z.slug)}<option value={z.slug}>{z.name}</option>{/each}
				</select>
			</div>
			<button class="btn btn--gold" type="submit"><Icon name="search" /> Buscar</button>
		</form>
	</div>
</section>

<!-- 2. Trust bar -->
<section class="trust" aria-label="Por qué elegirnos">
	<div class="container trust-grid">
		{#each b.trust?.items ?? [] as item (item.label)}
			<div class="trust-item">
				<strong>{trustValue(item.value)}</strong>
				<span>{item.label}</span>
			</div>
		{/each}
	</div>
</section>

<!-- 3. Destacado -->
{#if d && b.destacado}
	<section class="section section--navy destacado" aria-labelledby="dest-title">
		<div class="container dest-grid">
			<div class="dest-gallery">
				<div class="slides">
					{#each slides as id, i (id)}
						<div class="slide" class:active={i === slide} aria-hidden={i !== slide}>
							<Picture
								media={{ id, width: 1440, height: 960 }}
								alt="{d.title} — fotografía {i + 1}"
								sizes="(min-width: 1000px) 640px, 100vw"
								loading={i === 0 ? 'lazy' : 'lazy'}
							/>
						</div>
					{/each}
					<span class="badge badge--gold dest-badge"><Icon name="star" size={14} /> {b.destacado.label}</span>
				</div>
				{#if slides.length > 1}
					<div class="dots" role="group" aria-label="Fotografías del proyecto">
						<button class="nav" onclick={() => (slide = (slide - 1 + slides.length) % slides.length)} aria-label="Anterior">
							<Icon name="arrow-left" />
						</button>
						{#each slides as id, i (id)}
							<button class="dot" class:on={i === slide} onclick={() => (slide = i)} aria-label="Foto {i + 1}" aria-pressed={i === slide}></button>
						{/each}
						<button class="nav" onclick={() => (slide = (slide + 1) % slides.length)} aria-label="Siguiente">
							<Icon name="arrow-right" />
						</button>
					</div>
				{/if}
			</div>
			<div class="dest-copy">
				<p class="eyebrow">{b.destacado.label}</p>
				<h2 id="dest-title">{b.destacado.title}</h2>
				<p class="dest-text">{b.destacado.text}</p>
				<ul class="facts">
					{#if d.specs.builtM2}<li><strong>{fmtM2(d.specs.builtM2)}</strong><span>construidos</span></li>{/if}
					{#if d.specs.landM2}<li><strong>{fmtM2(d.specs.landM2)}</strong><span>de terreno desde</span></li>{/if}
					{#if d.specs.bedrooms}<li><strong>{d.specs.bedrooms}</strong><span>dormitorios</span></li>{/if}
				</ul>
				<div class="dest-price"><PriceTag price={d.price} uf={data.uf} size="lg" /></div>
				<a class="btn btn--gold" href="/propiedades/{d.slug}/">{b.destacado.ctaLabel} <Icon name="arrow-right" /></a>
			</div>
		</div>
	</section>
{/if}

<!-- 4. Propiedades nuevas -->
<section class="section" aria-labelledby="new-title">
	<div class="container">
		<div class="section-head">
			<div>
				<p class="eyebrow">Propiedades</p>
				<h2 id="new-title">Nuevas propiedades disponibles</h2>
				<p>Casas, departamentos, parcelas y sitios en venta y arriendo en el litoral.</p>
			</div>
			<a class="btn btn--secondary" href="/propiedades/">Ver portafolio completo</a>
		</div>
		<div class="grid grid--3">
			{#each data.latest as p, i (p.id)}
				<PropertyCard {p} eager={i < 3} />
			{/each}
		</div>
	</div>
</section>

<!-- 5. Oportunidades (promos CMS) -->
<section class="section section--sand" aria-labelledby="promo-title">
	<div class="container">
		<div class="section-head">
			<div>
				<p class="eyebrow">Oportunidades</p>
				<h2 id="promo-title">Proyectos y beneficios exclusivos</h2>
			</div>
		</div>
		<div class="promos">
			{#each b.promos?.items ?? [] as pr (pr.title)}
				<article class="promo">
					{#if pr.imageId}
						<div class="promo-img"><Picture media={{ id: pr.imageId, width: 1440, height: 960 }} alt={pr.title} sizes="(min-width: 900px) 600px, 100vw" /></div>
					{/if}
					<div class="promo-body">
						<h3>{pr.title}</h3>
						<p>{pr.text}</p>
						<a class="btn" href={pr.href}>{pr.ctaLabel}</a>
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- 6. Servicios -->
<section class="section" aria-labelledby="serv-title">
	<div class="container">
		<div class="section-head">
			<div>
				<p class="eyebrow">Servicios</p>
				<h2 id="serv-title">Un servicio integral, de la búsqueda a la firma</h2>
				<p>Marketing digital, fotografía, gestión legal y acompañamiento en cada etapa.</p>
			</div>
			<a class="link-arrow" href="/servicios/">Todos los servicios</a>
		</div>
		<div class="grid grid--4">
			{#each data.services as s (s.slug)}
				<a class="svc" href="/servicios/{s.slug}/">
					<span class="svc-icon"><Icon name={serviceIcon[s.slug] ?? 'home'} size={26} /></span>
					<h3>{s.title}</h3>
					<p>{s.summary}</p>
					<span class="link-arrow">Saber más</span>
				</a>
			{/each}
		</div>
	</div>
</section>

<!-- 7. Ruta para propietarios -->
<section class="owner" aria-labelledby="owner-title">
	{#if b.owner?.imageId}
		<div class="owner-bg"><Picture media={{ id: b.owner.imageId, width: 1440, height: 960 }} alt="" sizes="100vw" /></div>
	{/if}
	<div class="container owner-grid on-dark">
		<div>
			<p class="eyebrow">Propietarios</p>
			<h2 id="owner-title">{b.owner?.title}</h2>
			<p class="owner-text">{b.owner?.text}</p>
			<ul class="checks">
				<li><Icon name="check" size={18} /> Tasación según el mercado del litoral</li>
				<li><Icon name="check" size={18} /> Fotografía profesional y difusión segmentada</li>
				<li><Icon name="check" size={18} /> Asesoría legal hasta la firma</li>
			</ul>
		</div>
		<div class="owner-form">
			<LeadForm form={form as any} action="?/owner" variant="owner" type="quiero_vender" submitLabel="Quiero que me llamen" idPrefix="owner" />
		</div>
	</div>
</section>

<!-- 8. Blog -->
<section class="section" aria-labelledby="blog-title">
	<div class="container">
		<div class="section-head">
			<div>
				<p class="eyebrow">Blog de diseño</p>
				<h2 id="blog-title">Nuevos artículos publicados</h2>
				<p>Recomendaciones en diseño, decoración y mejoras para tu hogar.</p>
			</div>
			<a class="link-arrow" href="/blog/">Más publicaciones</a>
		</div>
		<div class="grid grid--3">
			{#each data.posts as post (post.id)}<PostCard {post} />{/each}
		</div>
	</div>
</section>

<!-- 9. Partner Santiago -->
{#if b.partner}
	<section class="section section--alt partner-sec" aria-labelledby="partner-title">
		<div class="container partner">
			{#if b.partner.imageId}
				<div class="partner-img"><Picture media={{ id: b.partner.imageId, width: 1440, height: 596 }} alt="Panorámica de Santiago" sizes="(min-width: 900px) 600px, 100vw" /></div>
			{/if}
			<div class="partner-copy">
				{#if b.partner.logoId}
					<img class="partner-logo" src="/media/{b.partner.logoId}/640.webp" alt="Casivar Gestión Inmobiliaria" width="150" height="101" loading="lazy" />
				{/if}
				<h2 id="partner-title">{b.partner.title}</h2>
				<p>{b.partner.text}</p>
				<a class="btn btn--secondary" href={b.partner.url} target="_blank" rel="noopener">{b.partner.ctaLabel} <Icon name="external" /></a>
			</div>
		</div>
	</section>
{/if}

<!-- 10. Equipo -->
<section class="section" aria-labelledby="team-title">
	<div class="container">
		<div class="section-head">
			<div>
				<p class="eyebrow">Contacto directo</p>
				<h2 id="team-title">Habla directamente con nuestro equipo</h2>
			</div>
			<a class="link-arrow" href="/quienes-somos/">Conoce al equipo</a>
		</div>
		<div class="grid grid--3">
			{#each data.contactTeam as m (m.id)}<TeamCard {m} />{/each}
		</div>
	</div>
</section>

<style>
	/* Hero */
	.hero {
		position: relative;
		isolation: isolate;
		min-height: min(88vh, 780px);
		display: flex;
		align-items: flex-end;
		color: #fff;
		background: var(--brand-navy);
		padding-block: clamp(96px, 14vh, 160px) clamp(48px, 8vh, 88px);
	}
	.hero-bg {
		position: absolute;
		inset: 0;
		z-index: -1;
	}
	.hero-bg :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 60% 40%;
	}
	.hero-bg::after {
		content: '';
		position: absolute;
		inset: 0;
		background:
			linear-gradient(180deg, rgba(19, 28, 44, 0.15) 0%, rgba(19, 28, 44, 0.35) 45%, rgba(19, 28, 44, 0.88) 100%),
			linear-gradient(90deg, rgba(19, 28, 44, 0.55) 0%, rgba(19, 28, 44, 0) 70%);
	}
	.hero h1 {
		font-size: var(--fs-display);
		color: #fff;
		max-width: 16ch;
		margin-bottom: var(--sp-4);
	}
	.hero-sub {
		font-size: clamp(1.05rem, 1rem + 0.4vw, 1.3rem);
		max-width: 56ch;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: var(--sp-6);
	}
	.quick {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
		gap: var(--sp-3);
		align-items: end;
		background: rgba(255, 255, 255, 0.97);
		border-radius: 10px;
		padding: var(--sp-4);
		max-width: 940px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		color: var(--ink);
	}
	.qf {
		display: grid;
		gap: 4px;
	}
	.qf label {
		font-size: var(--fs-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ink-muted);
		padding-left: 2px;
	}
	.quick .btn {
		min-height: 48px;
	}
	@media (max-width: 760px) {
		.quick {
			grid-template-columns: 1fr 1fr;
		}
		.quick .btn {
			grid-column: 1 / -1;
		}
		.qf:first-child {
			grid-column: 1 / -1;
		}
	}

	/* Trust */
	.trust {
		background: var(--brand-primary);
		color: #fff;
	}
	.trust-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
	}
	.trust-item {
		display: grid;
		gap: 2px;
		padding: var(--sp-5) var(--sp-4);
		border-left: 1px solid rgba(255, 255, 255, 0.14);
	}
	.trust-item:first-child {
		border-left: 0;
	}
	.trust-item strong {
		font-family: var(--font-heading);
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--brand-gold-light);
	}
	.trust-item span {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.85);
	}

	/* Destacado */
	.dest-grid {
		display: grid;
		grid-template-columns: 1.15fr 1fr;
		gap: clamp(32px, 5vw, 80px);
		align-items: center;
	}
	@media (max-width: 900px) {
		.dest-grid {
			grid-template-columns: 1fr;
		}
	}
	.slides {
		position: relative;
		aspect-ratio: 3 / 2;
		border-radius: var(--radius-card);
		overflow: hidden;
		background: var(--brand-navy-800);
	}
	.slide {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 0.6s var(--ease);
	}
	.slide.active {
		opacity: 1;
	}
	.slide :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.dest-badge {
		position: absolute;
		top: 16px;
		left: 16px;
	}
	.dots {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: var(--sp-4);
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 0;
		padding: 0;
		background: rgba(255, 255, 255, 0.3);
		cursor: pointer;
	}
	.dot.on {
		background: var(--brand-gold);
		width: 28px;
		border-radius: 5px;
	}
	.nav {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: none;
		color: #fff;
		cursor: pointer;
	}
	.nav:hover {
		background: rgba(255, 255, 255, 0.1);
	}
	.dest-text {
		color: #c9d4df;
		font-size: 1.08rem;
	}
	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: var(--sp-5);
		list-style: none;
		padding: var(--sp-5) 0;
		margin: var(--sp-5) 0;
		border-block: 1px solid rgba(255, 255, 255, 0.12);
	}
	.facts li {
		display: grid;
	}
	.facts strong {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		color: var(--brand-gold-light);
	}
	.facts span {
		font-size: var(--fs-small);
		color: #aebbc9;
	}
	.dest-price {
		margin-bottom: var(--sp-5);
	}
	.dest-price :global(.price),
	.dest-price :global(.amount) {
		color: #fff;
	}
	.dest-price :global(.from),
	.dest-price :global(.approx) {
		color: #aebbc9;
	}

	/* Promos */
	.promos {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
		gap: var(--sp-6);
	}
	.promo {
		display: grid;
		grid-template-columns: 1fr 1.1fr;
		background: #fff;
		border-radius: var(--radius-card);
		overflow: hidden;
		box-shadow: var(--shadow-card);
	}
	@media (max-width: 560px) {
		.promo {
			grid-template-columns: 1fr;
		}
	}
	.promo-img {
		min-height: 220px;
		background: var(--surface-alt);
	}
	.promo-img :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.promo-body {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: var(--sp-6);
	}
	.promo-body h3 {
		font-size: 1.3rem;
	}
	.promo-body p {
		color: var(--ink-soft);
		font-size: 0.97rem;
	}
	.promo-body .btn {
		margin-top: auto;
	}

	/* Servicios */
	.svc {
		display: flex;
		flex-direction: column;
		gap: var(--sp-3);
		padding: var(--sp-6);
		border: 1px solid var(--line);
		border-radius: var(--radius-card);
		text-decoration: none;
		color: var(--ink);
		height: 100%;
		transition:
			box-shadow 0.3s var(--ease),
			transform 0.3s var(--ease),
			border-color 0.3s;
	}
	.svc:hover {
		box-shadow: var(--shadow-hover);
		transform: translateY(-2px);
		border-color: transparent;
		color: var(--ink);
	}
	.svc-icon {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		border-radius: 12px;
		background: var(--brand-primary-050);
		color: var(--brand-primary);
	}
	.svc h3 {
		margin: var(--sp-2) 0 0;
		font-size: 1.25rem;
	}
	.svc p {
		color: var(--ink-soft);
		font-size: 0.95rem;
		margin: 0;
	}
	.svc .link-arrow {
		margin-top: auto;
		padding-top: var(--sp-3);
	}

	/* Owner */
	.owner {
		position: relative;
		isolation: isolate;
		background: var(--brand-primary);
		padding-block: var(--section-y);
		color: #fff;
	}
	.owner-bg {
		position: absolute;
		inset: 0;
		z-index: -1;
	}
	.owner-bg :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.owner-bg::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(100deg, rgba(19, 70, 87, 0.97) 30%, rgba(19, 70, 87, 0.86) 100%);
	}
	.owner-grid {
		display: grid;
		grid-template-columns: 1fr minmax(0, 520px);
		gap: clamp(32px, 6vw, 96px);
		align-items: center;
	}
	@media (max-width: 900px) {
		.owner-grid {
			grid-template-columns: 1fr;
		}
	}
	.owner h2 {
		color: #fff;
	}
	.owner-text {
		color: rgba(255, 255, 255, 0.88);
		font-size: 1.08rem;
		max-width: 50ch;
	}
	.checks {
		list-style: none;
		padding: 0;
		margin: var(--sp-5) 0 0;
		display: grid;
		gap: var(--sp-3);
	}
	.checks li {
		display: flex;
		gap: 10px;
		align-items: center;
	}
	.checks :global(svg) {
		color: var(--brand-gold-light);
	}
	.owner-form {
		background: #fff;
		color: var(--ink);
		border-radius: 10px;
		padding: clamp(20px, 3vw, 36px);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
	}

	/* Partner */
	.partner {
		display: grid;
		grid-template-columns: 1.1fr 1fr;
		gap: clamp(32px, 5vw, 72px);
		align-items: center;
	}
	@media (max-width: 860px) {
		.partner {
			grid-template-columns: 1fr;
		}
	}
	.partner-img {
		border-radius: var(--radius-card);
		overflow: hidden;
		aspect-ratio: 16 / 9;
	}
	.partner-img :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.partner-logo {
		width: 120px;
		height: auto;
		margin-bottom: var(--sp-4);
		mix-blend-mode: multiply;
	}
	.partner-copy p {
		color: var(--ink-soft);
	}
</style>
