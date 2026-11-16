import type { LayoutServerLoad } from './$types';
import { getSettings, getTeam, listPosts } from '$lib/server/content';

export const load: LayoutServerLoad = async ({ setHeaders }) => {
	const [settings, team, footerPosts] = await Promise.all([getSettings(), getTeam(true), listPosts({ limit: 3 })]);
	// HTML público: caché corta en el borde, revalidación rápida tras publicar en el CMS
	setHeaders({ 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' });
	return { settings, contactTeam: team, footerPosts };
};
