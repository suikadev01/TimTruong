/**
 * Generates public/sitemap.xml at build time.
 *
 * Static routes are always written. University detail URLs are fetched from the
 * API; if the API is unreachable, the script logs a warning and still writes the
 * static routes (fail-soft) so the build never breaks.
 *
 * "Cẩm nang" posts are read from src/content/cam-nang/*.mdx. Their frontmatter is
 * validated here with the app's schema, so an invalid post DOES fail the build.
 *
 * Run: `bun run scripts/generate-sitemap.ts`
 * Env: SITEMAP_API_URL (preferred) or VITE_API_URL — base URL of the API.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parsePost } from "../src/lib/blog-schema";

const SITE_URL = "https://timtruong.app";
const API_BASE_URL =
	process.env.SITEMAP_API_URL ||
	process.env.VITE_API_URL ||
	"http://localhost:5309";
const OUTPUT = join(import.meta.dirname, "..", "public", "sitemap.xml");

const STATIC_PATHS = [
	"/",
	"/tim-kiem",
	"/to-hop-mon",
	"/danh-sach-truong",
	"/cam-nang",
];
const POSTS_DIR = join(import.meta.dirname, "..", "src", "content", "cam-nang");

interface University {
	id: number;
	// Populated once the backend exposes slugs (Phase 4). Falls back to id.
	slug?: string | null;
}

function urlEntry(path: string, lastmod: string): string {
	return `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
}

async function fetchUniversityPaths(): Promise<string[]> {
	try {
		const res = await fetch(`${API_BASE_URL}/api/v1/universities`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const universities: University[] = await res.json();
		return universities.map((u) => `/danh-sach-truong/${u.slug ?? u.id}`);
	} catch (err) {
		console.warn(
			`[sitemap] Không lấy được danh sách trường từ ${API_BASE_URL} (${err}). ` +
			"Chỉ ghi các route tĩnh.",
		);
		return [];
	}
}

/** Published posts as [path, lastmod]. Throws (failing the build) on invalid frontmatter. */
function readPostEntries(): Array<[string, string]> {
	return readdirSync(POSTS_DIR)
		.filter((file) => file.endsWith(".mdx"))
		.map((file) => {
			const slug = file.slice(0, -".mdx".length);
			const source = readFileSync(join(POSTS_DIR, file), "utf-8");
			const yaml = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
			const post = parsePost(slug, yaml ? Bun.YAML.parse(yaml) : undefined);
			return { slug, post };
		})
		.filter(({ post }) => !post.draft)
		.map(({ slug, post }) => [`/cam-nang/${slug}`, post.updated ?? post.date]);
}

async function main() {
	const today = new Date().toISOString().split("T")[0];
	const entries: Array<[string, string]> = [
		...[...STATIC_PATHS, ...(await fetchUniversityPaths())].map(
			(p): [string, string] => [p, today],
		),
		...readPostEntries(),
	];
	const body = entries.map(([p, lastmod]) => urlEntry(p, lastmod)).join("\n");
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
	writeFileSync(OUTPUT, xml, "utf-8");
	console.log(`[sitemap] Đã ghi ${entries.length} URL vào ${OUTPUT}`);
}

main();
