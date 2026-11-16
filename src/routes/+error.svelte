<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>{page.status === 404 ? 'Página no encontrada' : 'Error'} | Maller&M Propiedades</title></svelte:head>

<main class="err">
	<a href="/" class="logo"><img src="/isotipo-color.webp" alt="Maller&M Propiedades" width="104" height="48" /></a>
	<p class="code">{page.status}</p>
	<h1>{page.status === 404 ? 'No encontramos esta página' : 'Algo salió mal'}</h1>
	<p>{page.status === 404 ? 'Puede que la propiedad ya no esté publicada o que el enlace haya cambiado.' : page.error?.message}</p>
	<div class="ctas">
		<a class="btn" href="/propiedades/">Ver propiedades</a>
		<a class="btn btn--secondary" href="/">Ir al inicio</a>
	</div>
</main>

<style>
	.err {
		min-height: 100dvh;
		display: grid;
		place-content: center;
		justify-items: center;
		text-align: center;
		padding: var(--sp-6);
		background: var(--surface-alt);
	}
	.logo img {
		height: 48px;
		width: auto;
		margin-bottom: var(--sp-6);
	}
	.code {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 4rem;
		color: var(--brand-gold-ink);
		margin: 0;
		line-height: 1;
	}
	p {
		color: var(--ink-soft);
		max-width: 50ch;
	}
	.ctas {
		display: flex;
		gap: var(--sp-3);
		flex-wrap: wrap;
		justify-content: center;
	}
</style>
