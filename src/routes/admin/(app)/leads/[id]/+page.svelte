<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import { LEAD_STATUS_LABEL, LEAD_TYPE_LABEL, CHANNEL_LABEL, fmtDateTime, waLink, phoneDigits } from '$lib/format';

	let { data, form } = $props();
	const l = $derived(data.lead);
	const reply = $derived(
		`Hola ${l.firstName}, te escribimos de Maller&M Propiedades por tu consulta${data.property ? ` sobre "${data.property.title}"` : ''}.`
	);
</script>

<svelte:head><title>Lead {l.firstName} | CMS Maller&M</title></svelte:head>

<div class="page-head">
	<div>
		<a href="/admin/leads/" class="small">← Leads</a>
		<h1>{l.firstName} {l.lastName ?? ''}</h1>
		<p><span class="state state--{l.status}">{LEAD_STATUS_LABEL[l.status]}</span> <span class="muted small">· {LEAD_TYPE_LABEL[l.type]} · {fmtDateTime(l.createdAt)}</span></p>
	</div>
	<div class="toolbar">
		{#if l.phone}
			<a class="btn btn--whatsapp" href={waLink(l.phone, reply)} target="_blank" rel="noopener"><Icon name="whatsapp" size={16} /> Responder por WhatsApp</a>
			<a class="btn btn--secondary" href="tel:+{phoneDigits(l.phone)}"><Icon name="phone" size={16} /> Llamar</a>
		{/if}
		<a class="btn btn--secondary" href="mailto:{l.email}?subject={encodeURIComponent('Tu consulta en Maller&M Propiedades')}"><Icon name="mail" size={16} /> Correo</a>
	</div>
</div>

{#if form?.error}<p class="alert alert--error">{form.error}</p>{/if}

<div class="cols">
	<div>
		<section class="card">
			<h2>Consulta</h2>
			<dl class="dl">
				<dt>Correo</dt><dd>{l.email}</dd>
				<dt>Teléfono</dt><dd>{l.phone ?? '—'}</dd>
				<dt>Prefiere</dt><dd>{CHANNEL_LABEL[l.preferredChannel]}</dd>
				{#if l.comuna}<dt>Comuna</dt><dd>{l.comuna}</dd>{/if}
				{#if data.property}<dt>Propiedad</dt><dd><a href="/admin/propiedades/{data.property.id}/">{data.property.title}</a> · <a href="/propiedades/{data.property.slug}/" target="_blank">ver ficha</a></dd>{/if}
				<dt>Origen</dt><dd class="small">{l.sourcePage ?? '—'}</dd>
				<dt>Consentimiento</dt><dd class="small">{fmtDateTime(l.consentAt)}</dd>
			</dl>
			{#if l.message}<blockquote>{l.message}</blockquote>{/if}
		</section>

		<section class="card">
			<h2>Notas internas</h2>
			{#if data.canWrite}
				<form method="POST" action="?/note" use:enhance class="note-form">
					<textarea class="textarea" name="body" rows="3" maxlength="2000" placeholder="Ej. Llamé, agendamos visita el sábado 10:00" required></textarea>
					<button class="btn btn--sm" type="submit">Agregar nota</button>
				</form>
			{/if}
			<ul class="notes">
				{#each data.notes as n (n.id)}
					<li><p>{n.body}</p><span class="muted small">{n.author ?? '—'} · {fmtDateTime(n.createdAt)}</span></li>
				{:else}
					<li class="muted">Sin notas todavía.</li>
				{/each}
			</ul>
		</section>
	</div>

	<aside>
		<section class="card">
			<h2>Gestión</h2>
			{#if data.canWrite}
				<form method="POST" action="?/update" use:enhance class="stack">
					<div class="field">
						<label for="st">Estado</label>
						<select class="select" id="st" name="status">
							{#each Object.entries(LEAD_STATUS_LABEL) as [k, v] (k)}<option value={k} selected={l.status === k}>{v}</option>{/each}
						</select>
					</div>
					<div class="field">
						<label for="as">Asignado a</label>
						<select class="select" id="as" name="assignedTo">
							<option value="">Sin asignar</option>
							{#each data.users as u (u.id)}<option value={u.id} selected={l.assignedTo === u.id}>{u.name}</option>{/each}
						</select>
					</div>
					<button class="btn" type="submit">Guardar</button>
					{#if form?.saved}<p class="muted small">Guardado ✓</p>{/if}
				</form>
			{:else}
				<p class="muted">Tu rol solo puede ver leads.</p>
			{/if}
		</section>
		<section class="card">
			<h2>Historial</h2>
			<ul class="hist">
				{#each data.history as h, i (i)}
					<li><code>{h.action}</code><span class="muted small">{h.actor_email ?? 'sistema'} · {fmtDateTime(h.created_at)}</span></li>
				{/each}
			</ul>
		</section>
	</aside>
</div>

<style>
	.cols {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 320px;
		gap: var(--sp-5);
		align-items: start;
	}
	@media (max-width: 960px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
	.cols aside .card + .card,
	.cols > div .card + .card {
		margin-top: var(--sp-5);
	}
	.dl {
		display: grid;
		grid-template-columns: 140px 1fr;
		gap: 8px 12px;
		margin: 0;
	}
	dt {
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	dd {
		margin: 0;
		overflow-wrap: anywhere;
	}
	blockquote {
		margin: var(--sp-4) 0 0;
		padding: var(--sp-4);
		background: var(--surface-sand);
		border-left: 3px solid var(--brand-gold);
		border-radius: 4px;
		white-space: pre-wrap;
	}
	.note-form {
		display: grid;
		gap: 8px;
		justify-items: start;
		margin-bottom: var(--sp-4);
	}
	.notes,
	.hist {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 10px;
	}
	.notes li {
		padding: 10px 12px;
		background: #f7f9fb;
		border-radius: 6px;
	}
	.notes p {
		margin: 0 0 4px;
		white-space: pre-wrap;
	}
	.hist li {
		display: grid;
	}
	.hist code {
		font-size: 0.8rem;
	}
</style>
