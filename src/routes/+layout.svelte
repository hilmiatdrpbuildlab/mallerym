<script lang="ts">
	// Fuentes autoalojadas (sin Google Fonts CDN → CSP font-src 'self')
	import '@fontsource/manrope/600.css';
	import '@fontsource/manrope/700.css';
	import '@fontsource/manrope/800.css';
	import '@fontsource/lato/400.css';
	import '@fontsource/lato/700.css';
	import '$lib/design/app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</svelte:head>

{@render children()}
