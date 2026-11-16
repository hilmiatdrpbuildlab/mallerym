<script lang="ts">
	let { data, form } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Verificación en dos pasos | CMS Maller&M</title></svelte:head>

<h1>Verificación en dos pasos</h1>
<p class="sub">Hola {data.name}. Ingresa el código de 6 dígitos de tu app de autenticación (Google Authenticator, 1Password, Authy…).</p>

<form method="POST" onsubmit={() => setTimeout(() => (submitting = true), 0)}>
	{#if form?.error}<p class="alert alert--error" role="alert">{form.error}</p>{/if}
	<div class="field">
		<label for="code">Código</label>
		<!-- svelte-ignore a11y_autofocus -->
		<input class="input code" id="code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="16" required autofocus placeholder="123 456" />
		<span class="hint">¿Sin acceso a tu teléfono? Usa uno de tus códigos de recuperación (XXXX-XXXX-XXXX).</span>
	</div>
	<button class="btn btn--block" type="submit" disabled={submitting}>Verificar</button>
</form>
<form method="POST" action="/admin/salir/" class="cancel"><button class="btn btn--plain btn--block" type="submit">Cancelar y salir</button></form>

<style>
	.code {
		font-size: 1.4rem;
		letter-spacing: 0.3em;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
</style>
