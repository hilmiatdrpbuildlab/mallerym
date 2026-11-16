<script lang="ts">
	import { page } from '$app/state';
	import { waLink } from '$lib/format';
	import Icon from './Icon.svelte';

	let { whatsapp }: { whatsapp: string } = $props();
	let open = $state(false);
	let scrolled = $state(false);

	const nav = [
		{ href: '/', label: 'Inicio' },
		{ href: '/servicios/', label: 'Servicios' },
		{ href: '/propiedades/', label: 'Propiedades' },
		{ href: '/blog/', label: 'Blog' },
		{ href: '/quienes-somos/', label: 'Quiénes somos' },
		{ href: '/contacto-y-ubicacion/', label: 'Contacto y ubicación' }
	];
	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);

	$effect(() => {
		page.url.pathname;
		open = false;
	});
	$effect(() => {
		document.body.classList.toggle('nav-open', open);
	});
</script>

<svelte:window onscroll={() => (scrolled = window.scrollY > 24)} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<header class="header" class:scrolled>
	<div class="container bar">
		<a href="/" class="brand" aria-label="Maller&M Propiedades — inicio">
			<img src="/isotipo-blanco.webp" alt="" width="104" height="48" />
			<span class="word"><strong>MALLER &amp; M</strong><small>PROPIEDADES</small></span>
		</a>
		<nav class="desk" aria-label="Principal">
			<ul>
				{#each nav as item (item.href)}
					<li>
						<a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>{item.label}</a>
					</li>
				{/each}
			</ul>
		</nav>
		<div class="actions">
			<a class="btn btn--whatsapp btn--sm wa" href={waLink(whatsapp, 'Hola Maller&M, quiero hacer una consulta.')} target="_blank" rel="noopener">
				<Icon name="whatsapp" /> <span>WhatsApp</span>
			</a>
			<button class="burger" aria-expanded={open} aria-controls="mobile-nav" onclick={() => (open = !open)}>
				<Icon name={open ? 'close' : 'menu'} size={26} />
				<span class="sr-only">{open ? 'Cerrar menú' : 'Abrir menú'}</span>
			</button>
		</div>
	</div>
	<nav id="mobile-nav" class="mobile" class:open aria-label="Menú móvil" hidden={!open}>
		<ul>
			{#each nav as item (item.href)}
				<li>
					<a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>{item.label}</a>
				</li>
			{/each}
		</ul>
		<a class="btn btn--whatsapp btn--block" href={waLink(whatsapp)} target="_blank" rel="noopener">
			<Icon name="whatsapp" /> Escríbenos por WhatsApp
		</a>
	</nav>
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 50;
		background: var(--brand-primary);
		color: #fff;
		transition: box-shadow 0.25s var(--ease);
	}
	.header.scrolled {
		box-shadow: 0 6px 24px rgba(10, 37, 64, 0.25);
	}
	.bar {
		display: flex;
		align-items: center;
		gap: var(--sp-5);
		height: 84px;
		transition: height 0.25s var(--ease);
	}
	.scrolled .bar {
		height: 68px;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
		color: #fff;
		text-decoration: none;
		flex: none;
	}
	.brand img {
		height: 40px;
		width: auto;
		transition: height 0.25s var(--ease);
	}
	.scrolled .brand img {
		height: 34px;
	}
	.word {
		display: flex;
		flex-direction: column;
		line-height: 1;
		font-family: var(--font-heading);
	}
	.word strong {
		font-size: 1.15rem;
		font-weight: 800;
		letter-spacing: 0.02em;
	}
	.word small {
		margin-top: 4px;
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.32em;
		color: var(--brand-gold-light);
	}
	.desk {
		margin-left: auto;
	}
	.desk ul {
		display: flex;
		gap: 2px;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.desk a {
		position: relative;
		display: block;
		padding: 10px 12px;
		color: rgba(255, 255, 255, 0.9);
		text-decoration: none;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 0.82rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		border-radius: 4px;
	}
	.desk a:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.08);
	}
	.desk a[aria-current='page']::after {
		content: '';
		position: absolute;
		left: 12px;
		right: 12px;
		bottom: 2px;
		height: 2px;
		background: var(--brand-gold);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
	}
	.burger {
		display: none;
		background: none;
		border: 0;
		color: #fff;
		padding: 8px;
		cursor: pointer;
		border-radius: 6px;
	}
	.mobile {
		display: none;
	}
	@media (max-width: 1180px) {
		.desk {
			display: none;
		}
		.actions {
			margin-left: auto;
		}
		.burger {
			display: inline-flex;
		}
		.mobile.open {
			display: block;
			position: absolute;
			inset: 100% 0 auto 0;
			height: calc(100dvh - 68px);
			overflow-y: auto;
			background: var(--brand-navy);
			padding: var(--sp-5) var(--gutter) var(--sp-7);
		}
		.mobile ul {
			list-style: none;
			margin: 0 0 var(--sp-6);
			padding: 0;
		}
		.mobile li {
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		}
		.mobile li a {
			display: block;
			padding: 18px 4px;
			color: #fff;
			text-decoration: none;
			font-family: var(--font-heading);
			font-size: 1.25rem;
			font-weight: 700;
		}
		.mobile li a[aria-current='page'] {
			color: var(--brand-gold-light);
		}
	}
	@media (max-width: 520px) {
		.wa span {
			display: none;
		}
		.wa {
			padding: 0 12px;
		}
		.word strong {
			font-size: 1rem;
		}
	}
	:global(body.nav-open) {
		overflow: hidden;
	}
</style>
