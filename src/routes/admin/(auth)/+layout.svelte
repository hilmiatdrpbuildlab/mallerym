<script lang="ts">
	import { PUBLIC_MFA_REQUIRED } from '$app/env/public';
	import '$lib/design/admin.css';
	import Icon from '$lib/components/Icon.svelte';
	let { children } = $props();
</script>

<svelte:head><meta name="robots" content="noindex, nofollow" /></svelte:head>

<div class="auth">
	<div class="box">
		<div class="brand">
			<img src="/isotipo-color.webp" alt="" width="104" height="48" />
			<div><strong>Maller&amp;M</strong><span>Panel de administración</span></div>
		</div>
		{@render children()}
	</div>
	<p class="foot"><Icon name="shield" size={14} /> Conexión cifrada · {PUBLIC_MFA_REQUIRED ? 'MFA obligatorio · ' : ''}Acceso registrado</p>
</div>

<style>
	.auth {
		min-height: 100dvh;
		display: grid;
		place-content: center;
		gap: var(--sp-4);
		padding: var(--sp-5);
		background:
			radial-gradient(circle at 20% 10%, rgba(191, 160, 86, 0.18), transparent 40%),
			linear-gradient(160deg, #134657 0%, #131c2c 70%);
	}
	.box {
		width: min(440px, calc(100vw - 32px));
		background: #fff;
		border-radius: 14px;
		padding: clamp(24px, 5vw, 40px);
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
	}
	.brand {
		display: flex;
		gap: 12px;
		align-items: center;
		margin-bottom: var(--sp-6);
	}
	.brand img {
		height: 36px;
		width: auto;
	}
	.brand div {
		display: grid;
		line-height: 1.2;
	}
	.brand strong {
		font-family: var(--font-heading);
		font-size: 1.15rem;
	}
	.brand span {
		font-size: 0.82rem;
		color: var(--ink-muted);
	}
	.foot {
		display: flex;
		gap: 6px;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.75);
		font-size: 0.8rem;
		margin: 0;
	}
	.auth :global(h1) {
		font-size: 1.4rem;
		margin-bottom: var(--sp-2);
	}
	.auth :global(.sub) {
		color: var(--ink-muted);
		font-size: 0.92rem;
		margin-bottom: var(--sp-5);
	}
	.auth :global(form) {
		display: grid;
		gap: var(--sp-4);
	}
</style>
