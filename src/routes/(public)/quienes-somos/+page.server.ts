import type { PageServerLoad } from './$types';
import { getBlocks, getTeam } from '$lib/server/content';

export const load: PageServerLoad = async () => {
	const [blocks, team] = await Promise.all([getBlocks('quienes-somos'), getTeam()]);
	return { blocks, team };
};
