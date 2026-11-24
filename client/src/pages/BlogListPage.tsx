import { Link } from "@tanstack/react-router";
import {
	BLOG_DESCRIPTION,
	BLOG_TITLE,
	formatPostDate,
	posts,
} from "@/lib/blog";

const BlogListPage = () => (
	<div className="flex-1 bg-background p-4 md:p-8">
		<div className="max-w-3xl mx-auto">
			<h1 className="text-2xl font-semibold text-foreground mb-2 text-center">
				{BLOG_TITLE}
			</h1>
			<p className="text-muted-foreground text-center mb-8">
				{BLOG_DESCRIPTION}
			</p>

			{posts.length === 0 ? (
				<p className="text-center text-muted-foreground">
					Chưa có bài viết nào.
				</p>
			) : (
				<ul className="space-y-4">
					{posts.map((post) => (
						<li key={post.slug}>
							<Link
								to="/cam-nang/$slug"
								params={{ slug: post.slug }}
								className="block rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent/50"
							>
								<h2 className="text-lg font-semibold text-foreground">
									{post.title}
									{post.draft && (
										<span className="ml-2 align-middle rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
											Nháp
										</span>
									)}
								</h2>
								<time
									dateTime={post.date}
									className="mt-1 block text-sm text-muted-foreground"
								>
									{formatPostDate(post.date)}
								</time>
								<p className="mt-2 text-sm text-foreground/80">
									{post.description}
								</p>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	</div>
);

export default BlogListPage;
