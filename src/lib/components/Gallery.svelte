<script lang="ts">
	import Picture from './Picture.svelte';
	import Icon from './Icon.svelte';

	type Img = { id: string; alt: string; width: number | null; height: number | null };
	let { images, title }: { images: Img[]; title: string } = $props();

	let open = $state(false);
	let index = $state(0);
	let dialog: HTMLDialogElement;
	let touchX = 0;

	function show(i: number) {
		index = i;
		open = true;
		dialog.showModal();
	}
	function close() {
		open = false;
		dialog.close();
	}
	const next = () => (index = (index + 1) % images.length);
	const prev = () => (index = (index - 1 + images.length) % images.length);
	function onKey(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'ArrowRight') next();
		if (e.key === 'ArrowLeft') prev();
	}
	const thumbs = $derived(images.slice(1, 5));
</script>

<svelte:window onkeydown={onKey} />

{#if images.length}
	<div class="gal" class:single={images.length === 1}>
		<button class="main" onclick={() => show(0)} aria-label="Ver fotografía 1 de {images.length} en pantalla completa">
			<Picture media={images[0]} sizes="(min-width: 1100px) 760px, 100vw" loading="eager" fetchpriority="high" />
		</button>
		{#each thumbs as img, i (img.id)}
			<button class="thumb" onclick={() => show(i + 1)} aria-label="Ver fotografía {i + 2} de {images.length}">
				<Picture media={img} sizes="(min-width: 1100px) 260px, 25vw" />
				{#if i === thumbs.length - 1 && images.length > 5}
					<span class="more"><Icon name="image" size={18} /> +{images.length - 5} fotos</span>
				{/if}
			</button>
		{/each}
		<button class="all btn btn--light btn--sm" onclick={() => show(0)}><Icon name="image" size={16} /> Ver las {images.length} fotos</button>
	</div>
{/if}

<dialog
	bind:this={dialog}
	class="lightbox"
	aria-label="Galería de {title}"
	onclose={() => (open = false)}
	ontouchstart={(e) => (touchX = e.touches[0].clientX)}
	ontouchend={(e) => {
		const dx = e.changedTouches[0].clientX - touchX;
		if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
	}}
>
	{#if open}
		<div class="lb-top">
			<span aria-live="polite">{index + 1} / {images.length}</span>
			<button class="lb-btn" onclick={close} aria-label="Cerrar galería"><Icon name="close" size={26} /></button>
		</div>
		<div class="lb-stage">
			{#key index}
				<Picture media={images[index]} sizes="100vw" loading="eager" class="lb-img" />
			{/key}
		</div>
		{#if images.length > 1}
			<button class="lb-btn lb-prev" onclick={prev} aria-label="Fotografía anterior"><Icon name="arrow-left" size={28} /></button>
			<button class="lb-btn lb-next" onclick={next} aria-label="Fotografía siguiente"><Icon name="arrow-right" size={28} /></button>
		{/if}
		<p class="lb-cap">{images[index].alt}</p>
	{/if}
</dialog>

<style>
	.gal {
		position: relative;
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 8px;
		aspect-ratio: 16 / 8;
		border-radius: 10px;
		overflow: hidden;
	}
	.gal.single {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
	}
	.gal button.main,
	.gal button.thumb {
		position: relative;
		padding: 0;
		border: 0;
		cursor: zoom-in;
		background: var(--surface-alt);
		overflow: hidden;
	}
	.main {
		grid-row: 1 / 3;
	}
	.gal :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s var(--ease);
	}
	.gal button:hover :global(img) {
		transform: scale(1.03);
	}
	.more {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		grid-auto-flow: column;
		gap: 6px;
		align-items: center;
		background: rgba(19, 28, 44, 0.55);
		color: #fff;
		font-weight: 700;
	}
	.all {
		position: absolute;
		right: 12px;
		bottom: 12px;
	}
	@media (max-width: 720px) {
		.gal {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr;
			aspect-ratio: 4 / 3;
			border-radius: 0;
			margin-inline: calc(var(--gutter) * -1);
			width: calc(100% + 2 * var(--gutter));
		}
		.thumb {
			display: none;
		}
	}
	.lightbox {
		width: 100vw;
		height: 100dvh;
		max-width: none;
		max-height: none;
		margin: 0;
		padding: 0;
		border: 0;
		background: rgba(8, 12, 20, 0.97);
		color: #fff;
	}
	.lightbox::backdrop {
		background: rgba(8, 12, 20, 0.9);
	}
	.lb-top {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		z-index: 2;
		font-variant-numeric: tabular-nums;
	}
	.lb-stage {
		position: absolute;
		inset: 60px 0 60px;
		display: grid;
		place-items: center;
		padding: 0 64px;
	}
	.lb-stage :global(.lb-img) {
		max-width: 100%;
		max-height: 100%;
		width: auto;
		height: auto;
		object-fit: contain;
		animation: reveal 0.3s var(--ease);
	}
	.lb-btn {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: 0;
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
		cursor: pointer;
	}
	.lb-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	.lb-prev,
	.lb-next {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 2;
	}
	.lb-prev {
		left: 12px;
	}
	.lb-next {
		right: 12px;
	}
	.lb-cap {
		position: absolute;
		bottom: 12px;
		left: 0;
		right: 0;
		text-align: center;
		font-size: var(--fs-small);
		color: #c9d4df;
		margin: 0;
		padding: 0 16px;
	}
	@media (max-width: 720px) {
		.lb-stage {
			padding: 0;
		}
		.lb-prev,
		.lb-next {
			top: auto;
			bottom: 40px;
			transform: none;
		}
	}
</style>
