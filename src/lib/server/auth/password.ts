import { encodeBase64, decodeBase64, encodeHexUpperCase } from '@oslojs/encoding';
import { sha1 } from '@oslojs/crypto/sha1';
import { timingSafeEqual } from '../security/crypto';

/*
 * Cloudflare Workers no permite argon2 nativo ni compilar WASM en tiempo de ejecución, por lo que
 * usamos PBKDF2-HMAC-SHA256 de WebCrypto con 100.000 iteraciones (máximo admitido por Workers).
 * El formato guarda algoritmo e iteraciones para poder migrar a argon2id (rehash al iniciar sesión).
 */
const ITERATIONS = 100_000;
const enc = new TextEncoder();

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey(
		'raw',
		enc.encode(password.normalize('NFKC')),
		'PBKDF2',
		false,
		['deriveBits']
	);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
		key,
		256
	);
	return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hash = await derive(password, salt, ITERATIONS);
	return `pbkdf2_sha256$${ITERATIONS}$${encodeBase64(salt)}$${encodeBase64(hash)}`;
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
	const [alg, iter, salt, expected] = hash.split('$');
	if (alg !== 'pbkdf2_sha256') return false;
	const actual = await derive(password, decodeBase64(salt), Number(iter));
	return timingSafeEqual(actual, decodeBase64(expected));
}

/** Hash ficticio para igualar tiempos cuando el usuario no existe (evita enumeración). */
export const DUMMY_HASH =
	'pbkdf2_sha256$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

export function passwordPolicyError(password: string): string | null {
	if (password.length < 12) return 'La contraseña debe tener al menos 12 caracteres.';
	if (password.length > 128) return 'La contraseña es demasiado larga.';
	return null;
}

/** Have I Been Pwned (k-anonymity): solo se envían los 5 primeros caracteres del SHA-1. Falla abierto. */
export async function isPwnedPassword(password: string): Promise<boolean> {
	try {
		const hex = encodeHexUpperCase(sha1(enc.encode(password)));
		const res = await fetch(`https://api.pwnedpasswords.com/range/${hex.slice(0, 5)}`, {
			headers: { 'Add-Padding': 'true' },
			signal: AbortSignal.timeout(2500)
		});
		if (!res.ok) return false;
		const body = await res.text();
		return body.split('\n').some((line) => {
			const [suffix, count] = line.trim().split(':');
			return suffix === hex.slice(5) && Number(count) > 0;
		});
	} catch {
		return false;
	}
}
