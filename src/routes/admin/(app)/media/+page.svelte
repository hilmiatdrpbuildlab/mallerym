<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Uploader from '$lib/components/admin/Uploader.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data, form } = $props();
	let showUp = $state(false);
	const kb = (b: number) => `${Math.round(b / 1024)} KB`;
</script>

<svelte:head><title>Media | CMS Maller&M</title></svelte:head>

<div class="page-head">
	<div>
		<h1>Biblioteca de medios</h1>
		<p>{data.stats.n} archivos · {data.stats.size} en Neon. Las imágenes se sirven re-codificadas en WebP, sin metadatos, con caché en el borde.</p>
	</div>
	<button class="btn" onclick={() => (showUp = !showUp)}><Icon name="upload" size={16} /> Subir</button>
</div>

{#if showUp}<div class="card"><Uploader folder="site" onuploaded={() => invalidateAll()} /></div>{/if}
{#if form?.error}<p class="alert alert--error">{form.error}</p>{/if}

<form class="card filters" method="GET">
	<input class="input" name="q" placeholder="Buscar por texto alternativo…" value={data.q} />
	<select class="select" name="carpeta">
		<option value="">Todas las carpetas</option>
		{#each ['propiedades', 'blog', 'equipo', 'site'] as f (f)}<option value={f} selected={data.folder === f}>{f}</option>{/each}
	</select>
	<button class="btn btn--secondary">Filtrar</button>
</form>

<ul class="grid-m">
	{#each data.rows as m (m.id)}
		<li class="card item">
			<a href="/media/{m.id}/1440.webp" target="_blank" class="img"><img src="/media/{m.id}/640.webp" alt={m.alt_text} loading="lazy" /></a>
			<form method="POST" action="?/alt" use:enhance={() => async ({ update }) => update({ reset: false })}>
				<input type="hidden" name="id" value={m.id} />
				<input class="input alt" name="alt" value={m.alt_text} aria-label="Texto alternativo" maxlength="200" />
				<div class="meta">
					<span class="muted small">{m.folder} · {m.width}×{m.height} · {kb(m.bytes)} · {m.used ? `en uso (${m.used})` : 'sin uso'}</span>
					<span class="acts">
						<button class="btn btn--plain btn--sm" type="submit">{form?.saved === m.id ? '✓' : 'Guardar'}</button>
						<button class="btn btn--plain btn--sm danger" formaction="?/remove" disabled={m.used > 0} title={m.used ? 'En uso' : 'Eliminar'} aria-label="Eliminar"><Icon name="trash" size={14} /></button>
					</span>
				</div>
			</form>
		</li>
	{/each}
</ul>

<style>
	.filters {
		display: grid;
		grid-template-columns: 1fr 220px auto;
		gap: 8px;
		margin: var(--sp-4) 0;
	}
	.grid-m {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: var(--sp-3);
	}
	.grid-m .card + .card {
		margin-top: 0;
	}
	.item {
		padding: 8px;
		display: grid;
		gap: 6px;
	}
	.img {
		display: block;
		aspect-ratio: 3 / 2;
		border-radius: 6px;
		overflow: hidden;
		background: var(--surface-alt);
	}
	.img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.alt {
		min-height: 34px !important;
		font-size: 0.8rem !important;
	}
	.meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 4px;
		margin-top: 4px;
	}
	.acts {
		display: flex;
	}
	.danger {
		--btn-fg: var(--danger);
	}
</style>
