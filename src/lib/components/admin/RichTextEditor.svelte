<script lang="ts">
	import { renderRichText } from '$lib/richtext';
	import MediaPicker from './MediaPicker.svelte';

	let {
		name,
		value = $bindable(''),
		rows = 14,
		maxlength = 20000,
		allowImages = false,
		label = 'Contenido'
	}: { name: string; value?: string; rows?: number; maxlength?: number; allowImages?: boolean; label?: string } = $props();

	let ta: HTMLTextAreaElement;
	let mode = $state<'edit' | 'preview'>('edit');
	let imageId = $state<string | null>(null);
	const id = `rte-${name}`;

	function wrap(before: string, after = before, placeholder = 'texto') {
		const { selectionStart: s, selectionEnd: e } = ta;
		const sel = value.slice(s, e) || placeholder;
		value = value.slice(0, s) + before + sel + after + value.slice(e);
		queueMicrotask(() => {
			ta.focus();
			ta.setSelectionRange(s + before.length, s + before.length + sel.length);
		});
	}
	function linePrefix(prefix: string) {
		const s = ta.selectionStart;
		const lineStart = value.lastIndexOf('\n', s - 1) + 1;
		value = value.slice(0, lineStart) + prefix + value.slice(lineStart);
		queueMicrotask(() => ta.focus());
	}
	function link() {
		const url = prompt('URL del enlace (https://… o /ruta/)');
		if (!url) return;
		if (!/^(https?:\/\/|\/|mailto:|tel:)/i.test(url)) return alert('Solo se permiten enlaces https://, /ruta/, mailto: o tel:');
		wrap('[', `](${url})`, 'texto del enlace');
	}
	$effect(() => {
		if (imageId) {
			const s = ta?.selectionStart ?? value.length;
			value = value.slice(0, s) + `\n\n![Descripción de la imagen](/media/${imageId})\n\n` + value.slice(s);
			imageId = null;
		}
	});
</script>

<div class="rte">
	<div class="bar">
		<label for={id} class="lbl">{label}</label>
		<div class="tools" role="toolbar" aria-label="Formato">
			<button type="button" onclick={() => linePrefix('## ')} title="Título (H2)">H2</button>
			<button type="button" onclick={() => linePrefix('### ')} title="Subtítulo (H3)">H3</button>
			<button type="button" onclick={() => wrap('**')} title="Negrita"><b>B</b></button>
			<button type="button" onclick={() => wrap('*')} title="Cursiva"><i>I</i></button>
			<button type="button" onclick={() => linePrefix('- ')} title="Lista">• Lista</button>
			<button type="button" onclick={link} title="Enlace">Enlace</button>
			<span class="sep"></span>
			<button type="button" class:on={mode === 'edit'} onclick={() => (mode = 'edit')}>Editar</button>
			<button type="button" class:on={mode === 'preview'} onclick={() => (mode = 'preview')}>Vista previa</button>
		</div>
	</div>
	<textarea bind:this={ta} {id} {name} class="textarea" {rows} {maxlength} bind:value hidden={mode === 'preview'}></textarea>
	{#if mode === 'preview'}
		<div class="prose preview">{@html renderRichText(value)}</div>
	{/if}
	<p class="hint">
		Texto estructurado: <code>## Título</code>, <code>**negrita**</code>, <code>*cursiva*</code>, <code>- lista</code>,
		<code>[texto](https://…)</code>. No se permite HTML. {value.length.toLocaleString('es-CL')}/{maxlength.toLocaleString('es-CL')}
	</p>
	{#if allowImages}
		<div class="img-ins"><MediaPicker name="" bind:value={imageId} folder="blog" label="Insertar imagen en el texto" /></div>
	{/if}
</div>

<style>
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 6px;
	}
	.lbl {
		font-weight: 700;
		font-size: 0.92rem;
	}
	.tools {
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
		background: #eef1f5;
		padding: 3px;
		border-radius: 6px;
	}
	.tools button {
		border: 0;
		background: none;
		padding: 4px 10px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.tools button:hover,
	.tools button.on {
		background: #fff;
		color: var(--ink);
	}
	.sep {
		width: 1px;
		background: var(--line-strong);
		margin: 4px;
	}
	textarea {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.88rem;
		line-height: 1.55;
	}
	.preview {
		max-width: none;
		padding: var(--sp-4);
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius-btn);
		min-height: 200px;
		background: #fff;
	}
	.hint {
		font-size: 0.78rem;
		color: var(--ink-muted);
		margin: 6px 0 0;
	}
	.hint code {
		background: #eef1f5;
		padding: 0 4px;
		border-radius: 3px;
	}
	.img-ins {
		margin-top: var(--sp-3);
	}
</style>
