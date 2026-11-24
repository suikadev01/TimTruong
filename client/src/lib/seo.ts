/**
 * Builds a route's `head()` (title, description, Open Graph, Twitter, canonical,
 * JSON-LD). Route-level head() replaces the root defaults tag by tag (same
 * name/property), so pages using it render each tag exactly once, server-side.
 *
 * This is the route-level counterpart of <PageMetadata>; pages that still fetch
 * data client-side keep using PageMetadata until they move to loaders.
 */
const SITE_URL = "https://timtruong.app";
const SITE_NAME = "TimTruong";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export const absoluteUrl = (pathOrUrl: string) =>
	pathOrUrl.startsWith("http") ? pathOrUrl : `${SITE_URL}${pathOrUrl}`;

interface SeoHeadOptions {
	title: string;
	description: string;
	/** Path of the page, e.g. "/cam-nang/xet-tuyen-la-gi". Used for canonical + og:url. */
	path: string;
	/** Path under public/ or absolute URL. Defaults to og-image.png. */
	image?: string;
	type?: "website" | "article";
	/** Extra meta tags (e.g. article:published_time). */
	meta?: Array<{ property: string; content: string }>;
	/** Extra links (e.g. RSS alternate). */
	links?: Array<Record<string, string>>;
	/** schema.org structured data. */
	jsonLd?: Record<string, unknown>;
}

export function seoHead({
	title,
	description,
	path,
	image,
	type = "website",
	meta = [],
	links = [],
	jsonLd,
}: SeoHeadOptions) {
	const fullTitle = `${title} - ${SITE_NAME}`;
	const url = absoluteUrl(path);
	const ogImage = image ? absoluteUrl(image) : DEFAULT_IMAGE;

	return {
		meta: [
			{ title: fullTitle },
			{ name: "description", content: description },
			{ property: "og:type", content: type },
			{ property: "og:url", content: url },
			{ property: "og:title", content: fullTitle },
			{ property: "og:description", content: description },
			{ property: "og:image", content: ogImage },
			{ name: "twitter:title", content: fullTitle },
			{ name: "twitter:description", content: description },
			{ name: "twitter:image", content: ogImage },
			...meta,
			...(jsonLd ? [{ "script:ld+json": jsonLd }] : []),
		],
		links: [{ rel: "canonical", href: url }, ...links],
	};
}
