import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPost } from "@/lib/blog";
import { absoluteUrl, seoHead } from "@/lib/seo";
import BlogPostPage from "@/pages/BlogPostPage";

export const Route = createFileRoute("/cam-nang/$slug")({
	// Unknown slug → root notFoundComponent with a real 404 status.
	loader: ({ params }) => {
		const post = getPost(params.slug);
		if (!post) throw notFound();
		return post;
	},
	head: ({ loaderData: post }) => {
		if (!post) return {};
		const path = `/cam-nang/${post.slug}`;
		return seoHead({
			title: post.title,
			description: post.description,
			path,
			image: post.image,
			type: "article",
			meta: [
				{ property: "article:published_time", content: post.date },
				...(post.updated
					? [{ property: "article:modified_time", content: post.updated }]
					: []),
			],
			jsonLd: {
				"@context": "https://schema.org",
				"@type": "Article",
				headline: post.title,
				description: post.description,
				datePublished: post.date,
				dateModified: post.updated ?? post.date,
				inLanguage: "vi",
				url: absoluteUrl(path),
				mainEntityOfPage: absoluteUrl(path),
				image: absoluteUrl(post.image ?? "/og-image.png"),
				author: {
					"@type": "Organization",
					name: "TimTruong",
					url: absoluteUrl("/"),
				},
				publisher: {
					"@type": "Organization",
					name: "TimTruong",
					url: absoluteUrl("/"),
				},
			},
		});
	},
	component: BlogPostPage,
});
