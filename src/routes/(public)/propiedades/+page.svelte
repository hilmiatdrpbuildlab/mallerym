<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { flip } from 'svelte/animate';
	import Seo from '$lib/components/Seo.svelte';
	import PropertyCard from '$lib/components/PropertyCard.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data } = $props();
	const f = $derived(data.filters);
	let sheetOpen = $state(false);
	let formEl: HTMLFormElement;

	const OP_LABEL: Record<string, string> = { venta: 'Venta', arriendo: 'Arriendo', 'arriendo-temporal': 'Arriendo temporal' };

	function submit() {
		const fd = new FormData(formEl);
		const qs = new URLSearchParams();
		for (const [k, v] of fd) if (typeof v === 'string' && v) qs.set(k, v);
		goto(`/propiedades/${qs.size ? `?${qs}` : ''}`, { reset: false });
	}

	function without(key: string) {
		const qs = new URLSearchParams(page.url.search);
		qs.delete(key);
		if (key === 'min' || key === 'max') qs.delete('moneda');
		return `/propiedades/${qs.size ? `?${qs}` : ''}`;
	}

	const chips = $derived(
		[
			f.operacion && { key: 'operacion', label: OP_LABEL[f.operacion] },
			f.tipo && { key: 'tipo', label: data.options.types.find((t) => t.slug === f.tipo)?.name ?? f.tipo },
			f.zona && { key: 'zona', label: data.options.zones.find((z) => z.slug === f.zona)?.name ?? f.zona },
			f.min && { key: 'min', label: `Desde ${f.min.toLocaleString('es-CL')} ${f.moneda ?? 'UF'}` },
			f.max && { key: 'max', label: `Hasta ${f.max.toLocaleString('es-CL')} ${f.moneda ?? 'UF'}` },
			f.dorm && { key: 'dorm', label: `${f.dorm}+ dormitorios` },
			f.ver && { key: 'ver', label: 'Incluye vendidas/arrendadas' }
		].filter(Boolean) as { key: string; label: string }[]
	);

	const heading = $derived(
		[f.tipo ? data.options.types.find((t) => t.slug === f.tipo)?.name : 'Propiedades', f.operacion ? `en ${OP_LABEL[f.operacion].toLowerCase()}` : '', f.zona ? `en ${data.options.zones.find((z) => z.slug === f.zona)?.name}` : '']
			.filter(Boolean)
			.join(' ')
	);
</script>

<Seo
	title={chips.length ? `${heading} | Propiedades` : 'Propiedades en venta y arriendo en Maitencillo y el litoral'}
	description="Casas, departamentos, parcelas, sitios y cabañas en venta y arriendo en Maitencillo, Zapallar, Papudo, Puchuncaví y Concón. Filtra por operación, tipo, zona, precio y dormitorios."
/>

<section class="page-hero">
	<div class="container">
		<nav class="crumbs" aria-label="Migas de pan"><a href="/">Inicio</a> / <span>Propiedades</span></nav>
		<h1>{chips.length ? heading : 'Portafolio de propiedades'}</h1>
		<p class="lead">Selecciona y filtra según tus requerimientos. Comparte el enlace por WhatsApp: los filtros quedan en la URL.</p>
	</div>
</section>

