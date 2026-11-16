import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { eq, and, gt } from 'drizzle-orm';
import { dev } from '$app/env';
import { db, schema } from '../db/client';
import { randomToken, sha256Hex, hashIp } from '../security/crypto';
import type { Role } from '$lib/permissions';

// __Host- exige Secure + Path=/ y sin Domain: la cookie no puede ser fijada por subdominios.
export const SESSION_COOKIE = dev ? 'mm_session' : '__Host-mm_session';
const IDLE_MS = 8 * 60 * 60 * 1000; // 8 h de inactividad
const ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días absoluto

export type SessionUser = {
	id: string;
	email: string;
	name: string;
	role: Role;
	mfaEnabled: boolean;
};
export type SessionRecord = {
	id: string;
	expiresAt: Date;
	mfaVerifiedAt: Date | null;
};

export async function createSession(event: RequestEvent, userId: string, mfaVerified = false) {
	const token = randomToken();
	const now = Date.now();
	await db.insert(schema.sessions).values({
		id: sha256Hex(token),
		userId,
		expiresAt: new Date(now + IDLE_MS),
		absoluteExpiresAt: new Date(now + ABSOLUTE_MS),
		mfaVerifiedAt: mfaVerified ? new Date() : null,
		ipHash: await hashIp(event.getClientAddress()),
		userAgent: event.request.headers.get('user-agent')?.slice(0, 200) ?? null
	});
	setSessionCookie(event.cookies, token, new Date(now + IDLE_MS));
	return token;
}

/** Rota el token (anti session-fixation) conservando el usuario. */
export async function rotateSession(
	event: RequestEvent,
	oldSessionId: string,
	userId: string,
	mfaVerified: boolean
) {
	await db.delete(schema.sessions).where(eq(schema.sessions.id, oldSessionId));
	return createSession(event, userId, mfaVerified);
}

export async function validateSession(token: string) {
	if (!/^[a-z2-7]{32}$/.test(token)) return null;
	const id = sha256Hex(token);
	const rows = await db
		.select({
			session: schema.sessions,
			user: {
				id: schema.users.id,
				email: schema.users.email,
				name: schema.users.name,
				role: schema.users.role,
				mfaEnabled: schema.users.mfaEnabled,
				active: schema.users.active
			}
		})
		.from(schema.sessions)
		.innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
		.where(and(eq(schema.sessions.id, id), gt(schema.sessions.expiresAt, new Date())))
		.limit(1);
	const row = rows[0];
	if (!row || !row.user.active || row.session.absoluteExpiresAt < new Date()) {
		if (row) await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
		return null;
	}
	let expiresAt = row.session.expiresAt;
	let refreshed = false;
	// Extensión deslizante, escribiendo como máximo una vez cada ~15 min.
	if (expiresAt.getTime() - Date.now() < IDLE_MS - 15 * 60 * 1000) {
		expiresAt = new Date(Math.min(Date.now() + IDLE_MS, row.session.absoluteExpiresAt.getTime()));
		await db.update(schema.sessions).set({ expiresAt }).where(eq(schema.sessions.id, id));
		refreshed = true;
	}
	const { active: _active, ...user } = row.user;
	return {
		user: user as SessionUser,
		session: { id, expiresAt, mfaVerifiedAt: row.session.mfaVerifiedAt } satisfies SessionRecord,
		refreshed
	};
}

export async function invalidateSession(sessionId: string) {
	await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
}

export async function invalidateUserSessions(userId: string) {
	await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

export function setSessionCookie(cookies: Cookies, token: string, expires: Date) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		expires
	});
}

export function deleteSessionCookie(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/', secure: !dev });
}
