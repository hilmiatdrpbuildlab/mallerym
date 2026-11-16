<script lang="ts">
	let { data, form } = $props();
	let copied = $state(false);
</script>

<svelte:head><title>Configurar MFA | CMS Maller&M</title></svelte:head>

{#if form?.codes}
	<h1>¡MFA activado!</h1>
	<p class="sub">Guarda estos códigos de recuperación en un lugar seguro (gestor de contraseñas). Cada uno sirve <strong>una sola vez</strong> si pierdes tu teléfono. No volverán a mostrarse.</p>
	<ol class="codes">
		{#each form.codes as c (c)}<li><code>{c}</code></li>{/each}
	</ol>
	<button
		class="btn btn--secondary btn--block"
		type="button"
		onclick={async () => {
			await navigator.clipboard.writeText(form.codes.join('\n'));
			copied = true;
		}}>{copied ? 'Copiados ✓' : 'Copiar códigos'}</button
	>
	<a class="btn btn--block go" href="/admin/" data-sveltekit-reload>Ir al panel</a>
{:else}
	<h1>Activa la verificación en dos pasos</h1>
	<p class="sub">Es obligatoria para todas las cuentas del panel. Escanea el código QR con tu app de autenticación y escribe el código de 6 dígitos.</p>
	<div class="qr" aria-label="Código QR para {data.email}">{@html data.qr}</div>
	<details>
		<summary>¿No puedes escanear? Ingresa la clave manualmente</summary>
		<code class="key">{data.manualKey}</code>
	</details>
	<form method="POST">
		{#if form?.error}<p class="alert alert--error" role="alert">{form.error}</p>{/if}
		<div class="field">
			<label for="code">Código de 6 dígitos</label>
			<input class="input code" id="code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="7" required placeholder="123456" />
		</div>
		<button class="btn btn--block" type="submit">Activar MFA</button>
	</form>
{/if}

<style>
	.qr {
		width: 200px;
		margin: 0 auto var(--sp-4);
		padding: 8px;
		border: 1px solid var(--line);
		border-radius: 8px;
	}
	.qr :global(svg) {
		width: 100%;
		height: auto;
		display: block;
	}
	details {
		margin-bottom: var(--sp-4);
		font-size: 0.9rem;
	}
	summary {
		cursor: pointer;
		color: var(--brand-primary-600);
	}
	.key {
		display: block;
		margin-top: 8px;
		padding: 10px;
		background: var(--surface-alt);
		border-radius: 6px;
		word-break: break-all;
		font-size: 0.95rem;
		letter-spacing: 0.05em;
	}
	.code {
		font-size: 1.4rem;
		letter-spacing: 0.3em;
		text-align: center;
	}
	.codes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		padding: 0;
		list-style: none;
		margin: 0 0 var(--sp-4);
	}
	.codes code {
		display: block;
		padding: 8px;
		text-align: center;
		background: var(--surface-alt);
		border-radius: 6px;
		font-size: 0.95rem;
	}
	.go {
		margin-top: var(--sp-2);
	}
</style>
