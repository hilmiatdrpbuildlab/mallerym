<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		query,
		lat = null,
		lng = null,
		zoom = 13,
		label = 'Ubicación'
	}: { query?: string; lat?: number | null; lng?: number | null; zoom?: number; label?: string } = $props();

	// Click-para-cargar: Google no recibe ninguna petición (ni cookies) hasta que la persona lo decide.
	let loaded = $state(false);
	const q = $derived(lat && lng ? `${lat.toFixed(3)},${lng.toFixed(3)}` : (query ?? 'Maitencillo, Chile'));
	const src = $derived(`https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`);
	const link = $derived(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
</script>

<div class="map">
	{#if loaded}
		<iframe title={label} {src} loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
	{:else}
		<div class="ph">
			<Icon name="map" size={36} />
			<p>{label}</p>
			<button class="btn btn--secondary btn--sm" onclick={() => (loaded = true)}>Cargar mapa</button>
			<a href={link} target="_blank" rel="noopener" class="ext">Abrir en Google Maps <Icon name="external" size={14} /></a>
			<small>Al cargar el mapa, Google recibirá tu dirección IP.</small>
		</div>
	{/if}
</div>

<style>
	.map {
		position: relative;
		aspect-ratio: 16 / 10;
		border-radius: var(--radius-card);
		overflow: hidden;
		background:
			radial-gradient(circle at 30% 40%, rgba(19, 85, 107, 0.12), transparent 50%),
			repeating-linear-gradient(45deg, var(--surface-alt) 0 14px, #d9e8f6 14px 15px);
		border: 1px solid var(--line);
	}
	iframe {
		width: 100%;
		height: 100%;
		border: 0;
	}
	.ph {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: var(--sp-2);
		text-align: center;
		color: var(--brand-primary);
		padding: var(--sp-4);
	}
	.ph p {
		margin: 0;
		font-weight: 700;
		color: var(--ink);
	}
	.ext {
		display: inline-flex;
		gap: 4px;
		align-items: center;
		font-size: var(--fs-small);
	}
	small {
		color: var(--ink-muted);
		font-size: var(--fs-xs);
	}
</style>
