<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import Picture from '$lib/components/Picture.svelte';
	import { fmtDate } from '$lib/format';

	let { data } = $props();
	const first = $derived(!data.categoria ? data.posts[0] : null);
	const rest = $derived(first ? data.posts.slice(1) : data.posts);
</script>

<Seo
	title="Blog de diseño de interiores, decoración y paisajismo"
	description="Inspiración, ideas y consejos de diseño de interiores, decoración y paisajismo para transformar tus espacios, por el equipo de Maller&M Propiedades."
/>

<PageHero
	eyebrow="Blog"
	title="Diseño, decoración e ideas para tu hogar"
	lead="Compartimos inspiración, ideas y consejos para transformar tus espacios y potenciar el valor de tu propiedad."
	crumbs={[{ href: '/', label: 'Inicio' }, { label: 'Blog' }]}
/>

<section class="section">
	<div class="container">
		<nav class="topics" aria-label="Filtrar por tema">
			<a href="/blog/" aria-current={!data.categoria ? 'page' : undefined}>Todos</a>
			{#each data.categories as c (c.slug)}
				<a href="/blog/?categoria={c.slug}" aria-current={data.categoria === c.slug ? 'page' : undefined}>{c.name} <span>{c.n}</span></a>
			{/each}
		</nav>

		{#if first}
			<article class="feature">
				<a class="f-img" href="/blog/{first.slug}/" tabindex="-1" aria-hidden="true">
					{#if first.cover}<Picture media={first.cover} alt="" sizes="(min-width: 900px) 700px, 100vw" loading="eager" />{/if}
				</a>
				<div class="f-copy">
					<p class="eyebrow">{first.categories[0]?.name ?? 'Artículo'}</p>
					<h2><a href="/blog/{first.slug}/">{first.title}</a></h2>
					<p>{first.excerpt}</p>
					<p class="meta"><time datetime={first.publishedAt}>{fmtDate(first.publishedAt)}</time> · {first.readingMinutes} min de lectura</p>
					<a class="btn" href="/blog/{first.slug}/">Leer artículo</a>
				</div>
			</article>
		{/if}

		<div class="grid grid--3">
			{#each rest as post (post.id)}<PostCard {post} />{/each}
		</div>
		{#if !data.posts.length}<p>No hay artículos en esta categoría todavía.</p>{/if}
	</div>
</section>

<style>
	.topics {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: var(--sp-7);
	}
	.topics a {
		display: inline-flex;
		gap: 6px;
		align-items: center;
		padding: 8px 16px;
		border-radius: var(--radius-pill);
		border: 1.5px solid var(--line-strong);
		color: var(--ink);
		text-decoration: none;
		font-weight: 700;
		font-size: 0.9rem;
	}
	.topics a span {
		color: var(--ink-muted);
		font-weight: 400;
	}
	.topics a[aria-current='page'] {
		background: var(--brand-primary);
		border-color: var(--brand-primary);
		color: #fff;
	}
	.topics a[aria-current='page'] span {
		color: rgba(255, 255, 255, 0.8);
	}
	.feature {
		display: grid;
		grid-template-columns: 1.3fr 1fr;
		gap: clamp(24px, 4vw, 64px);
		align-items: center;
		margin-bottom: var(--sp-8);
	}
	@media (max-width: 860px) {
		.feature {
			grid-template-columns: 1fr;
		}
	}
	.f-img {
		aspect-ratio: 16 / 10;
		border-radius: var(--radius-card);
		overflow: hidden;
		display: block;
		background: var(--surface-alt);
	}
	.f-img :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.f-copy h2 a {
		color: var(--ink);
		text-decoration: none;
	}
	.f-copy p {
		color: var(--ink-soft);
	}
	.meta {
		font-size: var(--fs-small);
	}
</style>
