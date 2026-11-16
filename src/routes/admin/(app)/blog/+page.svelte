<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { fmtDate, fmtDateTime } from '$lib/format';
	let { data } = $props();
	const STATE: Record<string, string> = { draft: 'Borrador', review: 'En revisión', published: 'Publicado', archived: 'Archivado' };
</script>

<svelte:head><title>Blog | CMS Maller&M</title></svelte:head>

<div class="page-head">
	<div><h1>Blog</h1><p>Artículos de diseño, decoración y paisajismo.</p></div>
	<a class="btn" href="/admin/blog/nuevo/"><Icon name="plus" size={16} /> Nuevo artículo</a>
</div>

<div class="card">
	<div class="table-wrap">
		<table class="tbl">
			<thead><tr><th></th><th>Título</th><th>Categorías</th><th>Estado</th><th>Publicación</th><th>Actualizado</th></tr></thead>
			<tbody>
				{#each data.rows as r (r.id)}
					<tr>
						<td>{#if r.cover_id}<img class="thumb-sm" src="/media/{r.cover_id}/640.webp" alt="" loading="lazy" />{/if}</td>
						<td><a class="row-link" href="/admin/blog/{r.id}/">{r.title}</a><div class="muted small">/blog/{r.slug}/</div></td>
						<td class="small">{r.cats}</td>
						<td><span class="state state--{r.publish_state}">{STATE[r.publish_state]}</span></td>
						<td class="small">{fmtDate(r.published_at)}</td>
						<td class="muted small">{fmtDateTime(r.updated_at)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
