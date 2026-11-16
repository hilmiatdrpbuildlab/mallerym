<script lang="ts">
	import Picture from './Picture.svelte';
	import { waLink } from '$lib/format';
	import Icon from './Icon.svelte';

	let {
		title = 'Si estás buscando vender, comprar o arrendar, te invitamos a contar con nuestros servicios.',
		imageId = null,
		whatsapp
	}: { title?: string; imageId?: string | null; whatsapp: string } = $props();
</script>

<section class="band">
	{#if imageId}
		<div class="bg"><Picture media={{ id: imageId, width: 1440, height: 960 }} alt="" sizes="100vw" /></div>
	{/if}
	<div class="container inner on-dark">
		<p class="eyebrow">Hablemos</p>
		<h2>{title}</h2>
		<div class="ctas">
			<a class="btn btn--gold" href="/contacto-y-ubicacion/">Contáctanos</a>
			<a class="btn btn--ghost-light" href={waLink(whatsapp)} target="_blank" rel="noopener"><Icon name="whatsapp" /> WhatsApp</a>
		</div>
	</div>
</section>

<style>
	.band {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		background: var(--brand-primary);
		color: #fff;
		padding-block: clamp(64px, 8vw, 112px);
	}
	.bg {
		position: absolute;
		inset: 0;
		z-index: -1;
	}
	.bg :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.bg::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, rgba(19, 70, 87, 0.95) 0%, rgba(19, 70, 87, 0.82) 55%, rgba(19, 28, 44, 0.55) 100%);
	}
	h2 {
		color: #fff;
		max-width: 26ch;
		margin-bottom: var(--sp-6);
	}
	.ctas {
		display: flex;
		flex-wrap: wrap;
		gap: var(--sp-3);
	}
</style>
