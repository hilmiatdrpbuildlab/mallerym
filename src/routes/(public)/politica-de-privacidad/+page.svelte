<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHero from '$lib/components/PageHero.svelte';

	let { data } = $props();
</script>

<Seo title="Política de privacidad" description="Cómo Maller&M Propiedades trata los datos personales que recibe a través de su sitio web (Ley 19.628 y Ley 21.719)." />

<PageHero title="Política de privacidad" crumbs={[{ href: '/', label: 'Inicio' }, { label: 'Política de privacidad' }]} />

<section class="section">
	<div class="container">
		<div class="prose">
			<p class="note">Borrador para la demo — debe ser revisado por un asesor legal chileno antes de publicarse.</p>
			<h2>Responsable</h2>
			<p>Maller&amp;M Propiedades, {data.settings.contact.address} Contacto: {data.settings.contact.email}.</p>
			<h2>Qué datos recopilamos</h2>
			<ul>
				<li>Los datos que nos entregas en los formularios: nombre, apellidos, correo, teléfono, medio de contacto preferido, comuna y mensaje.</li>
				<li>La propiedad o servicio por el que consultas y la página desde la que nos escribes.</li>
				<li>Un identificador seudonimizado (hash) de tu dirección IP, usado solo para prevenir abuso. No guardamos tu IP real.</li>
			</ul>
			<h2>Para qué los usamos</h2>
			<p>Exclusivamente para responder tu consulta y gestionar la compra, venta o arriendo que solicites. No vendemos ni cedemos tus datos a terceros.</p>
			<h2>Base de licitud y conservación</h2>
			<p>Tratamos tus datos con tu consentimiento expreso (casilla del formulario). Los conservamos mientras exista una relación comercial y, como máximo, 24 meses desde el último contacto; luego se anonimizan automáticamente.</p>
			<h2>Proveedores</h2>
			<ul>
				<li>Cloudflare (alojamiento, protección anti-bots con Turnstile).</li>
				<li>Neon (base de datos, cifrada en tránsito y en reposo).</li>
				<li>Google Maps solo si decides cargar el mapa.</li>
			</ul>
			<h2>Tus derechos</h2>
			<p>Puedes solicitar acceso, rectificación, supresión, oposición y portabilidad de tus datos escribiendo a {data.settings.contact.email}, conforme a la Ley N° 19.628 y la Ley N° 21.719.</p>
			<h2>Cookies</h2>
			<p>El sitio público no usa cookies de seguimiento ni publicidad. El panel interno usa una cookie de sesión estrictamente necesaria.</p>
		</div>
	</div>
</section>

<style>
	.note {
		padding: var(--sp-3) var(--sp-4);
		background: var(--warning-bg);
		color: var(--warning);
		border-radius: var(--radius-btn);
	}
</style>
