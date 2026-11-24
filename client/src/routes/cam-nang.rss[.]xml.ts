import { createFileRoute } from "@tanstack/react-router";
import { BLOG_DESCRIPTION, BLOG_TITLE, posts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";

const escapeXml = (s: string) =>
	s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

/** "2026-11-24" → RFC 822 date at midnight Vietnam time, as RSS requires. */
const rssDate = (isoDate: string) =>
	new Date(`${isoDate}T00:00:00+07:00`).toUTCString();

// GET /cam-nang/rss.xml: RSS 2.0 feed of published posts.
export const Route = createFileRoute("/cam-nang/rss.xml")({
	server: {
		handlers: {
			GET: () => {
				const published = posts.filter((p) => !p.draft);
				const items = published
					.map((p) => {
						const url = absoluteUrl(`/cam-nang/${p.slug}`);
						return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description>${escapeXml(p.description)}</description>
      <pubDate>${rssDate(p.date)}</pubDate>
    </item>`;
					})
					.join("\n");

				const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${BLOG_TITLE} - TimTruong`)}</title>
    <link>${absoluteUrl("/cam-nang")}</link>
    <description>${escapeXml(BLOG_DESCRIPTION)}</description>
    <language>vi</language>
${items}
  </channel>
</rss>
`;
				return new Response(xml, {
					headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
				});
			},
		},
	},
});
