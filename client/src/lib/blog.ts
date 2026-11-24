/**
 * "Cẩm nang" (blog) posts: MDX files in src/content/cam-nang/, one per post.
 * The file name is the slug: src/content/cam-nang/xet-tuyen-la-gi.mdx → /cam-nang/xet-tuyen-la-gi
 *
 * Frontmatter is loaded eagerly (small, needed for lists/meta); each post's
 * content is a separate lazy chunk, so the list page doesn't download every article.
 */
import type { MDXContent } from "mdx/types";
import { type ComponentType, lazy } from "react";
import { type PostFrontmatter, parsePost } from "./blog-schema";

export const BLOG_TITLE = "Cẩm nang tuyển sinh đại học";
export const BLOG_DESCRIPTION =
	"Giải thích dễ hiểu về điểm chuẩn, tổ hợp môn, phương thức xét tuyển và cách chọn trường, chọn ngành cho học sinh THPT.";

export interface PostMeta extends PostFrontmatter {
	slug: string;
}

// "?frontmatter" loads only the YAML block (mdxFrontmatter() in vite.config.ts),
// so post bodies stay out of this eager import.
const frontmatters = import.meta.glob<unknown>("../content/cam-nang/*.mdx", {
	eager: true,
	query: "?frontmatter",
	import: "default",
});

const contentLoaders = import.meta.glob<MDXContent>(
	"../content/cam-nang/*.mdx",
	{ import: "default" },
);

const slugFromPath = (path: string) =>
	path.slice(path.lastIndexOf("/") + 1, -".mdx".length);

/** All visible posts, newest first. Drafts are only included in dev. */
export const posts: PostMeta[] = Object.entries(frontmatters)
	.map(([path, frontmatter]) => {
		const slug = slugFromPath(path);
		return { slug, ...parsePost(slug, frontmatter) };
	})
	.filter((post) => import.meta.env.DEV || !post.draft)
	.sort((a, b) => b.date.localeCompare(a.date));

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

// One lazy component per post, created once so React keeps the same identity.
const contentCache = new Map<
	string,
	ComponentType<Parameters<MDXContent>[0]>
>();

/** The post body as a lazy component (render it inside <Suspense>). */
export function getPostContent(slug: string) {
	let Content = contentCache.get(slug);
	if (!Content) {
		const load = contentLoaders[`../content/cam-nang/${slug}.mdx`];
		Content = lazy(async () => ({ default: await load() }));
		contentCache.set(slug, Content);
	}
	return Content;
}

/** "2026-11-24" → "24 tháng 11, 2026" (fixed time zone so server and browser agree). */
export function formatPostDate(isoDate: string) {
	return new Intl.DateTimeFormat("vi-VN", {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "Asia/Ho_Chi_Minh",
	}).format(new Date(`${isoDate}T00:00:00+07:00`));
}
