<script lang="ts">
	import { fmtDateTime } from '$lib/format';
	let { data } = $props();
</script>

<svelte:head><title>Auditoría | CMS Maller&M</title></svelte:head>

<div class="page-head">
	<div>
		<h1>Auditoría</h1>
		<p>Registro append-only de todas las acciones del panel (el rol de base de datos de la app no puede modificarlo ni borrarlo). IPs seudonimizadas con HMAC.</p>
	</div>
</div>

<form class="card filters" method="GET">
	<input class="input" name="accion" placeholder="Acción (ej. auth., property., lead.export)" value={data.q} />
	<input class="input" name="actor" placeholder="Correo del usuario" value={data.actor} />
	<button class="btn btn--secondary">Filtrar</button>
</form>

<div class="card">
	<div class="table-wrap">
		<table class="tbl">
			<thead><tr><th>Fecha</th><th>Acción</th><th>Entidad</th><th>Usuario</th><th>Detalle</th><th>IP (hash)</th></tr></thead>
			<tbody>
				{#each data.rows as r (r.id)}
					<tr>
						<td class="small nowrap">{fmtDateTime(r.created_at)}</td>
						<td><code class:bad={/failed|delete|export|reset|revoked/.test(r.action)}>{r.action}</code></td>
						<td class="small">{r.entity}{r.entity_id ? ` · ${String(r.entity_id).slice(0, 8)}` : ''}</td>
						<td class="small">{r.actor_email ?? '—'}</td>
						<td class="small diff">{r.diff ? JSON.stringify(r.diff).slice(0, 140) : ''}</td>
						<td class="small muted">{r.ip_hash?.slice(0, 10) ?? ''}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.filters {
		display: grid;
		grid-template-columns: 1fr 1fr auto;
		gap: 8px;
		margin-bottom: var(--sp-4);
	}
	code {
		font-size: 0.8rem;
		background: #eef1f5;
		padding: 1px 6px;
		border-radius: 4px;
	}
	code.bad {
		background: var(--warning-bg);
		color: var(--warning);
	}
	.diff {
		max-width: 320px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--ink-muted);
	}
	.nowrap {
		white-space: nowrap;
	}
</style>
