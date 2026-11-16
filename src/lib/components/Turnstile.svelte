<script lang="ts" module>
	declare global {
		interface Window {
			turnstile?: {
				render: (el: HTMLElement, opts: Record<string, unknown>) => string;
				reset: (id?: string) => void;
				remove: (id: string) => void;
			};
		}
	}
	let loader: Promise<void> | null = null;
	function loadScript() {
		if (window.turnstile) return Promise.resolve();
		loader ??= new Promise<void>((resolve, reject) => {
			const s = document.createElement('script');
			s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			s.async = true;
			s.onload = () => resolve();
			s.onerror = () => reject(new Error('turnstile'));
			document.head.appendChild(s);
		});
		return loader;
	}
</script>

<script lang="ts">
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$app/env/public';
	import { onMount } from 'svelte';

	let { action = 'form', resetKey = 0 }: { action?: string; resetKey?: number } = $props();
	let el: HTMLDivElement;
	let widgetId: string | null = null;
	let failed = $state(false);

	onMount(() => {
		let cancelled = false;
		loadScript()
			.then(() => {
				if (cancelled || !window.turnstile) return;
				widgetId = window.turnstile.render(el, {
					sitekey: PUBLIC_TURNSTILE_SITE_KEY,
					action,
					theme: 'light',
					language: 'es',
					appearance: 'interaction-only'
				});
			})
			.catch(() => (failed = true));
		return () => {
			cancelled = true;
			if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
		};
	});

	$effect(() => {
		resetKey;
		if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
	});
</script>

<div class="ts" bind:this={el}></div>
{#if failed}
	<p class="alert alert--warning">No se pudo cargar la verificación anti-bot. Revisa tu conexión o desactiva bloqueadores para este sitio.</p>
{/if}

<style>
	.ts:empty {
		display: none;
	}
</style>