<section class="section listing">
	<div class="container layout">
		<aside class="filters" class:open={sheetOpen} aria-label="Filtros">
			<div class="sheet-head">
				<h2>Filtrar</h2>
				<button class="close" onclick={() => (sheetOpen = false)} aria-label="Cerrar filtros"><Icon name="close" /></button>
			</div>
			<form
				bind:this={formEl}
				method="GET"
				action="/propiedades/"
				onchange={submit}
				onsubmit={(e) => {
					e.preventDefault();
					submit();
					sheetOpen = false;
				}}
			>
				<fieldset>
					<legend>Operación</legend>
					<div class="seg">
						{#each [['', 'Todas'], ['venta', 'Venta'], ['arriendo', 'Arriendo'], ['arriendo-temporal', 'Temporal']] as [v, l] (v)}
							<label><input type="radio" name="operacion" value={v} checked={(f.operacion ?? '') === v} /><span>{l}</span></label>
						{/each}
					</div>
				</fieldset>
				<div class="field">
					<label for="f-tipo">Tipo de propiedad</label>
					<select id="f-tipo" class="select" name="tipo">
						<option value="">Todos</option>
						{#each data.options.types as t (t.slug)}<option value={t.slug} selected={f.tipo === t.slug}>{t.name} ({t.n})</option>{/each}
					</select>
				</div>
				<div class="field">
					<label for="f-zona">Zona</label>
					<select id="f-zona" class="select" name="zona">
						<option value="">Todas</option>
						{#each data.options.zones as z (z.slug)}<option value={z.slug} selected={f.zona === z.slug}>{z.name} ({z.n})</option>{/each}
					</select>
				</div>
				<fieldset>
					<legend>Precio</legend>
					<div class="price-row">
						<select class="select" name="moneda" aria-label="Moneda">
							<option value="UF" selected={(f.moneda ?? 'UF') === 'UF'}>UF</option>
							<option value="CLP" selected={f.moneda === 'CLP'}>CLP</option>
						</select>
						<input class="input" name="min" inputmode="numeric" placeholder="Mín." aria-label="Precio mínimo" value={f.min ?? ''} />
						<input class="input" name="max" inputmode="numeric" placeholder="Máx." aria-label="Precio máximo" value={f.max ?? ''} />
					</div>
				</fieldset>
				<div class="field">
					<label for="f-dorm">Dormitorios</label>
					<select id="f-dorm" class="select" name="dorm">
						<option value="">Cualquiera</option>
						{#each [1, 2, 3, 4, 5] as n (n)}<option value={n} selected={f.dorm === n}>{n}+</option>{/each}
					</select>
				</div>
				<label class="check">
					<input type="checkbox" name="ver" value="todas" checked={f.ver === 'todas'} />
					<span>Mostrar también vendidas y arrendadas</span>
				</label>
				<input type="hidden" name="orden" value={f.orden ?? ''} />
				<button class="btn btn--block" type="submit">Ver {data.items.length} resultados</button>
				{#if chips.length}<a class="reset" href="/propiedades/">Limpiar filtros</a>{/if}
			</form>
		</aside>

		<div class="results">
			<div class="toolbar">
				<p class="count" aria-live="polite"><strong>{data.items.length}</strong> {data.items.length === 1 ? 'propiedad' : 'propiedades'}</p>
				<div class="tools">
					<button class="btn btn--secondary btn--sm only-mobile" onclick={() => (sheetOpen = true)}><Icon name="filter" size={16} /> Filtros{chips.length ? ` (${chips.length})` : ''}</button>
					<label class="sort">
						<span class="sr-only">Ordenar por</span>
						<select
							class="select"
							value={f.orden ?? 'recientes'}
							onchange={(e) => {
								const qs = new URLSearchParams(page.url.search);
								const v = (e.currentTarget as HTMLSelectElement).value;
								if (v === 'recientes') qs.delete('orden');
								else qs.set('orden', v);
								goto(`/propiedades/${qs.size ? `?${qs}` : ''}`, { reset: false });
							}}
						>
							<option value="recientes">Más recientes</option>
							<option value="precio-asc">Precio: menor a mayor</option>
							<option value="precio-desc">Precio: mayor a menor</option>
						</select>
					</label>
				</div>
			</div>
			{#if chips.length}
				<ul class="chips" aria-label="Filtros activos">
					{#each chips as c (c.key)}
						<li><a href={without(c.key)} data-sveltekit-reset="false" aria-label="Quitar filtro {c.label}">{c.label} <Icon name="close" size={14} /></a></li>
					{/each}
				</ul>
			{/if}

			{#if data.items.length}
				<div class="grid grid--3 cards">
					{#each data.items as p, i (p.id)}
						<div animate:flip={{ duration: 300 }}><PropertyCard {p} eager={i < 3} /></div>
					{/each}
				</div>
			{:else}
				<div class="empty">
					<Icon name="search" size={40} />
					<h2>No encontramos propiedades con esos filtros</h2>
					<p>Prueba ampliar la búsqueda o cuéntanos qué necesitas: muchas propiedades llegan antes de ser publicadas.</p>
					<div class="empty-ctas">
						<a class="btn btn--secondary" href="/propiedades/">Ver todas</a>
						<a class="btn" href="/contacto-y-ubicacion/?motivo=consulta_propiedad">Cuéntanos qué buscas</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>
{#if sheetOpen}<button class="scrim" aria-label="Cerrar filtros" onclick={() => (sheetOpen = false)}></button>{/if}

<style>
	.page-hero {
		background: var(--surface-alt);
		padding-block: var(--sp-8) var(--sp-7);
	}
	.crumbs {
		font-size: var(--fs-small);
		color: var(--ink-muted);
		margin-bottom: var(--sp-3);
	}
	.crumbs a {
		color: var(--ink-muted);
	}
	.listing {
		padding-top: var(--sp-7);
	}
	.layout {
		display: grid;
		grid-template-columns: 290px 1fr;
		gap: var(--sp-7);
		align-items: start;
	}
	.filters {
		position: sticky;
		top: 96px;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-card);
		padding: var(--sp-5);
	}
	.filters form {
		display: grid;
		gap: var(--sp-5);
	}
	.sheet-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--sp-4);
	}
	.sheet-head h2 {
		font-size: 1.1rem;
		margin: 0;
	}
	.close {
		display: none;
		background: none;
		border: 0;
		cursor: pointer;
		padding: 6px;
	}
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}
	legend {
		font-weight: 700;
		font-size: 0.92rem;
		margin-bottom: 8px;
	}
	.seg {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}
	.seg label {
		position: relative;
	}
	.seg input {
		position: absolute;
		opacity: 0;
		inset: 0;
	}
	.seg span {
		display: grid;
		place-items: center;
		min-height: 40px;
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius-btn);
		font-weight: 700;
		font-size: 0.86rem;
		cursor: pointer;
	}
	.seg input:checked + span {
		background: var(--brand-primary);
		border-color: var(--brand-primary);
		color: #fff;
	}
	.seg input:focus-visible + span {
		outline: 3px solid var(--brand-gold);
		outline-offset: 2px;
	}
	.price-row {
		display: grid;
		grid-template-columns: 78px 1fr 1fr;
		gap: 6px;
	}
	.price-row .select,
	.price-row .input {
		padding-inline: 10px;
	}
	.reset {
		text-align: center;
		font-size: var(--fs-small);
	}
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-3);
		margin-bottom: var(--sp-4);
	}
	.count {
		margin: 0;
		color: var(--ink-soft);
	}
	.tools {
		display: flex;
		gap: var(--sp-2);
		align-items: center;
	}
	.sort .select {
		min-height: 40px;
		padding-block: 6px;
		font-size: 0.9rem;
	}
	.only-mobile {
		display: none;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		list-style: none;
		padding: 0;
		margin: 0 0 var(--sp-5);
	}
	.chips a {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: var(--radius-pill);
		background: var(--brand-primary-050);
		color: var(--brand-primary);
		font-weight: 700;
		font-size: 0.85rem;
		text-decoration: none;
	}
	.chips a:hover {
		background: var(--brand-primary);
		color: #fff;
	}
	.cards {
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 290px), 1fr));
	}
	.empty {
		text-align: center;
		padding: var(--sp-8) var(--sp-4);
		border: 1px dashed var(--line-strong);
		border-radius: var(--radius-card);
		color: var(--ink-muted);
	}
	.empty h2 {
		font-size: 1.3rem;
		margin-top: var(--sp-4);
		color: var(--ink);
	}
	.empty-ctas {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: var(--sp-3);
	}
	.scrim {
		display: none;
	}
	@media (max-width: 960px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.only-mobile {
			display: inline-flex;
		}
		.filters {
			position: fixed;
			inset: auto 0 0 0;
			z-index: 70;
			max-height: 86dvh;
			overflow-y: auto;
			border-radius: 16px 16px 0 0;
			transform: translateY(105%);
			transition: transform 0.3s var(--ease);
			box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
		}
		.filters.open {
			transform: none;
		}
		.close {
			display: inline-flex;
		}
		.scrim {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 60;
			background: rgba(10, 37, 64, 0.5);
			border: 0;
		}
	}
</style>
