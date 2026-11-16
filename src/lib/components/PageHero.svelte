<script lang="ts">
	import type { Snippet } from 'svelte';
	import Picture from './Picture.svelte';

	let {
		title,
		eyebrow = '',
		lead = '',
		crumbs = [],
		imageId = null,
		children
	}: {
		title: string;
		eyebrow?: string;
		lead?: string;
		crumbs?: { href?: string; label: string }[];
		imageId?: string | null;
		children?: Snippet;
	} = $props();
</script>

<section class="ph" class:img={!!imageId}>
	{#if imageId}
		<div class="bg"><Picture media={{ id: imageId, width: 1440, height: 960 }} alt="" sizes="100vw" loading="eager" fetchpriority="high" /></div>
	{/if}
	<div class="container inner" class:on-dark={!!imageId}>
		{#if crumbs.length}
			<nav class="crumbs" aria-label="Migas de pan">
				{#each crumbs as c, i (i)}
					{#if c.href}<a href={c.href}>{c.label}</a> / {:else}<span aria-current="page">{c.label}</span>{/if}
				{/each}
			</nav>
		{/if}
		{#if eyebrow}<p class="eyebrow">{eyebrow}</p>{/if}
		<h1>{title}</h1>
		{#if lead}<p class="lead">{lead}</p>{/if}
		{@render children?.()}
	</div>
</section>

<style>
	.ph {
		position: relative;
		isolation: isolate;
		background: var(--surface-alt);
		padding-block: var(--sp-8) var(--sp-7);
	}
	.ph.img {
		background: var(--brand-navy);
		color: #fff;
		padding-block: clamp(96px, 12vw, 160px) clamp(48px, 6vw, 80px);
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
		background: linear-gradient(180deg, rgba(19, 28, 44, 0.35), rgba(19, 28, 44, 0.85));
	}
	.img h1 {
		color: #fff;
	}
	.img .lead {
		color: rgba(255, 255, 255, 0.88);
	}
	h1 {
		max-width: 22ch;
	}
	.crumbs {
		font-size: var(--fs-small);
		color: var(--ink-muted);
		margin-bottom: var(--sp-3);
	}
	.crumbs a {
		color: inherit;
	}
	.img .crumbs {
		color: rgba(255, 255, 255, 0.75);
	}
</style>
