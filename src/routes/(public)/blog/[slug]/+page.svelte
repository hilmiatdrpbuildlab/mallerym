<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import Picture from '$lib/components/Picture.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { renderRichText, plainText } from '$lib/richtext';
	import { fmtDate, readingTime } from '$lib/format';
	import { PUBLIC_SITE_URL } from '$app/env/public';

	let { data } = $props();
	const post = $derived(data.post);
	const html = $derived(renderRichText(post.body, data.images));
	const toc = $derived([...post.body.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].replace(/\*/g, '')));
	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		datePublished: post.publishedAt,
		dateModified: post.updatedAt,
		author: post.author ? { '@type': 'Person', name: post.author.name } : undefined,
		publisher: { '@type': 'Organization', name: 'Maller&M Propiedades' },
		image: post.cover ? `${PUBLIC_SITE_URL}/media/${post.cover.id}/1440.webp` : undefined
	});
</script>

<Seo
	title={post.metaTitle || post.title}
	description={post.metaDescription || post.excerpt || plainText(post.body)}
	image={post.cover ? `/media/${post.cover.id}/1440.webp` : null}
	type="article"
	noindex={data.preview}
	{jsonld}
/>

{#if data.preview}<div class="preview-bar" role="status"><Icon name="eye" size={18} /> Vista previa — artículo no publicado.</div>{/if}

<article>
	<header class="head">
		<div class="container narrow">
			<nav class="crumbs" aria-label="Migas de pan"><a href="/">Inicio</a> / <a href="/blog/">Blog</a></nav>
			{#if post.categories[0]}<p class="eyebrow">{post.categories.map((c) => c.name).join(' · ')}</p>{/if}
			<h1>{post.title}</h1>
			<p class="meta">
				{#if post.author}<span>Por <strong>{post.author.name}</strong></span> ·{/if}
				<time datetime={post.publishedAt?.toISOString()}>{fmtDate(post.publishedAt)}</time> ·
				<span>{readingTime(plainText(post.body, 100000))} min de lectura</span>
			</p>
		</div>
	</header>
	{#if post.cover}
		<div class="container cover-wrap">
			<div class="cover"><Picture media={post.cover} sizes="(min-width: 1100px) 1100px, 100vw" loading="eager" fetchpriority="high" /></div>
		</div>
	{/if}
	<div class="container body-grid">
		{#if toc.length > 2}
			<aside class="toc" aria-label="Contenido del artículo">
				<p>En este artículo</p>
				<ol>{#each toc as t (t)}<li>{t}</li>{/each}</ol>
			</aside>
		{/if}
		<div class="prose article">{@html html}</div>
	</div>
</article>

<section class="section">
	<div class="container narrow">
		<div class="cta">
			<div>
				<p class="eyebrow">Diseño de interiores</p>
				<h2>¿Quieres transformar tu espacio?</h2>
				<p>Nuestra diseñadora te ayuda con home staging, decoración para arriendo temporal y proyectos residenciales.</p>
			</div>
			<a class="btn btn--gold" href="/servicios/diseno/">Conocer el servicio</a>
		</div>
	</div>
</section>

{#if data.related.length}
	<section class="section section--alt">
		<div class="container">
			<div class="section-head"><div><p class="eyebrow">Sigue leyendo</p><h2>Artículos relacionados</h2></div></div>
			<div class="grid grid--3">{#each data.related as p (p.id)}<PostCard post={p} />{/each}</div>
		</div>
	</section>
{/if}

<style>
	.preview-bar {
		display: flex;
		gap: 8px;
		justify-content: center;
		padding: 10px;
		background: var(--warning-bg);
		color: var(--warning);
		font-weight: 700;
	}
	.narrow {
		max-width: 900px;
	}
	.head {
		padding-block: var(--sp-8) var(--sp-6);
	}
	.crumbs {
		font-size: var(--fs-small);
		color: var(--ink-muted);
		margin-bottom: var(--sp-4);
	}
	.crumbs a {
		color: inherit;
	}
	.meta {
		color: var(--ink-muted);
		font-size: 0.95rem;
	}
	.cover-wrap {
		max-width: 1160px;
	}
	.cover {
		aspect-ratio: 16 / 8;
		border-radius: 10px;
		overflow: hidden;
		background: var(--surface-alt);
	}
	.cover :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.body-grid {
		display: grid;
		grid-template-columns: 220px minmax(0, 720px);
		justify-content: center;
		gap: var(--sp-8);
		padding-top: var(--sp-7);
	}
	.body-grid:not(:has(.toc)) {
		grid-template-columns: minmax(0, 720px);
	}
	.article {
		font-size: 1.08rem;
		max-width: none;
	}
	.toc {
		position: sticky;
		top: 100px;
		align-self: start;
		font-size: var(--fs-small);
		color: var(--ink-muted);
		border-left: 2px solid var(--brand-gold);
		padding-left: var(--sp-4);
	}
	.toc p {
		font-weight: 800;
		color: var(--ink);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: var(--fs-xs);
	}
	.toc ol {
		padding-left: 1.1em;
		margin: 0;
		display: grid;
		gap: 8px;
	}
	@media (max-width: 960px) {
		.body-grid {
			grid-template-columns: minmax(0, 1fr);
		}
		.toc {
			display: none;
		}
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-5);
		padding: clamp(24px, 4vw, 48px);
		background: var(--brand-navy);
		border-radius: 10px;
		color: #c9d4df;
	}
	.cta h2 {
		color: #fff;
	}
	.cta p {
		margin: 0;
	}
	.cta .eyebrow {
		color: var(--brand-gold-light);
	}
</style>
