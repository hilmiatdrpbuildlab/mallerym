<script lang="ts">
	import { enhance } from '$app/forms';
	import MediaPicker from '$lib/components/admin/MediaPicker.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { fmtDateTime } from '$lib/format';

	let { data, form } = $props();
	const b = $derived(data.blocks);
	const ver = (k: string) => data.versions.find((v) => v.key === k);
	const enh = () => async ({ update }: any) => update({ reset: false });

	let heroImg = $state<string | null>(null);
	let ownerImg = $state<string | null>(null);
	let partnerImg = $state<string | null>(null);
	let partnerLogo = $state<string | null>(null);
	let promoImgs = $state<(string | null)[]>([null, null, null]);
	let destImgs = $state<string[]>([]);
	let addDest = $state<string | null>(null);
	$effect.pre(() => {
		heroImg = b.hero?.imageId ?? null;
		ownerImg = b.owner?.imageId ?? null;
		partnerImg = b.partner?.imageId ?? null;
		partnerLogo = b.partner?.logoId ?? null;
		promoImgs = [0, 1, 2].map((i) => b.promos?.items?.[i]?.imageId ?? null);
		destImgs = [...(b.destacado?.imageIds ?? [])];
	});
	$effect(() => {
		if (addDest && !destImgs.includes(addDest)) destImgs = [...destImgs, addDest];
		addDest = null;
	});
</script>

<svelte:head><title>Destacados y promociones | CMS Maller&M</title></svelte:head>

<div class="page-head">
	<div>
		<h1>Inicio: destacados y promociones</h1>
		<p>Contenido estructurado: cada bloque tiene campos validados y el diseño queda fijo en el código.</p>
	</div>
	<a class="btn btn--secondary btn--sm" href="/" target="_blank"><Icon name="eye" size={16} /> Ver inicio</a>
</div>

