<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import TeamCard from '$lib/components/TeamCard.svelte';
	import CtaBand from '$lib/components/CtaBand.svelte';
	import { renderRichText } from '$lib/richtext';

	let { data } = $props();
	const b = $derived(data.blocks as Record<string, any>);
</script>

<Seo
	title="Quiénes somos — equipo de Maller&M Propiedades"
	description="Corredora de propiedades en Maitencillo fundada por Cecilia Maller y Alicia Manríquez, con asesoría legal y diseño de interiores en el mismo equipo."
/>

<PageHero
	eyebrow="Quiénes somos"
	title={b.intro?.title ?? 'Quiénes somos'}
	imageId={b.intro?.imageId}
	crumbs={[{ href: '/', label: 'Inicio' }, { label: 'Quiénes somos' }]}
/>

<section class="section">
	<div class="container intro">
		<div class="prose lead-prose">{@html renderRichText(b.intro?.text)}</div>
		<dl class="mv">
			<div>
				<dt>Misión</dt>
				<dd>{b.mision_vision?.mision}</dd>
			</div>
			<div>
				<dt>Visión</dt>
				<dd>{b.mision_vision?.vision}</dd>
			</div>
		</dl>
	</div>
</section>

<section class="section section--alt" aria-labelledby="eq">
	<div class="container">
		<div class="section-head">
			<div>
				<p class="eyebrow">Nuestro equipo de trabajo</p>
				<h2 id="eq">Personas reales, contacto directo</h2>
				<p>Corretaje, asesoría legal y diseño de interiores en un mismo equipo, con foco en Maitencillo y alrededores.</p>
			</div>
		</div>
		<div class="grid grid--4 team">
			{#each data.team as m (m.id)}<TeamCard {m} showBio />{/each}
		</div>
	</div>
</section>

<CtaBand whatsapp={data.settings.contact.whatsapp} imageId={data.settings.bands.ctaImageId} />

<style>
	.intro {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: clamp(32px, 6vw, 96px);
		align-items: start;
	}
	@media (max-width: 900px) {
		.intro {
			grid-template-columns: 1fr;
		}
	}
	.lead-prose {
		font-size: 1.12rem;
	}
	.mv {
		margin: 0;
		display: grid;
		gap: var(--sp-5);
	}
	.mv div {
		padding: var(--sp-6);
		border-radius: 10px;
		background: var(--brand-navy);
		color: #c9d4df;
	}
	.mv div:last-child {
		background: var(--brand-primary);
		color: rgba(255, 255, 255, 0.9);
	}
	dt {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--brand-gold-light);
		margin-bottom: var(--sp-2);
	}
	dd {
		margin: 0;
	}
	.team {
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
	}
</style>
