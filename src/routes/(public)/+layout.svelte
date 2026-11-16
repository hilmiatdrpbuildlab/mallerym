<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import WhatsAppFloat from '$lib/components/WhatsAppFloat.svelte';

	let { data, children } = $props();
</script>

<a class="skip-link" href="#contenido">Saltar al contenido</a>
<Header whatsapp={data.settings.contact.whatsapp} />
<main id="contenido">
	{@render children()}
</main>
<Footer settings={data.settings} team={data.contactTeam} posts={data.footerPosts} />
<WhatsAppFloat phone={data.settings.contact.whatsapp} />
