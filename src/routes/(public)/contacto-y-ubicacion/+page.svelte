<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import LeadForm from '$lib/components/LeadForm.svelte';
	import MapEmbed from '$lib/components/MapEmbed.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { waLink, phoneDigits } from '$lib/format';

	let { data, form } = $props();
	const c = $derived(data.settings.contact);
</script>

<Seo
	title="Contacto y ubicación"
	description="Contáctanos por WhatsApp, teléfono o formulario. Estamos en Camino Antiguo a Maitencillo, Condominios Las Hermanas, El Mirador parcela 7."
/>

<PageHero
	eyebrow="Contacto directo"
	title="Hablemos de tu próxima propiedad"
	lead="Si estás buscando invertir o cambiar de aire, hablemos. Estamos para ayudarte."
	crumbs={[{ href: '/', label: 'Inicio' }, { label: 'Contacto y ubicación' }]}
/>

<section class="section">
	<div class="container cols">
		<div class="form-card">
			<h2>Escríbenos</h2>
			<p class="sub">Respondemos dentro de 24 horas hábiles por el medio que prefieras.</p>
			<LeadForm form={form as any} action="?/lead" variant="full" type={data.motivo} defaultMessage={data.mensaje} idPrefix="ct" />
		</div>
		<div class="info">
			<div class="quick">
				<a class="btn btn--whatsapp btn--block" href={waLink(c.whatsapp, 'Hola Maller&M, quiero hacer una consulta.')} target="_blank" rel="noopener"
					><Icon name="whatsapp" /> WhatsApp {c.whatsapp}</a
				>
				{#each c.phones as ph (ph)}
					<a class="btn btn--secondary btn--block" href="tel:+{phoneDigits(ph)}"><Icon name="phone" /> {ph}</a>
				{/each}
				{#if c.email}<a class="mail" href="mailto:{c.email}"><Icon name="mail" size={18} /> {c.email}</a>{/if}
			</div>
			<div class="addr">
				<h2>Nuestra ubicación</h2>
				<p><Icon name="pin" size={18} /> {c.address}</p>
				{#if c.hours}<p><Icon name="clock" size={18} /> {c.hours}</p>{/if}
			</div>
			<MapEmbed query={c.mapQuery} zoom={14} label="Oficina Maller&M — Maitencillo" />
			<div class="team">
				<h2>Contacto directo</h2>
				<ul>
					{#each data.contactTeam as m (m.id)}
						<li>
							<div><strong>{m.name}</strong><span>{m.role}</span></div>
							{#if m.phone}<a href={waLink(m.phone)} target="_blank" rel="noopener" aria-label="WhatsApp de {m.name}"><Icon name="whatsapp" /></a>{/if}
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</section>

<style>
	.cols {
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
		gap: clamp(32px, 5vw, 80px);
		align-items: start;
	}
	@media (max-width: 900px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
	.form-card {
		padding: clamp(20px, 3vw, 40px);
		border: 1px solid var(--line);
		border-radius: 10px;
		box-shadow: var(--shadow-card);
	}
	.form-card h2,
	.info h2 {
		font-size: 1.35rem;
	}
	.sub {
		color: var(--ink-soft);
	}
	.info {
		display: grid;
		gap: var(--sp-6);
	}
	.quick {
		display: grid;
		gap: var(--sp-2);
	}
	.mail {
		display: inline-flex;
		gap: 8px;
		align-items: center;
		justify-content: center;
		padding: 8px;
	}
	.addr p {
		display: flex;
		gap: 8px;
		color: var(--ink-soft);
	}
	.addr :global(svg) {
		flex: none;
		margin-top: 4px;
		color: var(--brand-primary);
	}
	.team ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--sp-2);
	}
	.team li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--sp-3) var(--sp-4);
		border-radius: var(--radius-btn);
		background: var(--surface-sand);
	}
	.team li div {
		display: grid;
	}
	.team li span {
		font-size: var(--fs-small);
		color: var(--ink-muted);
	}
	.team li a {
		display: grid;
		place-items: center;
		width: 42px;
		height: 42px;
		border-radius: 50%;
		background: var(--whatsapp);
		color: #fff;
	}
</style>
