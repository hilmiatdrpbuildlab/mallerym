<script lang="ts">
	import { enhance } from '$app/forms';
	import MediaPicker from '$lib/components/admin/MediaPicker.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data, form } = $props();
	const blank = { id: '', name: '', role: '', bio: '', phone: '', email: '', photoId: null as string | null, sortOrder: 99, showInContact: true };
	let photos = $state<Record<string, string | null>>({});
	$effect.pre(() => {
		photos = Object.fromEntries([...data.team.map((m) => [m.id, m.photoId]), ['new', null]]);
	});
	const enh = () => async ({ update }: any) => update({ reset: false });
</script>

<svelte:head><title>Equipo | CMS Maller&M</title></svelte:head>

<div class="page-head">
	<div><h1>Equipo</h1><p>Tarjetas de “Quiénes somos” y “Contacto directo”. Teléfonos validados en formato chileno.</p></div>
</div>
{#if form?.error}<p class="alert alert--error">{form.error}</p>{/if}

<div class="grid-t">
	{#each [...data.team, blank] as m (m.id || 'new')}
		{@const key = m.id || 'new'}
		<form class="card stack" method="POST" action="?/save" use:enhance={enh}>
			<h2>{m.id ? m.name : 'Agregar integrante'}</h2>
			{#if m.id}<input type="hidden" name="id" value={m.id} />{/if}
			<MediaPicker name="photoId" bind:value={photos[key]} folder="equipo" label="Foto" />
			<div class="form-grid">
				<div class="field"><label for="n{key}">Nombre</label><input class="input" id="n{key}" name="name" value={m.name} maxlength="80" required /></div>
				<div class="field"><label for="r{key}">Cargo</label><input class="input" id="r{key}" name="role" value={m.role} maxlength="80" required /></div>
				<div class="field"><label for="p{key}">Teléfono / WhatsApp</label><input class="input" id="p{key}" name="phone" value={m.phone ?? ''} placeholder="+56 9 1234 5678" /></div>
				<div class="field"><label for="e{key}">Correo</label><input class="input" id="e{key}" name="email" type="email" value={m.email ?? ''} /></div>
				<div class="field"><label for="o{key}">Orden</label><input class="input" id="o{key}" name="sortOrder" type="number" min="0" max="100" value={m.sortOrder} /></div>
				<label class="check ck"><input type="checkbox" name="showInContact" checked={m.showInContact} /> <span>Mostrar en contacto directo</span></label>
			</div>
			<div class="field"><label for="b{key}">Biografía</label><textarea class="textarea" id="b{key}" name="bio" maxlength="1200" rows="4">{m.bio}</textarea></div>
			<div class="toolbar">
				<button class="btn btn--sm">{m.id ? 'Guardar' : 'Agregar'}</button>
				{#if m.id}
					<button class="btn btn--plain btn--sm danger" formaction="?/remove" onclick={(e) => !confirm(`¿Eliminar a ${m.name}?`) && e.preventDefault()}><Icon name="trash" size={14} /> Eliminar</button>
				{/if}
				{#if form?.saved === m.id}<span class="muted small">Guardado ✓</span>{/if}
			</div>
		</form>
	{/each}
</div>

<style>
	.grid-t {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 520px), 1fr));
		gap: var(--sp-5);
	}
	.grid-t .card + .card {
		margin-top: 0;
	}
	.ck {
		align-self: end;
		padding-bottom: 10px;
	}
	.danger {
		--btn-fg: var(--danger);
	}
</style>
