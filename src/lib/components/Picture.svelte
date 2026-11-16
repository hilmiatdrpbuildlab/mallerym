<script lang="ts">
	import type { MediaRef } from '$lib/server/content';

	let {
		media,
		sizes = '100vw',
		loading = 'lazy',
		fetchpriority,
		class: klass = '',
		alt
	}: {
		media: Pick<MediaRef, 'id' | 'width' | 'height'> & { alt?: string; placeholder?: string | null };
		sizes?: string;
		loading?: 'lazy' | 'eager';
		fetchpriority?: 'high' | 'low' | 'auto';
		class?: string;
		alt?: string;
	} = $props();

	const w = $derived(media.width ?? 1440);
	const h = $derived(media.height ?? 960);
</script>

<!-- Variantes WebP 640/1440 servidas desde Neon vía /media con caché inmutable en el borde -->
<img
	class={klass}
	src="/media/{media.id}/1440.webp"
	srcset="/media/{media.id}/640.webp 640w, /media/{media.id}/1440.webp {Math.max(w, 641)}w"
	{sizes}
	width={w}
	height={h}
	alt={alt ?? media.alt ?? ''}
	{loading}
	decoding="async"
	{fetchpriority}
/>
