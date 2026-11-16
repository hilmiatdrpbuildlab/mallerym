<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { OPERATION_LABEL, AVAILABILITY_LABEL, fmtPrice, PERIOD_LABEL, fmtDateTime } from '$lib/format';

	let { data } = $props();
	const STATE: Record<string, string> = { draft: 'Borrador', review: 'En revisión', published: 'Publicada', archived: 'Archivada' };
</script>

<svelte:head><title>Propiedades | CMS Maller&M</title></svelte:head>

<div class="page-head">
	<div>
		<h1>Propiedades</h1>
		<p>{data.rows.length} resultados · contenido estructurado: precio, m² y zona son campos, no parte del título.</p>
	</div>
	<a class="btn" href="/admin/propiedades/nueva/"><Icon name="plus" size={16} /> Nueva propiedad</a>
</div>

<form class="card filters" method="GET">
	<input class="input" name="q" placeholder="Buscar por título, slug o condominio…" value={data.q} />
	<select class="select" name="estado">
		<option value="">Todos los estados</option>
		{#each Object.entries(STATE) as [k, v] (k)}<option value={k} selected={data.estado === k}>{v}</option>{/each}
	</select>
	<select class="select" name="op">
		<option value="">Todas las operaciones</option>
		{#each Object.entries(OPERATION_LABEL) as [k, v] (k)}<option value={k} selected={data.op === k}>{v}</option>{/each}
	</select>
	<button class="btn btn--secondary" type="submit"><Icon name="search" size={16} /> Filtrar</button>
</form>

<div class="card">
	<div class="table-wrap">
		<table class="tbl">
			<thead>
				<tr><th></th><th>Propiedad</th><th>Operación</th><th>Precio</th><th>Estado</th><th>Disponibilidad</th><th>Fotos</th><th>Leads</th><th>Actualizada</th></tr>
			</thead>
			<tbody>
				{#each data.rows as r (r.id)}
					<tr>
						<td>{#if r.cover}<img class="thumb-sm" src="/media/{r.cover}/640.webp" alt="" loading="lazy" />{:else}<span class="thumb-sm"></span>{/if}</td>
						<td>
							<a class="row-link" href="/admin/propiedades/{r.id}/">{r.title}</a>
							<div class="muted small">{r.type_name} · {r.sector}{r.featured ? ' · ★ Destacada' : ''}</div>
						</td>
						<td>{OPERATION_LABEL[r.operation as keyof typeof OPERATION_LABEL]}</td>
						<td class="nowrap">
							{#if r.amount}{r.is_from ? 'Desde ' : ''}{fmtPrice(Number(r.amount), r.currency)} <span class="muted small">{PERIOD_LABEL[r.period as keyof typeof PERIOD_LABEL]}</span>{/if}
						</td>
						<td><span class="state state--{r.publish_state}">{STATE[r.publish_state]}</span></td>
						<td><span class="state state--{r.availability}">{AVAILABILITY_LABEL[r.availability as keyof typeof AVAILABILITY_LABEL]}</span></td>
						<td class:warn={r.photos < 5}>{r.photos}</td>
						<td>{r.leads}</td>
						<td class="muted small nowrap">{fmtDateTime(r.updated_at)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.filters {
		display: grid;
		grid-template-columns: 1fr 200px 220px auto;
		gap: 8px;
		margin-bottom: var(--sp-4);
	}
	@media (max-width: 800px) {
		.filters {
			grid-template-columns: 1fr;
		}
	}
	.nowrap {
		white-space: nowrap;
	}
	.warn {
		color: var(--warning);
		font-weight: 700;
	}
</style>