{#snippet head(key: string, title: string)}
	<div class="bh">
		<h2>{title}</h2>
		{#if ver(key)}<span class="muted small">v{ver(key)?.version} · {fmtDateTime(ver(key)?.updatedAt)}</span>{/if}
	</div>
	{#if form?.block === key && form?.error}<p class="alert alert--error">{form.error}</p>{/if}
	{#if form?.saved === key}<p class="alert alert--success">Guardado. Ya está visible en el sitio.</p>{/if}
{/snippet}

<form class="card stack" method="POST" use:enhance={enh}>
	{@render head('hero', 'Portada (hero)')}
	<input type="hidden" name="block" value="hero" />
	<div class="form-grid">
		<div class="field"><label for="h1">Antetítulo</label><input class="input" id="h1" name="eyebrow" maxlength="80" value={b.hero?.eyebrow ?? ''} /></div>
		<div class="field span-all"><label for="h2">Título</label><input class="input" id="h2" name="title" maxlength="90" value={b.hero?.title ?? ''} /></div>
		<div class="field span-all"><label for="h3">Bajada</label><textarea class="textarea" id="h3" name="subtitle" maxlength="240" rows="2">{b.hero?.subtitle ?? ''}</textarea></div>
	</div>
	<MediaPicker name="imageId" bind:value={heroImg} folder="site" label="Imagen de fondo" />
	<div><button class="btn">Guardar portada</button></div>
</form>

<form class="card stack" method="POST" use:enhance={enh}>
	{@render head('destacado', 'Proyecto destacado')}
	<input type="hidden" name="block" value="destacado" />
	<div class="form-grid">
		<div class="field"><label for="d1">Etiqueta</label><input class="input" id="d1" name="label" maxlength="30" value={b.destacado?.label ?? 'Destacado'} /></div>
		<div class="field"><label for="d2">Título</label><input class="input" id="d2" name="title" maxlength="80" value={b.destacado?.title ?? ''} /></div>
		<div class="field">
			<label for="d3">Propiedad enlazada</label>
			<select class="select" id="d3" name="propertySlug">
				{#each data.props as p (p.slug)}<option value={p.slug} selected={b.destacado?.propertySlug === p.slug}>{p.title}</option>{/each}
			</select>
		</div>
		<div class="field"><label for="d4">Texto del botón</label><input class="input" id="d4" name="ctaLabel" maxlength="40" value={b.destacado?.ctaLabel ?? 'Ver proyecto'} /></div>
		<div class="field span-all"><label for="d5">Texto</label><textarea class="textarea" id="d5" name="text" maxlength="400" rows="3">{b.destacado?.text ?? ''}</textarea></div>
	</div>
	<div>
		<span class="label">Fotos del slider (en orden)</span>
		<ul class="thumbs">
			{#each destImgs as id, i (id)}
				<li>
					<input type="hidden" name="imageIds" value={id} />
					<img src="/media/{id}/640.webp" alt="" />
					<button type="button" class="x" onclick={() => (destImgs = destImgs.filter((x) => x !== id))} aria-label="Quitar foto {i + 1}"><Icon name="close" size={14} /></button>
				</li>
			{/each}
		</ul>
		<MediaPicker name="" bind:value={addDest} folder="propiedades" label="Agregar foto" />
	</div>
	<div><button class="btn">Guardar destacado</button></div>
</form>

<form class="card stack" method="POST" use:enhance={enh}>
	{@render head('promos', 'Oportunidades / promociones')}
	<input type="hidden" name="block" value="promos" />
	{#each [0, 1, 2] as i (i)}
		{@const it = b.promos?.items?.[i]}
		<fieldset class="promo">
			<legend>Promoción {i + 1} {i === 2 ? '(opcional)' : ''}</legend>
			<div class="form-grid">
				<div class="field"><label for="pt{i}">Título</label><input class="input" id="pt{i}" name="title_{i}" maxlength="80" value={it?.title ?? ''} /></div>
				<div class="field"><label for="pc{i}">Botón</label><input class="input" id="pc{i}" name="ctaLabel_{i}" maxlength="40" value={it?.ctaLabel ?? ''} /></div>
				<div class="field"><label for="ph{i}">Enlace</label><input class="input" id="ph{i}" name="href_{i}" maxlength="300" value={it?.href ?? ''} placeholder="/propiedades/… o https://…" /></div>
				<div class="field span-all"><label for="px{i}">Texto</label><textarea class="textarea" id="px{i}" name="text_{i}" maxlength="300" rows="2">{it?.text ?? ''}</textarea></div>
			</div>
			<MediaPicker name="imageId_{i}" bind:value={promoImgs[i]} folder="site" label="Imagen" />
		</fieldset>
	{/each}
	<div><button class="btn">Guardar promociones</button></div>
</form>

<form class="card stack" method="POST" use:enhance={enh}>
	{@render head('trust', 'Barra de confianza')}
	<input type="hidden" name="block" value="trust" />
	<p class="muted small">Usa <code>{'{propiedades}'}</code> para mostrar automáticamente el número de propiedades publicadas.</p>
	{#each [0, 1, 2, 3] as i (i)}
		<div class="form-grid">
			<div class="field"><label for="tv{i}">Valor {i + 1}</label><input class="input" id="tv{i}" name="value_{i}" maxlength="30" value={b.trust?.items?.[i]?.value ?? ''} /></div>
			<div class="field"><label for="tl{i}">Texto {i + 1}</label><input class="input" id="tl{i}" name="label_{i}" maxlength="80" value={b.trust?.items?.[i]?.label ?? ''} /></div>
		</div>
	{/each}
	<div><button class="btn">Guardar barra</button></div>
</form>

<form class="card stack" method="POST" use:enhance={enh}>
	{@render head('owner', 'Banda para propietarios')}
	<input type="hidden" name="block" value="owner" />
	<div class="field"><label for="o1">Título</label><input class="input" id="o1" name="title" maxlength="90" value={b.owner?.title ?? ''} /></div>
	<div class="field"><label for="o2">Texto</label><textarea class="textarea" id="o2" name="text" maxlength="300" rows="2">{b.owner?.text ?? ''}</textarea></div>
	<MediaPicker name="imageId" bind:value={ownerImg} folder="site" label="Imagen de fondo" />
	<div><button class="btn">Guardar banda</button></div>
</form>

<form class="card stack" method="POST" use:enhance={enh}>
	{@render head('partner', 'Partner Santiago')}
	<input type="hidden" name="block" value="partner" />
	<div class="form-grid">
		<div class="field"><label for="pa1">Título</label><input class="input" id="pa1" name="title" maxlength="80" value={b.partner?.title ?? ''} /></div>
		<div class="field"><label for="pa2">Botón</label><input class="input" id="pa2" name="ctaLabel" maxlength="60" value={b.partner?.ctaLabel ?? ''} /></div>
		<div class="field"><label for="pa3">URL</label><input class="input" id="pa3" name="url" maxlength="300" value={b.partner?.url ?? ''} /></div>
		<div class="field span-all"><label for="pa4">Texto</label><textarea class="textarea" id="pa4" name="text" maxlength="300" rows="2">{b.partner?.text ?? ''}</textarea></div>
	</div>
	<div class="form-grid">
		<MediaPicker name="imageId" bind:value={partnerImg} folder="site" label="Imagen" />
		<MediaPicker name="logoId" bind:value={partnerLogo} folder="site" label="Logo" />
	</div>
	<div><button class="btn">Guardar partner</button></div>
</form>

<style>
	.bh {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 8px;
	}
	.bh h2 {
		margin: 0;
	}
	.promo {
		border: 1px solid var(--line);
		border-radius: 8px;
		padding: var(--sp-4);
		display: grid;
		gap: var(--sp-3);
	}
	legend {
		font-weight: 700;
		padding: 0 4px;
	}
	.thumbs {
		list-style: none;
		padding: 0;
		margin: 6px 0 var(--sp-3);
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.thumbs li {
		position: relative;
		width: 130px;
		aspect-ratio: 3 / 2;
		border-radius: 6px;
		overflow: hidden;
	}
	.thumbs img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.x {
		position: absolute;
		top: 4px;
		right: 4px;
		border: 0;
		border-radius: 50%;
		width: 24px;
		height: 24px;
		display: grid;
		place-items: center;
		background: rgba(255, 255, 255, 0.9);
		cursor: pointer;
	}
	.label {
		font-weight: 700;
		font-size: 0.92rem;
	}
</style>
