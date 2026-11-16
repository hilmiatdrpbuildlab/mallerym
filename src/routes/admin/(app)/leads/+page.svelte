<script lang="ts">
	import { PUBLIC_MFA_REQUIRED } from '$app/env/public';
	import Icon from '$lib/components/Icon.svelte';
	import { LEAD_STATUS_LABEL, LEAD_TYPE_LABEL, CHANNEL_LABEL, fmtDateTime } from '$lib/format';

	let { data } = $props();
	let exportOpen = $state(false);
	const pipeline = ['nuevo', 'contactado', 'visita', 'negociacion', 'cerrado'];
</script>

<svelte:head><title>Leads | CMS Maller&M</title></svelte:head>

<div class="page-head">
	<div>
		<h1>Leads</h1>
		<p>Consultas recibidas desde el sitio. Todo formulario pasa por Turnstile, honeypot y rate limit.</p>
	</div>
	{#if data.canExport}
		<button class="btn btn--secondary" onclick={() => (exportOpen = !exportOpen)}><Icon name="file" size={16} /> Exportar CSV</button>
	{/if}
</div>

{#if exportOpen}
	<form class="card exp" method="POST" action="/admin/leads/exportar/" data-sveltekit-reload>
		<p><strong>Acción sensible:</strong> la exportación contiene datos personales y queda registrada en la auditoría. Confirma con {PUBLIC_MFA_REQUIRED ? 'tu código MFA' : 'tu contraseña'}.</p>
		<input class="input" name="code" type={PUBLIC_MFA_REQUIRED ? 'text' : 'password'} maxlength="256" placeholder={PUBLIC_MFA_REQUIRED ? 'Código de 6 dígitos' : 'Tu contraseña'} required />
		<button class="btn" type="submit">Descargar CSV</button>
	</form>
{/if}

<nav class="pipe" aria-label="Pipeline">
	<a href="/admin/leads/" aria-current={!data.status ? 'page' : undefined}>Todos <b>{pipeline.reduce((a, s) => a + (data.counts[s] ?? 0), 0)}</b></a>
	{#each pipeline as st (st)}
		<a href="/admin/leads/?estado={st}" aria-current={data.status === st ? 'page' : undefined}>{LEAD_STATUS_LABEL[st]} <b>{data.counts[st] ?? 0}</b></a>
	{/each}
	<a href="/admin/leads/?estado=spam" aria-current={data.status === 'spam' ? 'page' : undefined} class="spam">Spam <b>{data.counts.spam ?? 0}</b></a>
</nav>

<form class="card filters" method="GET">
	{#if data.status}<input type="hidden" name="estado" value={data.status} />{/if}
	<input class="input" name="q" placeholder="Buscar por nombre, correo o teléfono…" value={data.q} />
	<select class="select" name="tipo">
		<option value="">Todos los tipos</option>
		{#each Object.entries(LEAD_TYPE_LABEL) as [k, v] (k)}<option value={k} selected={data.type === k}>{v}</option>{/each}
	</select>
	<button class="btn btn--secondary" type="submit">Filtrar</button>
</form>

<div class="card">
	{#if data.rows.length}
		<div class="table-wrap">
			<table class="tbl">
				<thead><tr><th>Contacto</th><th>Tipo</th><th>Propiedad</th><th>Prefiere</th><th>Estado</th><th>Asignado</th><th>Recibido</th></tr></thead>
				<tbody>
					{#each data.rows as l (l.id)}
						<tr>
							<td>
								<a class="row-link" href="/admin/leads/{l.id}/">{l.first_name} {l.last_name ?? ''}</a>
								<div class="muted small">{l.email}{l.phone ? ` · ${l.phone}` : ''}</div>
							</td>
							<td>{LEAD_TYPE_LABEL[l.type]}</td>
							<td class="small">{l.property ?? '—'}</td>
							<td>{CHANNEL_LABEL[l.preferred_channel]}</td>
							<td><span class="state state--{l.status}">{LEAD_STATUS_LABEL[l.status]}</span></td>
							<td class="small">{l.assignee ?? '—'}</td>
							<td class="muted small nowrap">{fmtDateTime(l.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<p class="muted">No hay leads con estos filtros. Prueba enviar el formulario de <a href="/contacto-y-ubicacion/" target="_blank">contacto</a> del sitio.</p>
	{/if}
</div>

<style>
	.pipe {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: var(--sp-4);
	}
	.pipe a {
		display: inline-flex;
		gap: 8px;
		align-items: center;
		padding: 8px 14px;
		border-radius: 999px;
		background: #fff;
		border: 1px solid var(--line);
		text-decoration: none;
		color: var(--ink);
		font-weight: 700;
		font-size: 0.88rem;
	}
	.pipe a b {
		background: #eef1f5;
		border-radius: 999px;
		padding: 0 8px;
		font-size: 0.78rem;
	}
	.pipe a[aria-current='page'] {
		background: var(--brand-primary);
		color: #fff;
		border-color: var(--brand-primary);
	}
	.pipe a[aria-current='page'] b {
		background: rgba(255, 255, 255, 0.2);
	}
	.spam {
		margin-left: auto;
	}
	.filters {
		display: grid;
		grid-template-columns: 1fr 240px auto;
		gap: 8px;
		margin-bottom: var(--sp-4);
	}
	@media (max-width: 760px) {
		.filters {
			grid-template-columns: 1fr;
		}
	}
	.exp {
		display: grid;
		grid-template-columns: 1fr 200px auto;
		gap: 8px;
		align-items: center;
		margin-bottom: var(--sp-4);
		background: var(--warning-bg);
	}
	.exp p {
		margin: 0;
		font-size: 0.9rem;
	}
	.nowrap {
		white-space: nowrap;
	}
</style>
