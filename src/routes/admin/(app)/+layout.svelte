<script lang="ts">
	import { PUBLIC_MFA_REQUIRED } from '$app/env/public';
	import '$lib/design/admin.css';
	import { page, navigating } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { can, ROLE_LABEL, type Permission } from '$lib/permissions';

	let { data, children } = $props();
	let open = $state(false);

	type Item = { href: string; label: string; icon: any; perm: Permission; badge?: number };
	const groups: { title: string; items: Item[] }[] = $derived([
		{
			title: 'General',
			items: [
				{ href: '/admin/', label: 'Dashboard', icon: 'chart', perm: 'dashboard:read' },
				{ href: '/admin/leads/', label: 'Leads', icon: 'inbox', perm: 'lead:read', badge: data.newLeads }
			]
		},
		{
			title: 'Contenido',
			items: [
				{ href: '/admin/propiedades/', label: 'Propiedades', icon: 'home', perm: 'property:write' },
				{ href: '/admin/inicio/', label: 'Destacados y promos', icon: 'star', perm: 'content:write' },
				{ href: '/admin/blog/', label: 'Blog', icon: 'pen', perm: 'post:write' },
				{ href: '/admin/equipo/', label: 'Equipo', icon: 'users', perm: 'content:write' },
				{ href: '/admin/media/', label: 'Media', icon: 'image', perm: 'media:write' }
			]
		},
		{
			title: 'Administración',
			items: [
				{ href: '/admin/configuracion/', label: 'Configuración', icon: 'settings', perm: 'settings:write' },
				{ href: '/admin/usuarios/', label: 'Usuarios', icon: 'key', perm: 'user:manage' },
				{ href: '/admin/auditoria/', label: 'Auditoría', icon: 'log', perm: 'audit:read' }
			]
		}
	]);
	const active = (href: string) => (href === '/admin/' ? page.url.pathname === '/admin/' : page.url.pathname.startsWith(href));
	$effect(() => {
		page.url.pathname;
		open = false;
	});
</script>

<svelte:head><meta name="robots" content="noindex, nofollow" /></svelte:head>

