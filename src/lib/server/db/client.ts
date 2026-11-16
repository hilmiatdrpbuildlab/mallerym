import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { DATABASE_URL } from '$app/env/private';
import * as schema from './schema';

// Driver HTTP: sin conexiones persistentes, ideal para Workers. Todas las consultas van parametrizadas.
export const db = drizzle(neon(DATABASE_URL), { schema });
export { schema };
