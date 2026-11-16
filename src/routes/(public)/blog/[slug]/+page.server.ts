import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPostBySlug, listPosts, mediaMeta } from '$lib/server/content';
import { mediaIdsIn } from '$lib/richtext';
import { can } from '$lib/permissions';

export const load: PageServerLoad = async ({ params, url, locals, setHeaders }) => {
	if (!/^[a-z0-9-]{1,140}$/.test(params.slug)) error(404, 'Artículo no encontrado');
	const preview = url.searchParams.has('preview') && !!locals.session?.mfaVerifiedAt && can(locals.user?.role, 'post:write');
	const post = await getPostBySlug(params.slug, { preview });
	if (!post) error(404, 'Artículo no encontrado');
	if (preview) setHeaders({ 'Cache-Control': 'private, no-store' });
	const [related, images] = await Promise.all([
		listPosts({ categoria: post.categories[0]?.slug, excludeId: post.id, limit: 3 }),
		mediaMeta(mediaIdsIn(post.body))
	]);
	return { post, related, images, preview: preview && post.publishState !== 'published' };
};
