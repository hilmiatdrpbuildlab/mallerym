<script lang="ts">
	import type { PropertyCard } from '$lib/server/content';
	import { OPERATION_LABEL, AVAILABILITY_LABEL, fmtM2 } from '$lib/format';
	import Picture from './Picture.svelte';
	import PriceTag from './PriceTag.svelte';
	import Icon from './Icon.svelte';

	let { p, eager = false }: { p: PropertyCard; eager?: boolean } = $props();
	const closed = $derived(p.availability === 'vendida' || p.availability === 'arrendada');
</script>

<article class="card" class:closed>
	<a href="/propiedades/{p.slug}/" class="media" tabindex="-1" aria-hidden="true">
		{#if p.cover}
			<Picture
				media={p.cover}
				alt=""
				sizes="(min-width: 1100px) 400px, (min-width: 700px) 50vw, 100vw"
				loading={eager ? 'eager' : 'lazy'}
			/>
		{:else}
			<div class="noimg"><Icon name="image" size={36} /></div>
		{/if}
		<div class="badges">
			<span class="badge badge--{p.operation}">{OPERATION_LABEL[p.operation]}</span>
			{#if p.featured}<span class="badge badge--gold">Destacado</span>{/if}
			{#if p.availability !== 'disponible'}<span class="badge badge--sold">{AVAILABILITY_LABEL[p.availability]}</span>{/if}
		</div>
	</a>
	<div class="body">
		<p class="meta">
			<Icon name="pin" size={15} />
			{p.typeName} · {p.sector}{p.condominium ? ` · ${p.condominium}` : ''}
		</p>
		<h3><a href="/propiedades/{p.slug}/">{p.title}</a></h3>
		<ul class="specs" aria-label="Características principales">
			{#if p.specs.builtM2}<li><Icon name="area" size={16} /> {fmtM2(p.specs.builtM2)}</li>{/if}
			{#if p.specs.landM2}<li><Icon name="land" size={16} /> {fmtM2(p.specs.landM2)} terreno</li>{/if}
			{#if p.specs.bedrooms}<li><Icon name="bed" size={16} /> {p.specs.bedrooms} dorm.</li>{/if}
			{#if p.specs.bathrooms}<li><Icon name="bath" size={16} /> {p.specs.bathrooms} baños</li>{/if}
			{#if p.specs.guests}<li><Icon name="users" size={16} /> {p.specs.guests} huéspedes</li>{/if}
		</ul>
		<div class="foot">
			<PriceTag price={p.price} size="sm" />
			<span class="go" aria-hidden="true"><Icon name="arrow-right" size={18} /></span>
		</div>
	</div>
</article>

<style>
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-card);
		overflow: hidden;
		transition:
			box-shadow 0.3s var(--ease),
			transform 0.3s var(--ease),
			border-color 0.3s;
		height: 100%;
	}
	.card:hover {
		box-shadow: var(--shadow-hover);
		border-color: transparent;
		transform: translateY(-2px);
	}
	.media {
		position: relative;
		display: block;
		aspect-ratio: 3 / 2;
		overflow: hidden;
		background: var(--surface-alt);
	}
	.media :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s var(--ease);
	}
	.card:hover .media :global(img) {
		transform: scale(1.03);
	}
	.closed .media :global(img) {
		filter: grayscale(0.6);
	}
	.noimg {
		display: grid;
		place-items: center;
		height: 100%;
		color: var(--ink-muted);
	}
	.badges {
		position: absolute;
		top: 12px;
		left: 12px;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: var(--sp-3);
		padding: var(--sp-5);
		flex: 1;
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0;
		font-size: var(--fs-small);
		color: var(--ink-muted);
	}
	h3 {
		font-size: 1.125rem;
		line-height: 1.3;
		margin: 0;
	}
	h3 a {
		color: var(--ink);
		text-decoration: none;
	}
	h3 a::after {
		content: '';
		position: absolute;
		inset: 0;
	}
	h3 a:focus-visible {
		outline: none;
	}
	.card:has(h3 a:focus-visible) {
		outline: 3px solid var(--brand-gold);
		outline-offset: 2px;
	}
	.specs {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 14px;
		list-style: none;
		padding: 0;
		margin: 0;
		font-size: var(--fs-small);
		color: var(--ink-soft);
	}
	.specs li {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.foot {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: var(--sp-3);
		margin-top: auto;
		padding-top: var(--sp-3);
		border-top: 1px solid var(--line);
	}
	.go {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--brand-primary-050);
		color: var(--brand-primary);
		transition:
			background 0.2s,
			color 0.2s;
		flex: none;
	}
	.card:hover .go {
		background: var(--brand-primary);
		color: #fff;
	}
</style>
