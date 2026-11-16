<script lang="ts">
	import Uploader from './Uploader.svelte';
	import Icon from '../Icon.svelte';

	let {
		name,
		value = $bindable<string | null>(null),
		folder = 'site',
		label = 'Imagen'
	}: { name: string; value?: string | null; folder?: 'propiedades' | 'blog' | 'equipo' | 'site'; label?: string } = $props();

	let dialog: HTMLDialogElement;
	let items = $state<{ id: string; alt: string }[]>([]);
	let q = $state('');
	let scope = $state<'folder' | 'all'>('folder');
	let loading = $state(false);

	async function load() {
		loading = true;
		const params = new URLSearchParams();
		if (scope === 'folder') params.set('folder', folder);
		if (q) params.set('q', q);
		const res = await fetch(`/admin/api/media/?${params}`);
		items = res.ok ? await res.json() : [];
		loading = false;
	}
	function openPicker() {
		dialog.showModal();
		load();
	}
</script>

<div class="picker">
	<span class="lbl">{label}</span>
	{#if name}<input type="hidden" {name} value={value ?? ''} />{/if}
	<div class="row">
		<div class="prev">
			{#if value}<img src="/media/{value}/640.webp" alt="" />{:else}<Icon name="image" size={28} />{/if}
		</div>
		<div class="acts">
			<button class="btn btn--secondary btn--sm" type="button" onclick={openPicker}>{value ? 'Cambiar' : 'Elegir'} imagen</button>
			{#if value}<button class="btn btn--plain btn--sm" type="button" onclick={() => (value = null)}>Quitar</button>{/if}
		</div>
	</div>
</div>

<dialog bind:this={dialog} class="dlg" aria-label="Biblioteca de medios">
	<div class="dlg-head">
		<h2>Biblioteca de medios</h2>
		<button class="btn btn--plain btn--sm" type="button" onclick={() => dialog.close()} aria-label="Cerrar"><Icon name="close" /></button>
	</div>
	<div class="filters">
		<input class="input" placeholder="Buscar por texto alternativo…" bind:value={q} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), load())} />
		<select class="select" bind:value={scope} onchange={load}>
			<option value="folder">Carpeta: {folder}</option>
			<option value="all">Todas las carpetas</option>
		</select>
		<button class="btn btn--sm" type="button" onclick={load}>Buscar</button>
	</div>
	<Uploader
		{folder}
		multiple={false}
		onuploaded={(m) => {
			value = m.id;
			dialog.close();
		}}
	/>
	<div class="grid-m">
		{#if loading}<p class="muted">Cargando…</p>{/if}
		{#each items as it (it.id)}
			<button
				type="button"
				class="tile"
				class:sel={it.id === value}
				onclick={() => {
					value = it.id;
					dialog.close();
				}}
				title={it.alt}
			>
				<img src="/media/{it.id}/640.webp" alt={it.alt} loading="lazy" />
			</button>
		{/each}
	</div>
</dialog>

<style>
	.lbl {
		display: block;
		font-weight: 700;
		font-size: 0.92rem;
		margin-bottom: 6px;
	}
	.row {
		display: flex;
		gap: var(--sp-3);
		align-items: center;
	}
	.prev {
		width: 120px;
		height: 80px;
		border-radius: 6px;
		overflow: hidden;
		background: var(--surface-alt);
		display: grid;
		place-items: center;
		color: var(--ink-muted);
		flex: none;
	}
	.prev img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.acts {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.dlg {
		width: min(920px, calc(100vw - 24px));
		max-height: 88dvh;
		border: 0;
		border-radius: 12px;
		padding: var(--sp-5);
		box-shadow: var(--shadow-hover);
	}
	.dlg::backdrop {
		background: rgba(10, 37, 64, 0.5);
	}
	.dlg-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.filters {
		display: grid;
		grid-template-columns: 1fr 200px auto;
		gap: 8px;
		margin-bottom: var(--sp-3);
	}
	.grid-m {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		gap: 8px;
		margin-top: var(--sp-4);
	}
	.tile {
		padding: 0;
		border: 3px solid transparent;
		border-radius: 6px;
		overflow: hidden;
		cursor: pointer;
		aspect-ratio: 4 / 3;
		background: var(--surface-alt);
	}
	.tile img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.tile.sel,
	.tile:hover {
		border-color: var(--brand-gold);
	}
</style>
