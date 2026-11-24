import { createFileRoute } from "@tanstack/react-router";
import { BLOG_DESCRIPTION, BLOG_TITLE } from "@/lib/blog";
import { seoHead } from "@/lib/seo";
import BlogListPage from "@/pages/BlogListPage";

export const Route = createFileRoute("/cam-nang/")({
	head: () =>
		seoHead({
			title: BLOG_TITLE,
			description: BLOG_DESCRIPTION,
			path: "/cam-nang",
			links: [
				{
					rel: "alternate",
					type: "application/rss+xml",
					title: `${BLOG_TITLE} - TimTruong`,
					href: "/cam-nang/rss.xml",
				},
			],
		}),
	component: BlogListPage,
});
