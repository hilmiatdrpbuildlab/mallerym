<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import Uploader from '$lib/components/admin/Uploader.svelte';
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';
	import { suggestTitle } from '$lib/schemas/property';
	import { fmtPrice, fmtDateTime, PERIOD_LABEL, slugify, fmtDate } from '$lib/format';

	let { data, form } = $props();
	const p = $derived(data.p);
	const STATE: Record<string, string> = { draft: 'Borrador', review: 'En revisión', published: 'Publicada', archived: 'Archivada' };

	type Tab = 'general' | 'precio' | 'superficies' | 'galeria' | 'disponibilidad' | 'seo';
	let tab = $state<Tab>('general');
	const tabs: [Tab, string][] = [
		['general', 'General'],
		['precio', 'Precio y operación'],
		['superficies', 'Superficies y características'],
		['galeria', 'Galería'],
		['disponibilidad', 'Disponibilidad'],
		['seo', 'SEO']
	];

	// Estado editable del formulario principal
	let f = $state({
		title: '',
		slug: '',
		operation: 'venta',
		propertyTypeId: 1,
		locationId: '',
		condominium: '',
		summary: '',
		body: '',
		metaTitle: '',
		metaDescription: '',
		priceCurrency: 'UF',
		pricePeriod: 'total'
	});
	let dirty = $state(false);
	let saving = $state(false);
	let flash = $state('');

	$effect.pre(() => {
		// sincroniza al cargar o tras guardar
		const pr = data.prices[0];
		f = {
			title: p.title,
			slug: p.slug,
			operation: p.operation,
			propertyTypeId: p.propertyTypeId,
			locationId: p.locationId,
			condominium: p.condominium ?? '',
			summary: p.summary ?? '',
			body: p.body ?? '',
			metaTitle: p.metaTitle ?? '',
			metaDescription: p.metaDescription ?? '',
			priceCurrency: pr?.currency ?? (p.operation === 'venta' ? 'UF' : 'CLP'),
			pricePeriod: pr?.period ?? (p.operation === 'venta' ? 'total' : p.operation === 'arriendo_anual' ? 'mes' : 'noche')
		};
		dirty = false;
	});

	const periods = $derived(
		f.operation === 'venta' ? [['total', 'Total']] : f.operation === 'arriendo_anual' ? [['mes', 'Por mes']] : [['noche', 'Por noche'], ['dia', 'Por día']]
	);
	$effect(() => {
		if (!periods.some(([v]) => v === f.pricePeriod)) f.pricePeriod = periods[0][0];
	});

	const typeName = $derived(data.types.find((t) => t.id === Number(f.propertyTypeId))?.name);
	const sector = $derived(data.locations.find((l) => l.id === f.locationId)?.sector);
	const err = $derived((form as any)?.errors ?? {});
	const groups = $derived(
		[
			['interior', 'Interior'],
			['exterior', 'Exterior'],
			['condominio', 'Condominio y servicios']
		].map(([k, l]) => ({ k, l, items: data.features.filter((x) => x.groupKey === k) }))
	);
	const failing = $derived(data.checklist.filter((c) => !c.ok));

	// Galería: orden local + portada
	let gal = $state<{ id: string; alt: string; role: string }[]>([]);
	let cover = $state('');
	$effect.pre(() => {
		gal = data.gallery.map((g) => ({ id: g.id, alt: g.alt, role: g.role }));
		cover = data.gallery.find((g) => g.role === 'cover')?.id ?? data.gallery[0]?.id ?? '';
	});
	let dragIndex = -1;
	function move(i: number, d: number) {
		const j = i + d;
		if (j < 0 || j >= gal.length) return;
		const copy = [...gal];
		[copy[i], copy[j]] = [copy[j], copy[i]];
		gal = copy;
	}

	function onBeforeUnload(e: BeforeUnloadEvent) {
		if (dirty) e.preventDefault();
	}
	const enhanced = () => {
		saving = true;
		return async ({ result, update }: any) => {
			saving = false;
			await update({ reset: false });
			if (result.type === 'success') {
				flash = result.data?.transitioned ? `Estado: ${STATE[result.data.transitioned]}` : 'Cambios guardados';
				setTimeout(() => (flash = ''), 2500);
			}
		};
	};
