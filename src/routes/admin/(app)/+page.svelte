<script lang="ts">
	import { PUBLIC_MFA_REQUIRED } from '$app/env/public';
	import Icon from '$lib/components/Icon.svelte';
	import { LEAD_TYPE_LABEL, LEAD_STATUS_LABEL, OPERATION_LABEL, fmtDateTime, type Operation } from '$lib/format';

	let { data } = $props();
	const byOp = $derived(
		(['venta', 'arriendo_anual', 'arriendo_temporal'] as Operation[]).map((op) => ({
			op,
			total: data.props.filter((p) => p.operation === op).reduce((a, b) => a + b.n, 0),
			disponibles: data.props.filter((p) => p.operation === op && p.availability === 'disponible').reduce((a, b) => a + b.n, 0)
		}))
	);
	const maxType = $derived(Math.max(1, ...data.leadByType.map((t) => t.n)));
</script>

<svelte:head><title>Dashboard | CMS Maller&M</title></svelte:head>

<div class="page-head">
	<div>
		<h1>Hola, {data.user.name.split(' ')[0]}</h1>
		<p>Resumen de actividad del sitio y del equipo.</p>
	</div>
	<div class="toolbar">
		<a class="btn" href="/admin/propiedades/nueva/"><Icon name="plus" size={16} /> Nueva propiedad</a>
		<a class="btn btn--secondary" href="/admin/leads/"><Icon name="inbox" size={16} /> Ver leads</a>
	</div>
</div>

<section class="kpis" aria-label="Indicadores">
	<div class="kpi"><strong>{data.leadStats.nuevos}</strong><span>Leads nuevos sin atender</span></div>
	<div class="kpi"><strong>{data.leadStats.d7}</strong><span>Leads últimos 7 días</span></div>
	<div class="kpi"><strong>{data.leadStats.d30}</strong><span>Leads últimos 30 días</span></div>
	<div class="kpi"><strong>{byOp.reduce((a, b) => a + b.total, 0)}</strong><span>Propiedades publicadas</span></div>
</section>

<div class="cols">
	<section class="card">
		<h2>Leads recientes</h2>
		{#if data.recentLeads.length}
			<ul class="list">
				{#each data.recentLeads as l (l.id)}
					<li>
						<a href="/admin/leads/{l.id}/">
							<strong>{l.first_name} {l.last_name ?? ''}</strong>
							<span class="muted small">{LEAD_TYPE_LABEL[l.type]}{l.property ? ` · ${l.property}` : ''}</span>
						</a>
						<span class="state state--{l.status}">{LEAD_STATUS_LABEL[l.status]}</span>
						<time class="muted small">{fmtDateTime(l.created_at)}</time>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="muted">Aún no hay leads. Los formularios del sitio (contacto, propiedades, propietarios) llegarán aquí.</p>
		{/if}
	</section>

	<section class="card">
		<h2>Leads por tipo (30 días)</h2>
		{#if data.leadByType.length}
			<ul class="bars">
				{#each data.leadByType as t (t.type)}
					<li>
						<span>{LEAD_TYPE_LABEL[t.type]}</span>
						<meter min="0" max={maxType} value={t.n}></meter>
						<b>{t.n}</b>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="muted">Sin datos todavía.</p>
		{/if}
		<h2 class="mt">Propiedades por operación</h2>
		<ul class="bars">
			{#each byOp as o (o.op)}
				<li>
					<span>{OPERATION_LABEL[o.op]}</span>
					<meter min="0" max={Math.max(1, o.total)} value={o.disponibles}></meter>
					<b>{o.disponibles}/{o.total}</b>
				</li>
			{/each}
		</ul>
		<p class="muted small">Disponibles / publicadas.</p>
	</section>

	<section class="card">
		<h2>Borradores y revisión</h2>
		{#if data.pending.length}
			<ul class="list">
				{#each data.pending as p (p.id)}
					<li>
						<a href={p.kind === 'propiedad' ? `/admin/propiedades/${p.id}/` : `/admin/blog/${p.id}/`}>
							<strong>{p.title}</strong><span class="muted small">{p.kind}</span>
						</a>
						<span class="state state--{p.state}">{p.state === 'review' ? 'En revisión' : 'Borrador'}</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="muted">No hay contenido pendiente.</p>
		{/if}
	</section>

	<section class="card sec">
		<h2><Icon name="shield" size={18} /> Estado de seguridad</h2>
		<ul class="secl">
			{#if PUBLIC_MFA_REQUIRED}<li><span>Cuentas con MFA</span><b class:ok={data.security.mfa === data.security.users}>{data.security.mfa}/{data.security.users}</b></li>{:else}<li><span>MFA</span><b>Desactivado (modo demo)</b></li>{/if}
			<li><span>Sesiones activas</span><b>{data.security.sessions}</b></li>
			<li><span>Intentos fallidos (24 h)</span><b class:warn={data.security.failed24 > 10}>{data.security.failed24}</b></li>
			<li><span>Cabeceras de seguridad + CSP</span><b class="ok">Activas</b></li>
			<li><span>Turnstile en formularios</span><b class="ok">Activo</b></li>
		</ul>
		{#if data.activity.length}
			<h3 class="mt">Actividad reciente</h3>
			<ul class="act">
				{#each data.activity as a, i (i)}
					<li><code>{a.action}</code> <span class="muted small">{a.actor_email ?? 'sistema'} · {fmtDateTime(a.created_at)}</span></li>
				{/each}
			</ul>
			<a class="small" href="/admin/auditoria/">Ver auditoría completa →</a>
		{/if}
	</section>
</div>

<style>
	.cols {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr));
		gap: var(--sp-5);
		margin-top: var(--sp-5);
	}
	.cols .card + .card {
		margin-top: 0;
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.list li {
		display: flex;
		align-items: center;
		gap: var(--sp-3);
		padding: 10px 0;
		border-bottom: 1px solid #eef1f5;
	}
	.list li a {
		flex: 1;
		display: grid;
		min-width: 0;
		text-decoration: none;
		color: var(--ink);
	}
	.list li a strong {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.bars {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 10px;
	}
	.bars li {
		display: grid;
		grid-template-columns: 170px 1fr 50px;
		gap: 10px;
		align-items: center;
		font-size: 0.88rem;
	}
	.bars b {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	meter {
		width: 100%;
		height: 10px;
	}
	.mt {
		margin-top: var(--sp-5);
	}
	.secl {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.secl li {
		display: flex;
		justify-content: space-between;
		padding: 8px 0;
		border-bottom: 1px solid #eef1f5;
		font-size: 0.9rem;
	}
	.ok {
		color: var(--success);
	}
	.warn {
		color: var(--danger);
	}
	.act {
		list-style: none;
		padding: 0;
		margin: 0 0 var(--sp-3);
		display: grid;
		gap: 6px;
	}
	.act code {
		font-size: 0.8rem;
		background: #eef1f5;
		padding: 1px 6px;
		border-radius: 4px;
	}
	.sec h2 {
		display: flex;
		gap: 8px;
		align-items: center;
	}
</style>
