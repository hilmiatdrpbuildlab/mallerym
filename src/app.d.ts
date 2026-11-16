import type { SessionUser, SessionRecord } from '$lib/server/auth/session';

declare global {
	namespace App {
		interface Locals {
			user: SessionUser | null;
			session: SessionRecord | null;
		}
		interface Platform {
			env: Record<string, unknown>;
			ctx: ExecutionContext;
			caches: CacheStorage & { default: Cache };
			cf?: IncomingRequestCfProperties;
		}
	}
}

export {};
