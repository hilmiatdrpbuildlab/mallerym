<script lang="ts">
	import { page } from '$app/state';
	import { PUBLIC_SITE_URL } from '$app/env/public';

	let {
		title,
		description = '',
		image = null,
		type = 'website',
		noindex = false,
		jsonld = null
	}: {
		title: string;
		description?: string;
		image?: string | null;
		type?: string;
		noindex?: boolean;
		jsonld?: unknown;
	} = $props();

	const full = $derived(title.includes('Maller&M') ? title : `${title} | Maller&M Propiedades`);
	const canonical = $derived(PUBLIC_SITE_URL + page.url.pathname);
	const img = $derived(image ? (image.startsWith('http') ? image : PUBLIC_SITE_URL + image) : null);
	// JSON-LD es un bloque de datos (no ejecutable): CSP no lo bloquea. Se escapa "<" para evitar cerrar el script.
	const ld = $derived(
		jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</` + 'script>' : ''
	);
</script>

<svelte:head>
	<title>{full}</title>
	{#if description}<meta name="description" content={description} />{/if}
	<link rel="canonical" href={canonical} />
	{#if noindex}<meta name="robots" content="noindex" />{/if}
	<meta property="og:site_name" content="Maller&M Propiedades" />
	<meta property="og:locale" content="es_CL" />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={full} />
	{#if description}<meta property="og:description" content={description} />{/if}
	<meta property="og:url" content={canonical} />
	{#if img}
		<meta property="og:image" content={img} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
	{#if ld}{@html ld}{/if}
</svelte:head>