<div class="adm shell">
	<aside class="side" class:open>
		<a class="brand" href="/admin/">
			<img src="/isotipo-blanco.webp" alt="" width="104" height="48" />
			<span><strong>Maller&amp;M</strong><small>CMS</small></span>
		</a>
		<nav aria-label="Panel">
			{#each groups as g (g.title)}
				{@const items = g.items.filter((i) => can(data.user.role, i.perm))}
				{#if items.length}
					<p class="group">{g.title}</p>
					<ul>
						{#each items as it (it.href)}
							<li>
								<a href={it.href} aria-current={active(it.href) ? 'page' : undefined}>
									<Icon name={it.icon} size={18} />
									<span>{it.label}</span>
									{#if it.badge}<b class="badge-n">{it.badge}</b>{/if}
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			{/each}
		</nav>
		<div class="me">
			<a href="/admin/cuenta/" class="me-link">
				<span class="avatar">{data.user.name.slice(0, 1)}</span>
				<span class="me-txt"><strong>{data.user.name}</strong><small>{ROLE_LABEL[data.user.role]}</small></span>
			</a>
			<form method="POST" action="/admin/salir/">
				<button class="out" type="submit" aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="logout" size={18} /></button>
			</form>
		</div>
	</aside>

	<div class="main">
		<header class="top">
			<button class="burger" onclick={() => (open = !open)} aria-label="Menú" aria-expanded={open}><Icon name={open ? 'close' : 'menu'} /></button>
			<span class="sec"><Icon name="shield" size={16} /> {PUBLIC_MFA_REQUIRED ? 'Sesión con MFA' : 'Sesión segura'}</span>
			<a class="btn btn--plain btn--sm" href="/" target="_blank" rel="noopener"><Icon name="external" size={16} /> Ver sitio</a>
		</header>
		{#if navigating.to}<div class="loading" aria-hidden="true"></div>{/if}
		<main class="content">
			{@render children()}
		</main>
	</div>
	{#if open}<button class="scrim" aria-label="Cerrar menú" onclick={() => (open = false)}></button>{/if}
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: 248px 1fr;
	}
	.side {
		position: sticky;
		top: 0;
		height: 100dvh;
		display: flex;
		flex-direction: column;
		background: var(--adm-side);
		color: #c9d4df;
		padding: var(--sp-4) var(--sp-3);
		overflow-y: auto;
	}
	.brand {
		display: flex;
		gap: 10px;
		align-items: center;
		padding: 6px 10px 18px;
		color: #fff;
		text-decoration: none;
	}
	.brand img {
		height: 28px;
		width: auto;
	}
	.brand span {
		display: grid;
		line-height: 1.1;
	}
	.brand strong {
		font-family: var(--font-heading);
	}
	.brand small {
		font-size: 0.7rem;
		letter-spacing: 0.2em;
		color: var(--brand-gold-light);
	}
	.group {
		margin: var(--sp-4) 10px 6px;
		font-size: 0.68rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #7d8ca0;
		font-weight: 700;
	}
	nav ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 2px;
	}
	nav a {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 10px;
		border-radius: 6px;
		color: #c9d4df;
		text-decoration: none;
		font-weight: 700;
		font-size: 0.9rem;
	}
	nav a:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #fff;
	}
	nav a[aria-current='page'] {
		background: rgba(191, 160, 86, 0.16);
		color: #fff;
	}
	nav a[aria-current='page'] :global(svg) {
		color: var(--brand-gold-light);
	}
	.badge-n {
		margin-left: auto;
		min-width: 22px;
		padding: 1px 7px;
		border-radius: 999px;
		background: var(--brand-gold);
		color: var(--brand-navy);
		font-size: 0.72rem;
		text-align: center;
	}
	.me {
		margin-top: auto;
		display: flex;
		align-items: center;
		gap: 6px;
		padding-top: var(--sp-4);
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}
	.me-link {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px;
		border-radius: 6px;
		text-decoration: none;
		color: #fff;
		min-width: 0;
	}
	.me-link:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.avatar {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: var(--brand-primary-600);
		font-weight: 800;
		flex: none;
	}
	.me-txt {
		display: grid;
		min-width: 0;
		line-height: 1.2;
	}
	.me-txt strong {
		font-size: 0.85rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.me-txt small {
		font-size: 0.72rem;
		color: #9fb0c3;
	}
	.out {
		background: none;
		border: 0;
		color: #c9d4df;
		padding: 8px;
		border-radius: 6px;
		cursor: pointer;
	}
	.out:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #fff;
	}
	.main {
		min-width: 0;
	}
	.top {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: var(--sp-3);
		justify-content: flex-end;
		padding: 10px var(--sp-6);
		background: rgba(244, 246, 249, 0.9);
		backdrop-filter: blur(6px);
		border-bottom: 1px solid var(--line);
	}
	.sec {
		display: inline-flex;
		gap: 6px;
		align-items: center;
		margin-right: auto;
		font-size: 0.8rem;
		color: var(--success);
		font-weight: 700;
	}
	.burger {
		display: none;
		background: none;
		border: 0;
		cursor: pointer;
		padding: 6px;
	}
	.content {
		padding: var(--sp-6);
		max-width: 1280px;
	}
	.loading {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		z-index: 90;
		background: linear-gradient(90deg, var(--brand-gold), var(--brand-primary-600));
		animation: load 1.2s ease-in-out infinite;
		transform-origin: left;
	}
	@keyframes load {
		0% {
			transform: scaleX(0);
		}
		60% {
			transform: scaleX(0.8);
		}
		100% {
			transform: scaleX(1);
			opacity: 0;
		}
	}
	.scrim {
		display: none;
	}
	@media (max-width: 900px) {
		.shell {
			grid-template-columns: 1fr;
		}
		.side {
			position: fixed;
			inset: 0 auto 0 0;
			width: 270px;
			z-index: 80;
			transform: translateX(-100%);
			transition: transform 0.25s var(--ease);
		}
		.side.open {
			transform: none;
		}
		.burger {
			display: inline-flex;
			margin-right: auto;
		}
		.sec {
			margin-right: 0;
		}
		.content {
			padding: var(--sp-4);
		}
		.scrim {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 70;
			border: 0;
			background: rgba(0, 0, 0, 0.4);
		}
	}
</style>
