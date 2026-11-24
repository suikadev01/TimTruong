/**
 * Frontmatter schema for "Cẩm nang" posts (src/content/cam-nang/*.mdx).
 *
 * Shared by the app (src/lib/blog.ts) and the build (scripts/generate-sitemap.ts),
 * so a post with missing/invalid frontmatter fails `bun run build`.
 * Keep this file free of Vite-only APIs (import.meta.glob): the build script
 * runs it with plain Bun.
 */
import { z } from "zod";

/** YAML turns an unquoted 2026-11-24 into a Date; normalize back to "YYYY-MM-DD". */
const isoDate = z.preprocess(
	(v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
	z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "phải có dạng YYYY-MM-DD"),
);

export const postFrontmatterSchema = z.object({
	/** Page title and <h1>. ~50–60 characters, with the main keyword. */
	title: z.string().min(1),
	/** Meta description and list excerpt. ~150–160 characters. */
	description: z.string().min(1),
	/** Publish date, YYYY-MM-DD. */
	date: isoDate,
	/** Last significant update, YYYY-MM-DD. */
	updated: isoDate.optional(),
	/** Share image: a path under public/ (e.g. "/cam-nang/x/cover.png") or a full URL. Defaults to og-image.png. */
	image: z.string().optional(),
	/** Drafts are visible in `bun run dev` only. */
	draft: z.boolean().default(false),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

/** The file name is the URL slug: lowercase ASCII, digits and hyphens. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Validates one post; throws a readable error naming the file. */
export function parsePost(slug: string, frontmatter: unknown): PostFrontmatter {
	if (!SLUG_PATTERN.test(slug)) {
		throw new Error(
			`[cam-nang] Tên file "${slug}.mdx" không hợp lệ: chỉ dùng chữ thường không dấu, số và dấu "-".`,
		);
	}
	const result = postFrontmatterSchema.safeParse(frontmatter ?? {});
	if (!result.success) {
		throw new Error(
			`[cam-nang] Frontmatter của "${slug}.mdx" không hợp lệ:\n${z.prettifyError(result.error)}`,
		);
	}
	return result.data;
}
