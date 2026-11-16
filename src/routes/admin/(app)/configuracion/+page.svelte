<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	const c = $derived(data.settings.contact);
	const so = $derived(data.settings.social);
</script>

<svelte:head><title>Configuración | CMS Maller&M</title></svelte:head>

<div class="page-head"><div><h1>Configuración del sitio</h1><p>Datos de contacto, redes sociales y SEO global. Solo super administradores.</p></div></div>

<form class="stack" method="POST" use:enhance={() => async ({ update }) => update({ reset: false })}>
	{#if form?.error}<p class="alert alert--error">{form.error}</p>{/if}
	{#if form?.saved}<p class="alert alert--success">Configuración guardada.</p>{/if}
	<section class="card stack">
		<h2>Contacto</h2>
		<div class="form-grid">
			<div class="field"><label for="p1">Teléfono principal</label><input class="input" id="p1" name="phone1" value={c.phones[0] ?? ''} /></div>
			<div class="field"><label for="p2">Teléfono secundario</label><input class="input" id="p2" name="phone2" value={c.phones[1] ?? ''} /></div>
			<div class="field"><label for="wa">WhatsApp</label><input class="input" id="wa" name="whatsapp" value={c.whatsapp} /></div>
			<div class="field"><label for="em">Correo</label><input class="input" id="em" name="email" type="email" value={c.email} /><span class="hint">Recomendado: correo de dominio @mallerym.cl con SPF/DKIM/DMARC.</span></div>
			<div class="field span-all"><label for="ad">Dirección</label><input class="input" id="ad" name="address" value={c.address} /></div>
			<div class="field"><label for="mq">Búsqueda para el mapa</label><input class="input" id="mq" name="mapQuery" value={c.mapQuery} /></div>
			<div class="field"><label for="hr">Horario (opcional)</label><input class="input" id="hr" name="hours" value={c.hours} placeholder="Lunes a sábado, 10:00–19:00" /></div>
		</div>
	</section>
	<section class="card stack">
		<h2>Redes sociales</h2>
		<p class="muted small">Deja vacío lo que no uses: el sitio no mostrará enlaces rotos (en el sitio antiguo Facebook y LinkedIn apuntaban a “#”).</p>
		<div class="form-grid">
			<div class="field"><label for="ig">Instagram</label><input class="input" id="ig" name="instagram" value={so.instagram} /></div>
			<div class="field"><label for="fb">Facebook</label><input class="input" id="fb" name="facebook" value={so.facebook} /></div>
			<div class="field"><label for="li">LinkedIn</label><input class="input" id="li" name="linkedin" value={so.linkedin} /></div>
		</div>
	</section>
	<section class="card stack">
		<h2>SEO global</h2>
		<div class="field"><label for="dd">Meta descripción por defecto (50–160)</label><textarea class="textarea" id="dd" name="defaultDescription" maxlength="160" rows="3">{data.settings.seo.defaultDescription}</textarea></div>
	</section>
	<div><button class="btn">Guardar configuración</button></div>
</form>
