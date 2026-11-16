<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import PropertyCard from '$lib/components/PropertyCard.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import LeadForm from '$lib/components/LeadForm.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { renderRichText } from '$lib/richtext';

	let { data, form } = $props();
	const s = $derived(data.service);
	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: s.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
	});
</script>

<Seo title="{s.title} de propiedades en Maitencillo" description={s.summary} image={s.imageId ? `/media/${s.imageId}/1440.webp` : null} jsonld={s.faq.length ? jsonld : null} />

<PageHero
	eyebrow="Servicios"
	title={s.title}
	lead={s.summary}
	imageId={s.imageId}
	crumbs={[{ href: '/', label: 'Inicio' }, { href: '/servicios/', label: 'Servicios' }, { label: s.title }]}
>
	<a class="btn btn--gold hero-cta" href="#contacto-servicio">{s.ctaLabel}</a>
</PageHero>

<section class="section">
	<div class="container two">
		<div>
			<div class="prose">{@html renderRichText(s.body)}</div>
			<h2 class="h-inc">¿Qué incluye?</h2>
			<ul class="inc">
				{#each s.includes as it (it)}<li><Icon name="check" size={18} /> {it}</li>{/each}
			</ul>
		</div>
		<ol class="steps" aria-label="Proceso">
			{#each s.steps as st, i (st.title)}
				<li>
					<span class="n">{i + 1}</span>
					<div><h3>{st.title}</h3><p>{st.text}</p></div>
				</li>
			{/each}
		</ol>
	</div>
</section>

{#if s.faq.length}
	<section class="section section--alt">
		<div class="container narrow">
			<p class="eyebrow">Preguntas frecuentes</p>
			<h2>Resolvemos tus dudas</h2>
			<div class="faq">
				{#each s.faq as f (f.q)}
					<details>
						<summary>{f.q}</summary>
						<p>{f.a}</p>
					</details>
				{/each}
			</div>
		</div>
	</section>
{/if}

{#if data.props.length}
	<section class="section">
		<div class="container">
			<div class="section-head">
				<div><p class="eyebrow">Propiedades</p><h2>Algunas propiedades disponibles</h2></div>
				<a class="link-arrow" href="/propiedades/">Ver portafolio</a>
			</div>
			<div class="grid grid--3">{#each data.props as p (p.id)}<PropertyCard {p} />{/each}</div>
		</div>
	</section>
{/if}

{#if data.posts.length}
	<section class="section">
		<div class="container">
			<div class="section-head">
				<div><p class="eyebrow">Blog de diseño</p><h2>Inspiración para tus espacios</h2></div>
				<a class="link-arrow" href="/blog/">Ir al blog</a>
			</div>
			<div class="grid grid--3">{#each data.posts as post (post.id)}<PostCard {post} />{/each}</div>
		</div>
	</section>
{/if}

<section class="section section--sand" id="contacto-servicio">
	<div class="container contact">
		<div>
			<p class="eyebrow">Conversemos</p>
			<h2>{s.ctaLabel}</h2>
			<p class="lead">Déjanos tus datos y una de nuestras socias te contactará dentro de 24 horas hábiles.</p>
		</div>
		<div class="form-card">
			<LeadForm form={form as any} action="?/lead" variant="property" type={s.leadType} submitLabel={s.ctaLabel} idPrefix="svc" />
		</div>
	</div>
</section>

<style>
	.hero-cta {
		margin-top: var(--sp-3);
	}
	.two {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: clamp(32px, 6vw, 96px);
		align-items: start;
	}
	@media (max-width: 900px) {
		.two {
			grid-template-columns: 1fr;
		}
	}
	.h-inc {
		font-size: var(--fs-h3);
		margin-top: var(--sp-7);
	}
	.inc {
		list-style: none;
		padding: 0;
		display: grid;
		gap: 10px;
	}
	.inc li {
		display: flex;
		gap: 10px;
	}
	.inc :global(svg) {
		color: var(--brand-primary);
		margin-top: 4px;
		flex: none;
	}
	.steps {
		list-style: none;
		padding: var(--sp-6);
		margin: 0;
		display: grid;
		gap: var(--sp-5);
		background: var(--brand-navy);
		border-radius: 10px;
		color: #c9d4df;
	}
	.steps li {
		display: flex;
		gap: var(--sp-4);
	}
	.n {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--brand-gold);
		color: var(--brand-navy);
		font-family: var(--font-heading);
		font-weight: 800;
		flex: none;
	}
	.steps h3 {
		color: #fff;
		font-size: 1.1rem;
		margin: 6px 0 4px;
	}
	.steps p {
		margin: 0;
		font-size: 0.95rem;
	}
	.narrow {
		max-width: 860px;
	}
	.faq {
		display: grid;
		gap: var(--sp-3);
		margin-top: var(--sp-6);
	}
	details {
		background: #fff;
		border-radius: var(--radius-card);
		border: 1px solid var(--line);
	}
	summary {
		cursor: pointer;
		padding: var(--sp-5);
		font-family: var(--font-heading);
		font-weight: 700;
		list-style: none;
		display: flex;
		justify-content: space-between;
		gap: var(--sp-3);
	}
	summary::after {
		content: '+';
		font-size: 1.4rem;
		line-height: 1;
		color: var(--brand-primary);
	}
	details[open] summary::after {
		content: '–';
	}
	details p {
		padding: 0 var(--sp-5) var(--sp-5);
		margin: 0;
		color: var(--ink-soft);
	}
	.contact {
		display: grid;
		grid-template-columns: 1fr minmax(0, 520px);
		gap: clamp(32px, 6vw, 96px);
		align-items: center;
	}
	@media (max-width: 900px) {
		.contact {
			grid-template-columns: 1fr;
		}
	}
	.form-card {
		background: #fff;
		padding: clamp(20px, 3vw, 36px);
		border-radius: 10px;
		box-shadow: var(--shadow-card);
	}
</style>
