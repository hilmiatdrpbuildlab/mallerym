<script lang="ts">
	import { page } from '$app/state';
	import { waLink } from '$lib/format';
	import Icon from './Icon.svelte';

	let { phone }: { phone: string } = $props();

	// Mensaje distinto según la página (plan A.1: "Floating WhatsApp dengan pesan per halaman")
	const text = $derived.by(() => {
		const p = page.url.pathname;
		const t = (page.data as { waText?: string }).waText;
		if (t) return t;
		if (p.startsWith('/servicios/venta')) return 'Hola, quiero vender mi propiedad. ¿Podemos conversar?';
		if (p.startsWith('/servicios/arriendo')) return 'Hola, quiero información sobre arriendos.';
		if (p.startsWith('/servicios/diseno') || p.startsWith('/blog')) return 'Hola, me interesa una asesoría de diseño de interiores.';
		if (p.startsWith('/propiedades')) return 'Hola, estoy buscando una propiedad en la costa. ¿Me pueden ayudar?';
		return 'Hola Maller&M, quiero hacer una consulta.';
	});
</script>

<a class="wa-float" href={waLink(phone, text)} target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">
	<Icon name="whatsapp" size={30} />
</a>

<style>
	.wa-float {
		position: fixed;
		right: max(16px, env(safe-area-inset-right));
		bottom: max(16px, env(safe-area-inset-bottom));
		z-index: 40;
		display: grid;
		place-items: center;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: var(--whatsapp);
		color: #fff;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
		transition: transform 0.2s var(--ease);
	}
	.wa-float:hover {
		transform: scale(1.06);
		color: #fff;
	}
	@media (max-width: 1000px) {
		:global(body.sticky-cta) .wa-float {
			bottom: 84px;
		}
	}
</style>
