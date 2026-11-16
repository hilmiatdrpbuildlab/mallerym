import type { PageServerLoad } from './$types';
import { getServices } from '$lib/server/content';

export const load: PageServerLoad = async () => ({ services: await getServices() });
