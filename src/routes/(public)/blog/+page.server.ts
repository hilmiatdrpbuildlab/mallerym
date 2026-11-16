import type { PageServerLoad } from './$types';
import { listPosts, listPostCategories } from '$lib/server/content';

export const load: PageServerLoad = async ({ url }) => {
	const raw = url.searchParams.get('categoria') ?? '';
	const categoria = /^[a-z-]{2,40}$/.test(raw) ? raw : undefined;
	const [posts, categories] = await Promise.all([listPosts({ categoria }), listPostCategories()]);
	return { posts, categories, categoria };
};
