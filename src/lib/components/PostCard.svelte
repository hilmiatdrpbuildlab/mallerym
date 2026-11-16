<script lang="ts">
	import type { PostCard } from '$lib/server/content';
	import { fmtDate } from '$lib/format';
	import Picture from './Picture.svelte';

	let { post }: { post: PostCard } = $props();
</script>

<article class="post">
	<a href="/blog/{post.slug}/" class="media" tabindex="-1" aria-hidden="true">
		{#if post.cover}
			<Picture media={post.cover} alt="" sizes="(min-width: 1100px) 400px, (min-width: 700px) 50vw, 100vw" />
		{/if}
	</a>
	<div class="body">
		<p class="meta">
			{#if post.categories[0]}<span class="cat">{post.categories[0].name}</span>{/if}
			<time datetime={post.publishedAt}>{fmtDate(post.publishedAt)}</time>
			<span>· {post.readingMinutes} min de lectura</span>
		</p>
		<h3><a href="/blog/{post.slug}/">{post.title}</a></h3>
		{#if post.excerpt}<p class="excerpt">{post.excerpt}</p>{/if}
		<span class="link-arrow" aria-hidden="true">Leer artículo</span>
	</div>
</article>

<style>
	.post {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.media {
		display: block;
		aspect-ratio: 16 / 10;
		border-radius: var(--radius-card);
		overflow: hidden;
		background: var(--surface-alt);
	}
	.media :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s var(--ease);
	}
	.post:hover .media :global(img) {
		transform: scale(1.03);
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
		padding-top: var(--sp-4);
		flex: 1;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 8px;
		align-items: center;
		margin: 0;
		font-size: var(--fs-xs);
		color: var(--ink-muted);
	}
	.cat {
		font-family: var(--font-heading);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--brand-gold-ink);
	}
	h3 {
		font-size: 1.2rem;
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
	.excerpt {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.95rem;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.link-arrow {
		margin-top: auto;
		padding-top: var(--sp-2);
		font-size: 0.92rem;
	}
</style>