</script>

<svelte:head><title>{p.title} | CMS Maller&M</title></svelte:head>
<svelte:window onbeforeunload={onBeforeUnload} />

<div class="page-head">
	<div>
		<a href="/admin/propiedades/" class="small">← Propiedades</a>
		<h1>{p.title}</h1>
		<p>
			<span class="state state--{p.publishState}">{STATE[p.publishState]}</span>
			<span class="muted small"> · v{p.version} · actualizada {fmtDateTime(p.updatedAt)} · {data.leadCount} leads</span>
		</p>
	</div>
	<div class="toolbar">
		<a class="btn btn--secondary btn--sm" href="/propiedades/{p.slug}/?preview" target="_blank" rel="noopener"><Icon name="eye" size={16} /> Vista previa</a>
		<form method="POST" action="?/duplicate" use:enhance><button class="btn btn--plain btn--sm" type="submit"><Icon name="copy" size={16} /> Duplicar</button></form>
	</div>
</div>

{#if page.url.searchParams.has('nuevo')}<p class="alert alert--success">Propiedad creada como borrador. Completa los datos y sube las fotos.</p>{/if}
{#if form?.error}<p class="alert alert--error" role="alert">{form.error}</p>{/if}
{#if data.dups.length}
	<p class="alert alert--warning">
		<strong>Posible listado duplicado:</strong>
		{#each data.dups as d, i (d.id)}{i ? ', ' : ' '}<a href="/admin/propiedades/{d.id}/">{d.title}</a> ({STATE[d.state]}){/each}. Revisa antes de publicar.
	</p>
{/if}

<div class="edit">
	<div class="main-col">
		<div class="tabs" role="tablist">
			{#each tabs as [k, l] (k)}
				<button type="button" role="tab" aria-selected={tab === k} onclick={() => (tab = k)}>{l}{k === 'galeria' ? ` (${gal.length})` : ''}</button>
			{/each}
		</div>

		<form id="prop" method="POST" action="?/save" use:enhance={enhanced} oninput={() => (dirty = true)} novalidate>
			<input type="hidden" name="version" value={p.version} />

			<!-- General -->
			<section class="card stack" hidden={tab !== 'general'}>
				<div class="field">
					<label for="title">Título</label>
					<input class="input" id="title" name="title" bind:value={f.title} maxlength="140" aria-invalid={err.title ? 'true' : undefined} />
					{#if err.title}<span class="field-error">{err.title}</span>{/if}
					<button
						type="button"
						class="btn btn--plain btn--sm sug"
						onclick={() => {
							f.title = suggestTitle({ type: typeName, condominium: f.condominium, sector: sector ?? undefined, builtM2: (document.getElementById('builtM2') as HTMLInputElement)?.value, landM2: (document.getElementById('landM2') as HTMLInputElement)?.value });
							dirty = true;
						}}><Icon name="pen" size={14} /> Sugerir título desde los campos</button
					>
				</div>
				<div class="field">
					<label for="slug">URL (slug)</label>
					<div class="slug">
						<span class="muted small">/propiedades/</span>
						<input class="input" id="slug" name="slug" bind:value={f.slug} aria-invalid={err.slug ? 'true' : undefined} />
						<button type="button" class="btn btn--plain btn--sm" onclick={() => ((f.slug = slugify(f.title)), (dirty = true))}>Generar</button>
					</div>
					{#if err.slug}<span class="field-error">{err.slug}</span>{/if}
					{#if p.publishState === 'published' && f.slug !== p.slug}<span class="hint">Se creará una redirección 301 desde la URL actual.</span>{/if}
				</div>
				<div class="form-grid">
					<div class="field">
						<label for="type">Tipo</label>
						<select class="select" id="type" name="propertyTypeId" bind:value={f.propertyTypeId}>
							{#each data.types as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
						</select>
					</div>
					<div class="field">
						<label for="loc">Zona</label>
						<select class="select" id="loc" name="locationId" bind:value={f.locationId}>
							{#each data.locations as l (l.id)}<option value={l.id}>{l.sector} ({l.comuna})</option>{/each}
						</select>
					</div>
					<div class="field">
						<label for="condo">Condominio</label>
						<input class="input" id="condo" name="condominium" bind:value={f.condominium} maxlength="120" />
					</div>
					<div class="field">
						<label for="agent">Corredora a cargo</label>
						<select class="select" id="agent" name="agentId">
							<option value="">—</option>
							{#each data.agents as a (a.id)}<option value={a.id} selected={p.agentId === a.id}>{a.name}</option>{/each}
						</select>
					</div>
					<div class="field">
						<label for="avail">Disponibilidad</label>
						<select class="select" id="avail" name="availability">
							{#each [['disponible', 'Disponible'], ['reservada', 'Reservada'], ['vendida', 'Vendida'], ['arrendada', 'Arrendada']] as [v, l] (v)}
								<option value={v} selected={p.availability === v}>{l}</option>
							{/each}
						</select>
					</div>
					<label class="check feat-check"><input type="checkbox" name="featured" checked={p.featured} /> <span>Destacada en el inicio</span></label>
				</div>
				<div class="field">
					<label for="summary">Resumen <span class="muted small">({f.summary.length}/300)</span></label>
					<textarea class="textarea" id="summary" name="summary" bind:value={f.summary} maxlength="300" rows="3"></textarea>
				</div>
				<RichTextEditor name="body" bind:value={f.body} label="Descripción" />
				<div class="field">
					<label for="locn">Notas de ubicación (públicas)</label>
					<textarea class="textarea" id="locn" name="locationNotes" maxlength="600" rows="2">{p.locationNotes ?? ''}</textarea>
				</div>
			</section>

			<!-- Precio -->
			<section class="card stack" hidden={tab !== 'precio'}>
				<div class="form-grid">
					<div class="field">
						<label for="op">Operación</label>
						<select class="select" id="op" name="operation" bind:value={f.operation}>
							<option value="venta">Venta</option>
							<option value="arriendo_anual">Arriendo año corrido</option>
							<option value="arriendo_temporal">Arriendo temporal</option>
						</select>
					</div>
					<div class="field">
						<label for="amount">Precio</label>
						<input class="input" id="amount" name="priceAmount" inputmode="decimal" value={data.prices[0] ? Number(data.prices[0].amount).toLocaleString('es-CL') : ''} aria-invalid={err.priceAmount ? 'true' : undefined} />
						{#if err.priceAmount}<span class="field-error">{err.priceAmount}</span>{/if}
					</div>
					<div class="field">
						<label for="cur">Moneda</label>
						<select class="select" id="cur" name="priceCurrency" bind:value={f.priceCurrency}>
							<option value="UF">UF</option>
							<option value="CLP">CLP ($)</option>
						</select>
					</div>
					<div class="field">
						<label for="per">Periodo</label>
						<select class="select" id="per" name="pricePeriod" bind:value={f.pricePeriod} aria-invalid={err.pricePeriod ? 'true' : undefined}>
							{#each periods as [v, l] (v)}<option value={v}>{l}</option>{/each}
						</select>
						{#if err.pricePeriod}<span class="field-error">{err.pricePeriod}</span>{/if}
					</div>
					<label class="check feat-check"><input type="checkbox" name="priceIsFrom" checked={data.prices[0]?.isFrom} /> <span>Mostrar como “Desde”</span></label>
				</div>
				{#if data.prices.length}
					<div>
						<h3>Historial de precios</h3>
						<table class="tbl">
							<tbody>
								{#each data.prices as pr (pr.id)}
									<tr><td>{pr.isFrom ? 'Desde ' : ''}{fmtPrice(Number(pr.amount), pr.currency)} {PERIOD_LABEL[pr.period]}</td><td class="muted small">{fmtDateTime(pr.validFrom)}</td></tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</section>

			<!-- Superficies -->
			<section class="card stack" hidden={tab !== 'superficies'}>
				<div class="form-grid">
					{#each [['builtM2', 'm² construidos'], ['terraceM2', 'm² terrazas'], ['landM2', 'm² terreno'], ['bedrooms', 'Dormitorios'], ['bathrooms', 'Baños'], ['parking', 'Estacionamientos'], ['floors', 'Pisos'], ['guests', 'Huéspedes (temporal)'], ['minNights', 'Noches mínimas']] as [k, l] (k)}
						<div class="field">
							<label for={k}>{l}</label>
							<input class="input" id={k} name={k} inputmode="decimal" value={(data.specs as any)?.[k] ?? ''} aria-invalid={err[k] ? 'true' : undefined} />
							{#if err[k]}<span class="field-error">{err[k]}</span>{/if}
						</div>
					{/each}
				</div>
				<div class="feat-groups">
					{#each groups as g (g.k)}
						<fieldset>
							<legend>{g.l}</legend>
							{#each g.items as it (it.id)}
								<label class="check"><input type="checkbox" name="feature" value={it.id} checked={data.selected.includes(it.id)} /> <span>{it.name}</span></label>
							{/each}
						</fieldset>
					{/each}
				</div>
			</section>

			<!-- SEO -->
			<section class="card stack" hidden={tab !== 'seo'}>
				<div class="field">
					<label for="mt">Meta título <span class="muted small">({f.metaTitle.length}/60)</span></label>
					<input class="input" id="mt" name="metaTitle" bind:value={f.metaTitle} maxlength="60" placeholder={f.title} />
				</div>
				<div class="field">
					<label for="md">Meta descripción <span class="muted small">({f.metaDescription.length}/160)</span></label>
					<textarea class="textarea" id="md" name="metaDescription" bind:value={f.metaDescription} maxlength="160" rows="3"></textarea>
				</div>
				<div class="serp" aria-label="Vista previa en Google">
					<span class="serp-url">mallerym.cl › propiedades › {f.slug}</span>
					<span class="serp-title">{(f.metaTitle || f.title).slice(0, 60)} | Maller&M</span>
					<span class="serp-desc">{(f.metaDescription || f.summary).slice(0, 160)}</span>
				</div>
				<div class="og" aria-label="Vista previa al compartir por WhatsApp">
					{#if gal[0]}<img src="/media/{cover || gal[0].id}/640.webp" alt="" />{/if}
					<div><strong>{f.metaTitle || f.title}</strong><span>{(f.metaDescription || f.summary).slice(0, 100)}</span><small>mallerym.cl</small></div>
				</div>
			</section>
		</form>

		<!-- Galería (formularios propios, fuera del formulario principal) -->
		<section class="card stack" hidden={tab !== 'galeria'}>
			<Uploader folder="propiedades" propertyId={p.id} altBase={p.title} onuploaded={() => invalidateAll()} />
			{#if gal.length}
				<form method="POST" action="?/gallery" use:enhance={enhanced}>
					<p class="muted small">Arrastra para reordenar · elige la portada · el texto alternativo es obligatorio (accesibilidad y SEO).</p>
					<ul class="gal">
						{#each gal as g, i (g.id)}
							<li
								draggable="true"
								ondragstart={() => (dragIndex = i)}
								ondragover={(e) => e.preventDefault()}
								ondrop={() => {
									if (dragIndex < 0 || dragIndex === i) return;
									const copy = [...gal];
									const [m] = copy.splice(dragIndex, 1);
									copy.splice(i, 0, m);
									gal = copy;
									dragIndex = -1;
								}}
								class:is-cover={cover === g.id}
							>
								<input type="hidden" name="order" value={g.id} />
								<div class="g-img"><img src="/media/{g.id}/640.webp" alt="" loading="lazy" /><span class="grip"><Icon name="grip" size={16} /></span></div>
								<input class="input alt" name="alt_{g.id}" value={g.alt} aria-label="Texto alternativo foto {i + 1}" maxlength="200" />
								<div class="g-acts">
									<label class="cov"><input type="radio" name="cover" value={g.id} bind:group={cover} /> Portada</label>
									<button type="button" class="btn btn--plain btn--sm" onclick={() => move(i, -1)} aria-label="Mover antes">↑</button>
									<button type="button" class="btn btn--plain btn--sm" onclick={() => move(i, 1)} aria-label="Mover después">↓</button>
									<button type="submit" class="btn btn--plain btn--sm" formaction="?/galleryRemove" name="mediaId" value={g.id} aria-label="Eliminar foto {i + 1}"><Icon name="trash" size={14} /></button>
								</div>
							</li>
						{/each}
					</ul>
					<button class="btn" type="submit" disabled={saving}>Guardar galería</button>
				</form>
			{:else}
				<p class="muted">Aún no hay fotos.</p>
			{/if}
		</section>

		<section class="card stack" hidden={tab !== 'disponibilidad'}>
			<p class="muted small">Rangos de fechas para arriendo temporal (se muestran en la ficha pública).</p>
			{#if data.ranges.length}
				<table class="tbl">
					<tbody>
						{#each data.ranges as r (r.id)}
							<tr>
								<td>{fmtDate(r.startsOn + 'T12:00:00')} — {fmtDate(r.endsOn + 'T12:00:00')}</td>
								<td><span class="state state--{r.status === 'disponible' ? 'published' : 'archived'}">{r.status}</span></td>
								<td>
									<form method="POST" action="?/availRemove" use:enhance={enhanced}>
										<button class="btn btn--plain btn--sm" name="rid" value={r.id} aria-label="Eliminar rango"><Icon name="trash" size={14} /></button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
			<form method="POST" action="?/availAdd" use:enhance={enhanced} class="form-grid">
				<div class="field"><label for="s1">Desde</label><input class="input" id="s1" type="date" name="startsOn" required /></div>
				<div class="field"><label for="s2">Hasta</label><input class="input" id="s2" type="date" name="endsOn" required /></div>
				<div class="field">
					<label for="s3">Estado</label>
					<select class="select" id="s3" name="status"><option value="disponible">Disponible</option><option value="ocupado">Ocupado</option></select>
				</div>
				<div class="field"><span class="label">&nbsp;</span><button class="btn btn--secondary" type="submit">Agregar rango</button></div>
			</form>
		</section>
	</div>

	<aside class="side-col">
		<div class="card sticky">
			<h2>Publicación</h2>
			<button class="btn btn--block" type="submit" form="prop" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
			{#if dirty}<p class="dirty small">Hay cambios sin guardar</p>{/if}
			<div class="trans">
				{#if p.publishState !== 'review' && p.publishState !== 'published'}
					<form method="POST" action="?/transition" use:enhance={enhanced}><button class="btn btn--secondary btn--block btn--sm" name="to" value="review">Enviar a revisión</button></form>
				{/if}
				{#if data.canPublish && p.publishState !== 'published'}
					<form method="POST" action="?/transition" use:enhance={enhanced}>
						<button class="btn btn--block btn--sm pub" name="to" value="published" disabled={failing.length > 0 || dirty} title={dirty ? 'Guarda primero' : ''}>Publicar</button>
					</form>
				{/if}
				{#if data.canPublish && p.publishState === 'published'}
					<form method="POST" action="?/transition" use:enhance={enhanced}><button class="btn btn--plain btn--block btn--sm" name="to" value="draft">Despublicar (borrador)</button></form>
				{/if}
				{#if data.canPublish && p.publishState !== 'archived'}
					<form method="POST" action="?/transition" use:enhance={enhanced}><button class="btn btn--plain btn--block btn--sm" name="to" value="archived">Archivar</button></form>
				{/if}
			</div>
			<h3>Checklist de publicación</h3>
			<ul class="check-list">
				{#each data.checklist as c (c.label)}
					<li class:ok={c.ok}><Icon name={c.ok ? 'check' : 'close'} size={14} /> {c.label}</li>
				{/each}
			</ul>
			{#if data.canPublish}
				<form method="POST" action="?/remove" use:enhance onsubmit={(e) => !confirm('¿Eliminar esta propiedad? Quedará archivada y oculta.') && e.preventDefault()}>
					<button class="btn btn--plain btn--sm danger-link" type="submit"><Icon name="trash" size={14} /> Eliminar</button>
				</form>
			{/if}
		</div>
	</aside>
</div>

{#if flash}<div class="flash" role="status">{flash}</div>{/if}

<style>
	.edit {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 300px;
		gap: var(--sp-5);
		align-items: start;
	}
	@media (max-width: 1100px) {
		.edit {
			grid-template-columns: 1fr;
		}
	}
	.sticky {
		position: sticky;
		top: 70px;
		display: grid;
		gap: var(--sp-3);
	}
	.sticky h2 {
		margin: 0;
	}
	.sticky h3 {
		margin: var(--sp-3) 0 0;
		font-size: 0.85rem;
	}
	.trans {
		display: grid;
		gap: 6px;
	}
	.pub {
		--btn-bg: var(--success);
		--btn-bd: var(--success);
	}
	.dirty {
		margin: 0;
		color: var(--warning);
		font-weight: 700;
	}
	.check-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 6px;
		font-size: 0.84rem;
		color: var(--danger);
	}
	.check-list li {
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.check-list li.ok {
		color: var(--success);
	}
	.danger-link {
		--btn-fg: var(--danger);
	}
	.sug {
		justify-self: start;
	}
	.slug {
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.feat-check {
		align-self: end;
		padding-bottom: 10px;
	}
	.feat-groups {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--sp-5);
	}
	fieldset {
		border: 1px solid var(--line);
		border-radius: 8px;
		padding: var(--sp-3) var(--sp-4);
		display: grid;
		gap: 6px;
	}
	legend {
		font-weight: 700;
		padding: 0 4px;
	}
	.gal {
		list-style: none;
		padding: 0;
		margin: 0 0 var(--sp-4);
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: var(--sp-3);
	}
	.gal li {
		border: 2px solid var(--line);
		border-radius: 8px;
		padding: 6px;
		display: grid;
		gap: 6px;
		background: #fff;
		cursor: grab;
	}
	.gal li.is-cover {
		border-color: var(--brand-gold);
	}
	.g-img {
		position: relative;
		aspect-ratio: 3 / 2;
		border-radius: 4px;
		overflow: hidden;
		background: var(--surface-alt);
	}
	.g-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.grip {
		position: absolute;
		top: 4px;
		right: 4px;
		background: rgba(255, 255, 255, 0.85);
		border-radius: 4px;
		padding: 2px;
	}
	.alt {
		min-height: 34px !important;
		font-size: 0.8rem !important;
	}
	.g-acts {
		display: flex;
		align-items: center;
		gap: 2px;
	}
	.cov {
		display: flex;
		gap: 4px;
		align-items: center;
		font-size: 0.8rem;
		margin-right: auto;
	}
	.serp {
		display: grid;
		gap: 2px;
		padding: var(--sp-4);
		border: 1px solid var(--line);
		border-radius: 8px;
		font-family: Arial, sans-serif;
	}
	.serp-url {
		font-size: 0.8rem;
		color: #4d5156;
	}
	.serp-title {
		font-size: 1.15rem;
		color: #1a0dab;
	}
	.serp-desc {
		font-size: 0.85rem;
		color: #4d5156;
	}
	.og {
		display: flex;
		max-width: 420px;
		border-radius: 8px;
		overflow: hidden;
		background: #e7f6e9;
		border: 1px solid #cfe8d3;
	}
	.og img {
		width: 110px;
		object-fit: cover;
	}
	.og div {
		display: grid;
		gap: 2px;
		padding: 8px 10px;
		font-size: 0.8rem;
	}
	.og small {
		color: var(--ink-muted);
	}
</style>
