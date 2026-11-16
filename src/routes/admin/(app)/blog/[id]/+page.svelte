<script lang="ts">
	import { enhance } from '$app/forms';
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';
	import MediaPicker from '$lib/components/admin/MediaPicker.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { slugify } from '$lib/format';

	let { data, form } = $props();
	const p = $derived(data.post);
	let title = $state('');
	let slug = $state('');
	let body = $state('');
	let cover = $state<string | null>(null);
	let saved = $state(false);
	$effect.pre(() => {
		title = p?.title ?? '';
		slug = p?.slug ?? '';
		body = p?.body ?? '';
		cover = p?.coverId ?? null;
	});
	const err = $derived((form as any)?.errors ?? {});
	const toLocal = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString().slice(0, 16) : '');
</script>

<svelte:head><title>{p ? p.title : 'Nuevo artículo'} | CMS Maller&M</title></svelte:head>

<div class="page-head">
	<div>
		<a href="/admin/blog/" class="small">← Blog</a>
		<h1>{p ? p.title : 'Nuevo artículo'}</h1>
	</div>
	{#if p}<a class="btn btn--secondary btn--sm" href="/blog/{p.slug}/?preview" target="_blank" rel="noopener"><Icon name="eye" size={16} /> Vista previa</a>{/if}
</div>

{#if form?.error}<p class="alert alert--error">{form.error}</p>{/if}

<form
	method="POST"
	action="?/save"
	class="edit"
	use:enhance={() =>
		async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') {
				saved = true;
				setTimeout(() => (saved = false), 2500);
			}
		}}
>
	<input type="hidden" name="version" value={p?.version ?? 0} />
	<div class="card stack">
		<div class="field">
			<label for="t">Título</label>
			<input class="input" id="t" name="title" bind:value={title} maxlength="160" oninput={() => !p && (slug = slugify(title))} aria-invalid={err.title ? 'true' : undefined} />
			{#if err.title}<span class="field-error">{err.title}</span>{/if}
		</div>
		<div class="field">
			<label for="sl">URL</label>
			<div class="slug"><span class="muted small">/blog/</span><input class="input" id="sl" name="slug" bind:value={slug} aria-invalid={err.slug ? 'true' : undefined} /></div>
			{#if err.slug}<span class="field-error">{err.slug}</span>{/if}
		</div>
		<div class="field">
			<label for="ex">Extracto</label>
			<textarea class="textarea" id="ex" name="excerpt" maxlength="300" rows="2">{p?.excerpt ?? ''}</textarea>
		</div>
		<RichTextEditor name="body" bind:value={body} rows={22} maxlength={40000} allowImages label="Contenido del artículo" />
	</div>
	<aside class="card stack side">
		<div class="field">
			<label for="st">Estado</label>
			<select class="select" id="st" name="publishState">
				{#each [['draft', 'Borrador'], ['review', 'En revisión'], ['published', 'Publicado'], ['archived', 'Archivado']] as [v, l] (v)}
					<option value={v} selected={(p?.publishState ?? 'draft') === v}>{l}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="pa">Fecha de publicación</label>
			<input class="input" id="pa" type="datetime-local" name="publishedAt" value={toLocal(p?.publishedAt)} />
			<span class="hint">Una fecha futura programa la publicación.</span>
		</div>
		<div class="field">
			<label for="au">Autor</label>
			<select class="select" id="au" name="authorId">
				<option value="">—</option>
				{#each data.authors as a (a.id)}<option value={a.id} selected={p?.authorId === a.id}>{a.name}</option>{/each}
			</select>
		</div>
		<fieldset>
			<legend>Categorías</legend>
			{#each data.cats as c (c.id)}
				<label class="check"><input type="checkbox" name="category" value={c.id} checked={data.selected.includes(c.id)} /> <span>{c.name}</span></label>
			{/each}
		</fieldset>
		<MediaPicker name="coverId" bind:value={cover} folder="blog" label="Imagen de portada" />
		<div class="field">
			<label for="mt">Meta título</label>
			<input class="input" id="mt" name="metaTitle" maxlength="60" value={p?.metaTitle ?? ''} />
		</div>
		<div class="field">
			<label for="md">Meta descripción</label>
			<textarea class="textarea" id="md" name="metaDescription" maxlength="160" rows="3">{p?.metaDescription ?? ''}</textarea>
		</div>
		<button class="btn btn--block" type="submit">Guardar</button>
		{#if saved}<p class="muted small">Guardado ✓</p>{/if}
		{#if p}
			<button class="btn btn--plain btn--sm danger" formaction="?/remove" onclick={(e) => !confirm('¿Eliminar este artículo?') && e.preventDefault()}><Icon name="trash" size={14} /> Eliminar</button>
		{/if}
	</aside>
</form>

<style>
	.edit {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 320px;
		gap: var(--sp-5);
		align-items: start;
	}
	@media (max-width: 1100px) {
		.edit {
			grid-template-columns: 1fr;
		}
	}
	.edit .card + .card {
		margin-top: 0;
	}
	.side {
		position: sticky;
		top: 70px;
	}
	.slug {
		display: flex;
		gap: 6px;
		align-items: center;
	}
	fieldset {
		border: 1px solid var(--line);
		border-radius: 8px;
		padding: var(--sp-3);
		display: grid;
		gap: 6px;
	}
	legend {
		font-weight: 700;
	}
	.danger {
		--btn-fg: var(--danger);
	}
</style>
