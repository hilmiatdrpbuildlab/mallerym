<script lang="ts">
	import Picture from './Picture.svelte';
	import Icon from './Icon.svelte';
	import { waLink, phoneDigits } from '$lib/format';

	let {
		m,
		showBio = false
	}: {
		m: { name: string; role: string; bio?: string; phone: string | null; email: string | null; photoId: string | null };
		showBio?: boolean;
	} = $props();
</script>

<article class="tm">
	<div class="photo">
		{#if m.photoId}
			<Picture media={{ id: m.photoId, width: 908, height: 1100 }} alt="Retrato de {m.name}" sizes="(min-width: 900px) 300px, 50vw" />
		{/if}
	</div>
	<div class="info">
		<h3>{m.name}</h3>
		<p class="role">{m.role}</p>
		{#if showBio && m.bio}<p class="bio">{m.bio}</p>{/if}
		<div class="contact">
			{#if m.phone}
				<a class="btn btn--whatsapp btn--sm" href={waLink(m.phone, `Hola ${m.name.split(' ')[0]}, te escribo desde el sitio web.`)} target="_blank" rel="noopener"
					><Icon name="whatsapp" size={16} /> WhatsApp</a
				>
				<a class="btn btn--secondary btn--sm" href="tel:+{phoneDigits(m.phone)}"><Icon name="phone" size={16} /> Llamar</a>
			{/if}
			{#if m.email}
				<a class="mail" href="mailto:{m.email}"><Icon name="mail" size={16} /> {m.email}</a>
			{/if}
		</div>
	</div>
</article>

<style>
	.tm {
		display: flex;
		flex-direction: column;
		background: #fff;
		border: 1px solid var(--line);
		border-radius: var(--radius-card);
		overflow: hidden;
		height: 100%;
	}
	.photo {
		aspect-ratio: 4 / 4.4;
		background: var(--surface-alt);
		overflow: hidden;
	}
	.photo :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 50% 20%;
	}
	.info {
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
		padding: var(--sp-5);
		flex: 1;
	}
	h3 {
		font-size: 1.2rem;
		margin: 0;
	}
	.role {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 0.85rem;
		color: var(--brand-gold-ink);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.bio {
		margin: var(--sp-2) 0 0;
		font-size: 0.95rem;
		color: var(--ink-soft);
	}
	.contact {
		display: flex;
		flex-wrap: wrap;
		gap: var(--sp-2);
		margin-top: auto;
		padding-top: var(--sp-4);
	}
	.mail {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.9rem;
		flex-basis: 100%;
		overflow-wrap: anywhere;
	}
</style>
