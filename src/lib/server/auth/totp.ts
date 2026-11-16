import { createTOTPKeyURI, verifyTOTPWithGracePeriod } from '@oslojs/otp';
import { renderSVG } from 'uqr';
import { randomToken, sha256Hex } from '../security/crypto';

export function newTotpSecret(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(20));
}

export function totpUri(email: string, secret: Uint8Array) {
	return createTOTPKeyURI('Maller&M CMS', email, secret, 30, 6);
}

/** QR generado localmente (nunca se envía el secreto a servicios externos de QR). */
export function totpQrSvg(uri: string): string {
	return renderSVG(uri, { border: 1 });
}

export function verifyTotp(secret: Uint8Array, code: string): boolean {
	if (!/^\d{6}$/.test(code)) return false;
	return verifyTOTPWithGracePeriod(secret, 30, 6, code, 30);
}

export function newRecoveryCodes(n = 8): string[] {
	return Array.from({ length: n }, () => {
		const t = randomToken(10).toUpperCase();
		return `${t.slice(0, 4)}-${t.slice(4, 8)}-${t.slice(8, 12)}`;
	});
}

export const hashRecoveryCode = (code: string) => sha256Hex(code.trim().toUpperCase());
