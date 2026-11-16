import { defineEnvVars } from '@sveltejs/kit/env';

const required = (name: string) => (value: string | undefined) => {
	if (!value) throw new Error(`Falta la variable de entorno ${name}`);
	return value;
};

export const variables = defineEnvVars({
	DATABASE_URL: { schema: required('DATABASE_URL'), description: 'Cadena de conexión Neon (rol de la app)' },
	MFA_ENCRYPTION_KEY: {
		schema: required('MFA_ENCRYPTION_KEY'),
		description: 'Clave AES-256-GCM (base64, 32 bytes) para cifrar secretos TOTP'
	},
	IP_HASH_KEY: { schema: required('IP_HASH_KEY'), description: 'Clave HMAC para seudonimizar IPs' },
	TURNSTILE_SECRET_KEY: {
		schema: (v) => v || '1x0000000000000000000000000000000AA',
		description: 'Secreto de Cloudflare Turnstile (por defecto: clave de prueba)'
	},
	PUBLIC_TURNSTILE_SITE_KEY: {
		public: true,
		schema: (v) => v || '1x00000000000000000000AA',
		description: 'Site key pública de Turnstile'
	},
	PUBLIC_MFA_REQUIRED: {
		public: true,
		schema: (v) => v !== 'false',
		description: 'MFA (TOTP) obligatorio en el panel. Demo: "false"; producción: "true" (por defecto)'
	},
	PUBLIC_SITE_URL: {
		public: true,
		schema: (v) => (v || 'http://localhost:5173').replace(/\/$/, ''),
		description: 'URL canónica del sitio'
	}
});
