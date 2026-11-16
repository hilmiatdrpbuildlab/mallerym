<script lang="ts">
	let { data, form } = $props();
</script>

<svelte:head><title>Nueva propiedad | CMS Maller&M</title></svelte:head>

<div class="page-head">
	<div>
		<a href="/admin/propiedades/" class="small">← Propiedades</a>
		<h1>Nueva propiedad</h1>
		<p>Empieza con lo básico. Después podrás completar precio, superficies, fotos y SEO. Se guarda como borrador.</p>
	</div>
</div>

<form method="POST" class="card stack narrow">
	{#if form?.error}<p class="alert alert--error">{form.error}</p>{/if}
	<div class="field">
		<label for="title">Título</label>
		<input class="input" id="title" name="title" required minlength="5" maxlength="140" placeholder="Ej. Casa en Cond. Polo, Maitencillo" value={form?.values?.title ?? ''} />
		<span class="hint">No incluyas precio ni m² en el título: se muestran automáticamente desde sus campos.</span>
	</div>
	<div class="form-grid">
		<div class="field">
			<label for="operation">Operación</label>
			<select class="select" id="operation" name="operation">
				<option value="venta">Venta</option>
				<option value="arriendo_anual">Arriendo año corrido</option>
				<option value="arriendo_temporal">Arriendo temporal</option>
			</select>
		</div>
		<div class="field">
			<label for="type">Tipo</label>
			<select class="select" id="type" name="propertyTypeId">
				{#each data.types as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
			</select>
		</div>
		<div class="field">
			<label for="loc">Zona</label>
			<select class="select" id="loc" name="locationId">
				{#each data.locations as l (l.id)}<option value={l.id}>{l.sector} ({l.comuna})</option>{/each}
			</select>
		</div>
	</div>
	<div><button class="btn" type="submit">Crear y continuar</button></div>
</form>

<style>
	.narrow {
		max-width: 760px;
	}
</style>
