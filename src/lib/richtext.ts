/*
 * Texto estructurado (Markdown limitado) — reemplaza el HTML libre del page builder antiguo.
 * Lista blanca: párrafos, ## H2, ### H3, listas "- ", **negrita**, *cursiva*, [enlace](https://…)
 * e imágenes de la biblioteca ![alt](/media/<uuid>). Todo se escapa ANTES de aplicar formato,
 * por lo que es imposible inyectar HTML o scripts desde el CMS.
 */

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

const SAFE_URL = /^(https:\/\/|http:\/\/|\/(?!\/)|mailto:|tel:)/i;
const MEDIA_ID = /^\/media\/([0-9a-f-]{36})\/?$/i;

function inline(text: string): string {
	let s = escapeHtml(text);
	s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
	s = s.replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>');
	s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, rawUrl: string) => {
		const url = rawUrl.replace(/&amp;/g, '&');
		if (!SAFE_URL.test(url)) return label;
		const external = /^https?:\/\//i.test(url);
		return `<a href="${escapeHtml(url)}"${external ? ' target="_blank" rel="noopener noreferrer nofollow"' : ''}>${label}</a>`;
	});
	return s;
}

export type RichImage = { id: string; width?: number | null; height?: number | null };

export function renderRichText(src: string | null | undefined, images: Record<string, RichImage> = {}): string {
	if (!src) return '';
	const lines = src.replace(/\r\n?/g, '\n').split('\n');
	const out: string[] = [];
	let para: string[] = [];
	let list: string[] = [];

	const flushPara = () => {
		if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`);
		para = [];
	};
	const flushList = () => {
		if (list.length) out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`);
		list = [];
	};

	for (const raw of lines) {
		const line = raw.trim();
		if (!line) {
			flushPara();
			flushList();
			continue;
		}
		let m: RegExpMatchArray | null;
		if ((m = line.match(/^(#{2,3})\s+(.+)$/))) {
			flushPara();
			flushList();
			const tag = m[1].length === 2 ? 'h2' : 'h3';
			out.push(`<${tag}>${inline(m[2])}</${tag}>`);
		} else if ((m = line.match(/^[-•]\s+(.+)$/))) {
			flushPara();
			list.push(m[1]);
		} else if ((m = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/))) {
			flushPara();
			flushList();
			const idm = m[2].match(MEDIA_ID);
			if (idm) {
				const id = idm[1];
				const meta = images[id];
				const dims = meta?.width && meta?.height ? ` width="${meta.width}" height="${meta.height}"` : '';
				out.push(
					`<figure><img src="/media/${id}/1600.webp" srcset="/media/${id}/640.webp 640w, /media/${id}/1600.webp 1600w" sizes="(min-width: 800px) 720px, 100vw" alt="${escapeHtml(m[1])}" loading="lazy" decoding="async"${dims}>${m[1] ? `<figcaption>${escapeHtml(m[1])}</figcaption>` : ''}</figure>`
				);
			}
		} else {
			flushList();
			para.push(line);
		}
	}
	flushPara();
	flushList();
	return out.join('\n');
}

export function plainText(src: string | null | undefined, max = 160): string {
	if (!src) return '';
	const t = src
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/[#*>-]+\s?/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	return t.length > max ? t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…' : t;
}

export function mediaIdsIn(src: string | null | undefined): string[] {
	if (!src) return [];
	return [...src.matchAll(/!\[[^\]]*\]\(\/media\/([0-9a-f-]{36})\/?\)/gi)].map((m) => m[1]);
}
