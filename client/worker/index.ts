/**
 * Cloudflare Worker entry: TanStack Start renders every page (SSR); static
 * assets are served by Cloudflare before the Worker runs.
 *
 * For university detail pages it also injects per-page Open Graph / Twitter
 * meta into the HTML. Why: pages still fetch their data client-side, so the
 * server-rendered HTML only has the default meta. Social crawlers (Facebook,
 * Zalo, Twitter) don't run JS, so this rewrite makes shared links show the
 * correct title/description/image.
 * TODO(phase 2): remove once the detail route sets its meta via head() + loader.
 */
import handler from "@tanstack/react-start/server-entry";

interface Env {
	/** Static assets (dist/client), used to check whether a preview image exists. */
	ASSETS: Fetcher;
	/** Base URL of the API, e.g. https://api.timtruong.app. Set in wrangler.jsonc. */
	API_BASE_URL: string;
}

const SITE_URL = "https://timtruong.app";
const SITE_NAME = "TimTruong";
const DETAIL_PREFIX = "/danh-sach-truong/";

interface University {
	name: string;
}

/** HTMLRewriter handler: sets an attribute on each matched element. */
const setAttribute = (
	name: string,
	value: string,
): HTMLRewriterElementContentHandlers => ({
	element(el) {
		el.setAttribute(name, value);
	},
});

/** HTMLRewriter handler: replaces each matched element's text. */
const setText = (value: string): HTMLRewriterElementContentHandlers => ({
	element(el) {
		el.setInnerContent(value);
	},
});

async function fetchUniversity(
	slug: string,
	env: Env,
): Promise<University | null> {
	try {
		const res = await fetch(
			`${env.API_BASE_URL}/api/v1/universities/by-slug/${encodeURIComponent(slug)}`,
		);
		return res.ok ? ((await res.json()) as University) : null;
	} catch {
		// Network/API error → serve the page with default meta.
		return null;
	}
}

async function injectUniversityMeta(
	slug: string,
	page: Response,
	env: Env,
): Promise<Response> {
	// Preview images are generated at build time (scripts/generate-og-images.ts).
	// A university added after the last build has none yet → use the default.
	const imagePath = `/og/${encodeURIComponent(slug)}.png`;
	const [university, hasImage] = await Promise.all([
		fetchUniversity(slug, env),
		env.ASSETS.fetch(new URL(imagePath, SITE_URL), { method: "HEAD" })
			.then((res) => res.ok)
			.catch(() => false),
	]);

	if (!university) return page;

	const title = `${university.name} - ${SITE_NAME}`;
	const description = `Thông tin tuyển sinh, học phí và danh sách ngành học của ${university.name}`;
	const image = `${SITE_URL}${hasImage ? imagePath : "/og-image.png"}`;
	const url = `${SITE_URL}${DETAIL_PREFIX}${slug}`;

	return new HTMLRewriter()
		.on("title", setText(title))
		.on('meta[property="og:title"]', setAttribute("content", title))
		.on('meta[property="og:description"]', setAttribute("content", description))
		.on('meta[property="og:image"]', setAttribute("content", image))
		.on('meta[property="og:url"]', setAttribute("content", url))
		.on('meta[name="description"]', setAttribute("content", description))
		.on('meta[name="twitter:title"]', setAttribute("content", title))
		.on(
			'meta[name="twitter:description"]',
			setAttribute("content", description),
		)
		.on('meta[name="twitter:image"]', setAttribute("content", image))
		.on('link[rel="canonical"]', setAttribute("href", url))
		.transform(page);
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const page = await handler.fetch(request);

		const url = new URL(request.url);
		const match = url.pathname.match(/^\/danh-sach-truong\/([^/]+)\/?$/);
		const isHtml = page.headers.get("content-type")?.includes("text/html");

		if (match && request.method === "GET" && page.ok && isHtml) {
			return injectUniversityMeta(decodeURIComponent(match[1]), page, env);
		}

		return page;
	},
};
