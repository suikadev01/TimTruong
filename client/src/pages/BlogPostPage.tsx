import { getRouteApi, Link } from "@tanstack/react-router";
import type { MDXComponents } from "mdx/types";
import { Suspense } from "react";
import { formatPostDate, getPostContent } from "@/lib/blog";

const route = getRouteApi("/cam-nang/$slug");

// Overrides for elements written in Markdown.
const mdxComponents: MDXComponents = {
	// Wide tables scroll sideways on phones instead of breaking the layout.
	table: (props) => (
		<div className="overflow-x-auto">
			<table {...props} />
		</div>
	),
};

const BlogPostPage = () => {
	const post = route.useLoaderData();
	const Content = getPostContent(post.slug);

	return (
		<div className="flex-1 bg-background p-4 md:p-8">
			<article className="max-w-3xl mx-auto">
				<Link
					to="/cam-nang"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<span aria-hidden>←</span> Cẩm nang
				</Link>

				<header className="mt-4 mb-8">
					<h1 className="text-3xl font-bold text-foreground leading-tight">
						{post.title}
					</h1>
					<p className="mt-3 text-sm text-muted-foreground">
						<time dateTime={post.date}>{formatPostDate(post.date)}</time>
						{post.updated && (
							<>
								{" · Cập nhật "}
								<time dateTime={post.updated}>
									{formatPostDate(post.updated)}
								</time>
							</>
						)}
					</p>
				</header>

				<div className="prose prose-neutral dark:prose-invert max-w-none prose-a:text-primary prose-code:before:content-none prose-code:after:content-none">
					<Suspense fallback={null}>
						<Content components={mdxComponents} />
					</Suspense>
				</div>
			</article>
		</div>
	);
};

export default BlogPostPage;
