import { sql } from 'drizzle-orm';
import { db } from '../db/client';

/**
 * Límite de ventana fija almacenado en Postgres (complementa las reglas de Cloudflare en el borde).
 * Devuelve true si la petición está permitida.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
	const result = await db.execute(sql`
		INSERT INTO rate_limits (key, count, reset_at)
		VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
		ON CONFLICT (key) DO UPDATE SET
			count = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
			reset_at = CASE WHEN rate_limits.reset_at < now()
				THEN now() + make_interval(secs => ${windowSeconds}) ELSE rate_limits.reset_at END
		RETURNING count`);
	const count = Number((result.rows[0] as { count: number } | undefined)?.count ?? 0);
	return count <= limit;
}
