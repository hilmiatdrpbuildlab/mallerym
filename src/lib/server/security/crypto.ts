import {
	encodeBase64,
	decodeBase64,
	encodeHexLowerCase,
	encodeBase32LowerCaseNoPadding
} from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import { IP_HASH_KEY, MFA_ENCRYPTION_KEY } from '$app/env/private';

const enc = new TextEncoder();

export function randomToken(bytes = 20): string {
	const b = new Uint8Array(bytes);
	crypto.getRandomValues(b);
	return encodeBase32LowerCaseNoPadding(b);
}

export function sha256Hex(input: string): string {
	return encodeHexLowerCase(sha256(enc.encode(input)));
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}

let hmacKey: Promise<CryptoKey> | null = null;
/** Seudonimiza IPs con HMAC: permite detectar abuso sin guardar la IP real. */
export async function hashIp(ip: string | null | undefined): Promise<string | null> {
	if (!ip) return null;
	hmacKey ??= crypto.subtle.importKey(
		'raw',
		enc.encode(IP_HASH_KEY),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', await hmacKey, enc.encode(ip));
	return encodeHexLowerCase(new Uint8Array(sig)).slice(0, 32);
}

let aesKey: Promise<CryptoKey> | null = null;
function getAesKey() {
	aesKey ??= crypto.subtle.importKey('raw', decodeBase64(MFA_ENCRYPTION_KEY) as BufferSource, 'AES-GCM', false, [
		'encrypt',
		'decrypt'
	]);
	return aesKey;
}

/** AES-256-GCM. Formato: base64(iv).base64(ciphertext) */
export async function encryptSecret(data: Uint8Array): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await getAesKey(), data as BufferSource);
	return `${encodeBase64(iv)}.${encodeBase64(new Uint8Array(ct))}`;
}

export async function decryptSecret(payload: string): Promise<Uint8Array> {
	const [iv, ct] = payload.split('.');
	const pt = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: decodeBase64(iv) as BufferSource },
		await getAesKey(),
		decodeBase64(ct) as BufferSource
	);
	return new Uint8Array(pt);
}
