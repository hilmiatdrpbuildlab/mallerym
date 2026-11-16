import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { defineConfig } from 'vite';

export default defineConfig({
	// Las fuentes nunca se incrustan como data: URI (CSP font-src 'self' las bloquearía)
	build: { assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined) },
	plugins: [
		sveltekit({
			adapter: adapter(),
			alias: { $lib: 'src/lib' },
			// SvelteKit 3: la verificación de Origin en form actions está siempre activa (sin trustedOrigins extra).
			csrf: { trustedOrigins: [] },
			csp: {
				// 'hash': cada script inline de SvelteKit se autoriza por su SHA-256 → el HTML público puede cachearse en el borde sin reutilizar nonces
				mode: 'hash',
				directives: {
					'default-src': ['none'],
					'script-src': ['self', 'https://challenges.cloudflare.com'],
					// Rencana E.2: hanya style-src yang dilonggarkan (atribut style dari Svelte/Turnstile).
					// Scripts siguen estrictos: sin unsafe-inline / unsafe-eval; hashes automáticos de SvelteKit.
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'blob:'],
					'font-src': ['self'],
					'connect-src': ['self', 'https://challenges.cloudflare.com'],
					'frame-src': ['https://challenges.cloudflare.com', 'https://www.google.com'],
					'form-action': ['self'],
					'frame-ancestors': ['none'],
					'base-uri': ['none'],
					'object-src': ['none'],
					'manifest-src': ['self'],
					'worker-src': ['self'],
					'upgrade-insecure-requests': true
				}
			}
		})
	]
});
