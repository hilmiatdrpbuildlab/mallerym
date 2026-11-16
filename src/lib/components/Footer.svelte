<script lang="ts">
	import type { SiteSettings, PostCard } from '$lib/server/content';
	import { waLink, phoneDigits, fmtDateShort } from '$lib/format';
	import Icon from './Icon.svelte';

	let {
		settings,
		team,
		posts
	}: {
		settings: SiteSettings;
		team: { id: string; name: string; role: string; phone: string | null; email: string | null }[];
		posts: PostCard[];
	} = $props();
	const c = $derived(settings.contact);
	const social = $derived(settings.social);
</script>

<section class="call" aria-label="Llámanos">
	<div class="container call-inner">
		<p class="call-label">Llámanos</p>
		<div class="phones">
			{#each c.phones as ph (ph)}
				<a href="tel:+{phoneDigits(ph)}">{ph}</a>
			{/each}
		</div>
		<a class="btn btn--light" href={waLink(c.whatsapp)} target="_blank" rel="noopener"><Icon name="whatsapp" /> WhatsApp</a>
	</div>
</section>

<footer class="footer">
	<div class="container grid-f">
		<div class="col brand-col">
			<a href="/" class="brand" aria-label="Maller&M Propiedades — inicio">
				<img src="/logo-blanco.webp" alt="Maller & M Propiedades" width="110" height="97" loading="lazy" />
			</a>
			<p>Corredora de propiedades en Maitencillo. Compra, venta y arriendo desde Papudo a Valparaíso, con asesoría legal y diseño de interiores.</p>
			<ul class="social" aria-label="Redes sociales">
				<li><a href={waLink(c.whatsapp)} target="_blank" rel="noopener" aria-label="WhatsApp"><Icon name="whatsapp" /></a></li>
				{#if social.instagram}<li><a href={social.instagram} target="_blank" rel="noopener" aria-label="Instagram"><Icon name="instagram" /></a></li>{/if}
				{#if social.facebook}<li><a href={social.facebook} target="_blank" rel="noopener" aria-label="Facebook"><Icon name="facebook" /></a></li>{/if}
				{#if social.linkedin}<li><a href={social.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn"><Icon name="linkedin" /></a></li>{/if}
			</ul>
		</div>
		<div class="col">
			<h2>Nuestra ubicación</h2>
			<p class="with-icon"><Icon name="pin" size={18} /> <span>{c.address}</span></p>
			{#if c.hours}<p class="with-icon"><Icon name="clock" size={18} /> <span>{c.hours}</span></p>{/if}
			<a class="more" href="/contacto-y-ubicacion/">Ver mapa →</a>
		</div>
		<div class="col">
			<h2>Contacto directo</h2>
			<ul class="team">
				{#each team as m (m.id)}
					<li>
						<strong>{m.name}</strong>
						<span>{m.role}</span>
						{#if m.phone}<a href="tel:+{phoneDigits(m.phone)}">{m.phone}</a>{/if}
						{#if m.email}<a href="mailto:{m.email}">{m.email}</a>{/if}
					</li>
				{/each}
			</ul>
		</div>
		<div class="col">
			<h2>Últimos artículos</h2>
			<ul class="posts">
				{#each posts as p (p.id)}
					<li>
						<a href="/blog/{p.slug}/">{p.title}</a>
						<time datetime={p.publishedAt}>{fmtDateShort(p.publishedAt)}</time>
					</li>
				{/each}
			</ul>
		</div>
	</div>
	<div class="container legal">
		<p>© {new Date().getFullYear()} Maller&amp;M Propiedades. Todos los derechos reservados.</p>
		<nav aria-label="Legal">
			<a href="/politica-de-privacidad/">Política de privacidad</a>
			<a href="/sitemap.xml">Mapa del sitio</a>
		</nav>
	</div>
</footer>

<style>
	.call {
		background: var(--brand-primary);
		color: #fff;
		padding-block: var(--sp-6);
	}
	.call-inner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: var(--sp-4) var(--sp-6);
		text-align: center;
	}
	.call-label {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--brand-gold-light);
		font-size: 0.85rem;
	}
	.phones {
		display: flex;
		flex-wrap: wrap;
		gap: var(--sp-2) var(--sp-5);
		justify-content: center;
	}
	.phones a {
		color: #fff;
		text-decoration: none;
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: clamp(1.4rem, 1.1rem + 1.3vw, 2rem);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.01em;
	}
	.phones a:hover {
		color: var(--brand-gold-light);
	}
	.footer {
		background: var(--footer);
		color: #d6d6d6;
		padding-top: var(--sp-8);
		font-size: 0.95rem;
	}
	.grid-f {
		display: grid;
		gap: var(--sp-7) var(--sp-6);
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr));
		padding-bottom: var(--sp-7);
	}
	h2 {
		color: #fff;
		font-size: 0.85rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		margin-bottom: var(--sp-4);
	}
	.brand img {
		width: 110px;
		height: auto;
		margin-bottom: var(--sp-4);
	}
	.footer a {
		color: #fff;
	}
	.with-icon {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}
	.with-icon :global(svg) {
		flex: none;
		margin-top: 3px;
		color: var(--brand-gold-light);
	}
	.more {
		font-weight: 700;
		text-decoration: none;
	}
	.social {
		display: flex;
		gap: var(--sp-2);
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.social a {
		display: grid;
		place-items: center;
		width: 42px;
		height: 42px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.08);
		color: #fff;
		transition: background 0.2s;
	}
	.social a:hover {
		background: var(--brand-gold);
		color: var(--brand-navy);
	}
	.team,
	.posts {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--sp-4);
	}
	.team li {
		display: grid;
		gap: 2px;
	}
	.team strong {
		color: #fff;
	}
	.team span {
		font-size: var(--fs-small);
		color: #b5b5b5;
	}
	.team a {
		text-decoration: none;
		font-size: 0.92rem;
		overflow-wrap: anywhere;
	}
	.posts li {
		display: grid;
		gap: 2px;
	}
	.posts a {
		text-decoration: none;
		font-weight: 700;
		line-height: 1.35;
	}
	.posts a:hover,
	.team a:hover {
		color: var(--brand-gold-light);
	}
	.posts time {
		font-size: var(--fs-xs);
		color: #a8a8a8;
	}
	.legal {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--sp-3);
		padding-block: var(--sp-5);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		font-size: var(--fs-small);
		color: #a8a8a8;
	}
	.legal p {
		margin: 0;
	}
	.legal nav {
		display: flex;
		gap: var(--sp-5);
	}
	.legal a {
		color: #d6d6d6;
	}
</style>
