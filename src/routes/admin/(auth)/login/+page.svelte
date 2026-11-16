<script lang="ts">
	import { PUBLIC_MFA_REQUIRED } from '$app/env/public';
	import Turnstile from '$lib/components/Turnstile.svelte';
	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Iniciar sesión | CMS Maller&M</title></svelte:head>

<h1>Iniciar sesión</h1>
<p class="sub">Acceso exclusivo para el equipo de Maller&amp;M.</p>

<!--
	Inputs no controlados (defaultValue) y el estado "enviando" se cambia DESPUÉS de que el navegador
	construye el FormData (setTimeout): así un re-render nunca puede vaciar los campos durante el submit.
-->
<form method="POST" onsubmit={() => setTimeout(() => (submitting = true), 0)}>
	{#if form?.error}<p class="alert alert--error" role="alert">{form.error}</p>{/if}
	<div class="field">
		<label for="email">Correo</label>
		<input class="input" id="email" name="email" type="email" autocomplete="username" required defaultValue={form?.email ?? ''} />
	</div>
	<div class="field">
		<label for="password">Contraseña</label>
		<input class="input" id="password" name="password" type="password" autocomplete="current-password" required />
	</div>
	<Turnstile action="login" />
	<button class="btn btn--block" type="submit" disabled={submitting}>{submitting ? 'Verificando…' : 'Continuar'}</button>
	<p class="muted small">{PUBLIC_MFA_REQUIRED ? 'Tras la contraseña se pedirá tu código de autenticación (MFA). ' : ''}No hay registro público: las cuentas se crean por invitación.</p>
</form>
