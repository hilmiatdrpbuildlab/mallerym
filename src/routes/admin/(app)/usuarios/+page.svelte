<script lang="ts">
	import { PUBLIC_MFA_REQUIRED } from '$app/env/public';
	import { enhance } from '$app/forms';
	import { ROLE_LABEL, type Role } from '$lib/permissions';
	import { fmtDateTime } from '$lib/format';

	let { data, form } = $props();
	let code = $state('');
	const enh = () => async ({ update }: any) => update({ reset: false });
</script>

<svelte:head><title>Usuarios | CMS Maller&M</title></svelte:head>

<div class="page-head">
	<div>
		<h1>Usuarios y roles</h1>
		<p>Sin registro público: solo invitación. Las acciones sensibles exigen {PUBLIC_MFA_REQUIRED ? 'tu código MFA actual' : 'tu contraseña'}.</p>
	</div>
</div>

<div class="card reauth">
	<label for="code"><strong>{PUBLIC_MFA_REQUIRED ? 'Código MFA' : 'Tu contraseña'} para acciones sensibles</strong></label>
	<input class="input" id="code" bind:value={code} type={PUBLIC_MFA_REQUIRED ? 'text' : 'password'} maxlength="256" />
	<span class="muted small">Se envía junto a crear usuario, cambiar rol, desactivar o resetear MFA.</span>
</div>

{#if form?.error}<p class="alert alert--error">{form.error}</p>{/if}
{#if form?.created}
	<div class="alert alert--success">
		Usuario <strong>{form.created.email}</strong> creado. Contraseña temporal (se muestra una sola vez): <code>{form.created.temp}</code>.
		{PUBLIC_MFA_REQUIRED ? 'Al iniciar sesión deberá activar MFA.' : ''}
	</div>
{/if}

<div class="card">
	<div class="table-wrap">
		<table class="tbl">
			<thead><tr><th>Usuario</th><th>Rol</th><th>MFA</th><th>Sesiones</th><th>Último acceso</th><th>Acciones</th></tr></thead>
			<tbody>
				{#each data.users as u (u.id)}
					<tr class:off={!u.active}>
						<td><strong>{u.name}</strong><div class="muted small">{u.email}{u.id === data.me ? ' · tú' : ''}{u.active ? '' : ' · desactivado'}</div></td>
						<td>
							<form method="POST" action="?/role" use:enhance={enh} class="inline">
								<input type="hidden" name="id" value={u.id} /><input type="hidden" name="code" value={code} />
								<select class="select" name="role" disabled={u.id === data.me}>
									{#each Object.entries(ROLE_LABEL) as [k, v] (k)}<option value={k} selected={u.role === k}>{v}</option>{/each}
								</select>
								{#if u.id !== data.me}<button class="btn btn--plain btn--sm">Cambiar</button>{/if}
							</form>
						</td>
						<td><span class="state state--{u.mfa_enabled ? 'published' : 'review'}">{u.mfa_enabled ? 'Activo' : 'Pendiente'}</span></td>
						<td>{u.sessions}</td>
						<td class="muted small">{fmtDateTime(u.last_login_at) || '—'}</td>
						<td class="acts">
							{#if u.id !== data.me}
								<form method="POST" action="?/revoke" use:enhance={enh}><input type="hidden" name="id" value={u.id} /><button class="btn btn--plain btn--sm">Cerrar sesiones</button></form>
								<form method="POST" action="?/resetMfa" use:enhance={enh}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="code" value={code} /><button class="btn btn--plain btn--sm">Resetear MFA</button></form>
								<form method="POST" action="?/toggle" use:enhance={enh}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="code" value={code} /><button class="btn btn--plain btn--sm">{u.active ? 'Desactivar' : 'Activar'}</button></form>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<form class="card stack" method="POST" action="?/create" use:enhance={enh}>
	<h2>Invitar usuario</h2>
	<input type="hidden" name="code" value={code} />
	<div class="form-grid">
		<div class="field"><label for="n">Nombre</label><input class="input" id="n" name="name" required maxlength="80" /></div>
		<div class="field"><label for="e">Correo</label><input class="input" id="e" name="email" type="email" required /></div>
		<div class="field">
			<label for="r">Rol</label>
			<select class="select" id="r" name="role">
				{#each Object.entries(ROLE_LABEL) as [k, v] (k)}<option value={k} selected={k === 'editor'}>{v}</option>{/each}
			</select>
		</div>
	</div>
	<details class="small">
		<summary>¿Qué puede hacer cada rol?</summary>
		<ul>
			<li><strong>{ROLE_LABEL.super_admin as string}</strong>: todo, incluidos usuarios, configuración y auditoría.</li>
			<li><strong>{ROLE_LABEL.editor as string}</strong>: propiedades (publicar), blog, contenido, medios; ver leads.</li>
			<li><strong>{ROLE_LABEL.corredor as string}</strong>: crear/editar propiedades (sin publicar), gestionar y exportar leads.</li>
			<li><strong>{ROLE_LABEL.viewer as string}</strong>: solo dashboard.</li>
		</ul>
	</details>
	<div><button class="btn">Crear usuario</button></div>
</form>

<style>
	.reauth {
		display: grid;
		grid-template-columns: auto 160px 1fr;
		gap: 12px;
		align-items: center;
		margin-bottom: var(--sp-4);
		background: var(--warning-bg);
	}
	@media (max-width: 760px) {
		.reauth {
			grid-template-columns: 1fr;
		}
	}
	.inline {
		display: flex;
		gap: 4px;
		align-items: center;
	}
	.inline .select {
		min-width: 170px;
	}
	.acts {
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
	}
	.off td {
		opacity: 0.6;
	}
	code {
		background: #fff;
		padding: 2px 6px;
		border-radius: 4px;
	}
</style>
