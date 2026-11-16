<script lang="ts">
	import { PUBLIC_MFA_REQUIRED } from '$app/env/public';
	import { enhance } from '$app/forms';
	import { ROLE_LABEL } from '$lib/permissions';
	import { fmtDateTime } from '$lib/format';

	let { data, form } = $props();
</script>

<svelte:head><title>Mi cuenta | CMS Maller&M</title></svelte:head>

<div class="page-head">
	<div><h1>Mi cuenta</h1><p>{data.user.name} · {data.user.email} · {ROLE_LABEL[data.user.role]}</p></div>
</div>

<div class="cols">
	<form class="card stack" method="POST" action="?/password" use:enhance>
		<h2>Cambiar contraseña</h2>
		{#if form?.pwError}<p class="alert alert--error">{form.pwError}</p>{/if}
		{#if form?.pwOk}<p class="alert alert--success">Contraseña actualizada. Se cerraron tus otras sesiones.</p>{/if}
		<div class="field"><label for="c">Contraseña actual</label><input class="input" id="c" name="current" type="password" autocomplete="current-password" required /></div>
		<div class="field"><label for="n">Nueva contraseña</label><input class="input" id="n" name="next" type="password" autocomplete="new-password" minlength="12" required /><span class="hint">Mínimo 12 caracteres. Se verifica contra filtraciones conocidas (k-anonymity).</span></div>
		<div class="field"><label for="r">Repetir</label><input class="input" id="r" name="confirm" type="password" autocomplete="new-password" minlength="12" required /></div>
		<div><button class="btn">Actualizar</button></div>
	</form>

	<div>
		{#if !PUBLIC_MFA_REQUIRED}
			<section class="card stack">
				<h2>Verificación en dos pasos</h2>
				<p class="muted">Desactivada en esta demo. Se activará (obligatoria para todo el equipo) al pasar a producción.</p>
			</section>
		{:else}
		<section class="card stack">
			<h2>Verificación en dos pasos</h2>
			<p><span class="state state--published">TOTP activo</span> · {data.codesLeft} códigos de recuperación disponibles</p>
			{#if form?.codesError}<p class="alert alert--error">{form.codesError}</p>{/if}
			{#if form?.codes}
				<div class="alert alert--success">Nuevos códigos (guárdalos ahora): <ol class="codes">{#each form.codes as c (c)}<li><code>{c}</code></li>{/each}</ol></div>
			{/if}
			<form method="POST" action="?/codes" use:enhance class="inline">
				<input class="input" name="code" type={PUBLIC_MFA_REQUIRED ? 'text' : 'password'} maxlength="256" placeholder={PUBLIC_MFA_REQUIRED ? 'Código MFA' : 'Tu contraseña'} required />
				<button class="btn btn--secondary btn--sm">Regenerar códigos</button>
			</form>
		</section>
		{/if}

		<section class="card stack">
			<h2>Sesiones activas</h2>
			<ul class="sess">
				{#each data.sessions as se (se.id)}
					<li>
						<div>
							<strong>{se.current ? 'Esta sesión' : 'Otra sesión'}</strong>
							<span class="muted small">{se.userAgent?.slice(0, 70) ?? '—'}</span>
						</div>
						<span class="muted small">inició {fmtDateTime(se.createdAt)} · expira {fmtDateTime(se.expiresAt)}</span>
					</li>
				{/each}
			</ul>
			{#if form?.revoked}<p class="muted small">Otras sesiones cerradas ✓</p>{/if}
			<form method="POST" action="?/revokeOthers" use:enhance><button class="btn btn--plain btn--sm">Cerrar todas las demás sesiones</button></form>
		</section>
	</div>
</div>

<style>
	.cols {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
		gap: var(--sp-5);
		align-items: start;
	}
	.cols .card + .card {
		margin-top: var(--sp-5);
	}
	.inline {
		display: flex;
		gap: 8px;
	}
	.inline .input {
		max-width: 160px;
	}
	.sess {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 8px;
	}
	.sess li {
		display: grid;
		gap: 2px;
		padding: 10px;
		border-radius: 6px;
		background: #f7f9fb;
	}
	.sess li div {
		display: grid;
	}
	.codes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px;
		padding: 0;
		list-style: none;
		margin: 8px 0 0;
	}
</style>
