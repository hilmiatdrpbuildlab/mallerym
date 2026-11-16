<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import Picture from '$lib/components/Picture.svelte';
	import CtaBand from '$lib/components/CtaBand.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data } = $props();
</script>

<Seo
	title="Servicios: compra, venta, arriendo y diseño de interiores"
	description="Servicio integral de corretaje en Maitencillo: marketing digital, fotografía, gestión legal y acompañamiento hasta la firma. Compra, venta, arriendo y diseño de interiores."
/>

<PageHero
	eyebrow="Nuestros servicios"
	title="Un servicio integral, de principio a fin"
	lead="Ofrecemos un servicio integral que incluye marketing digital, fotografía, gestión legal y acompañamiento hasta la firma. Utilizamos redes sociales y publicidad segmentada para maximizar la visibilidad de cada propiedad."
	crumbs={[{ href: '/', label: 'Inicio' }, { label: 'Servicios' }]}
/>

<section class="section">
	<div class="container list">
		{#each data.services as s, i (s.id)}
			<article class="svc" class:rev={i % 2 === 1}>
				<div class="img">
					{#if s.imageId}<Picture media={{ id: s.imageId, width: 1440, height: 960 }} alt="" sizes="(min-width: 900px) 600px, 100vw" />{/if}
				</div>
				<div class="copy">
					<p class="eyebrow">0{i + 1}</p>
					<h2>{s.title}</h2>
					<p class="lead">{s.summary}</p>
					<ul class="inc">
						{#each s.includes.slice(0, 4) as it (it)}<li><Icon name="check" size={18} /> {it}</li>{/each}
					</ul>
					<div class="ctas">
						<a class="btn" href="/servicios/{s.slug}/">Conocer el proceso</a>
						<a class="link-arrow" href="/contacto-y-ubicacion/?motivo={s.leadType}">{s.ctaLabel}</a>
					</div>
				</div>
			</article>
		{/each}
	</div>
</section>

<CtaBand whatsapp={data.settings.contact.whatsapp} imageId={data.settings.bands.ctaImageId} />

<style>
	.list {
		display: grid;
		gap: clamp(64px, 8vw, 120px);
	}
	.svc {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(32px, 5vw, 80px);
		align-items: center;
	}
	.svc.rev .img {
		order: 2;
	}
	@media (max-width: 860px) {
		.svc {
			grid-template-columns: 1fr;
		}
		.svc.rev .img {
			order: 0;
		}
	}
	.img {
		aspect-ratio: 4 / 3;
		border-radius: var(--radius-card);
		overflow: hidden;
		background: var(--surface-alt);
	}
	.img :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.inc {
		list-style: none;
		padding: 0;
		margin: var(--sp-5) 0;
		display: grid;
		gap: 10px;
	}
	.inc li {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}
	.inc :global(svg) {
		color: var(--brand-primary);
		margin-top: 4px;
		flex: none;
	}
	.ctas {
		display: flex;
		flex-wrap: wrap;
		gap: var(--sp-5);
		align-items: center;
	}
</style>
