import { readFile } from "node:fs/promises";
import { cloudflare } from "@cloudflare/vite-plugin";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { defineConfig, type Plugin } from "vite";
import { parse as parseYaml } from "yaml";

/** MDX compiler for blog posts, except "?frontmatter" requests (see below). */
function mdxPosts(): Plugin {
	// remark-frontmatter keeps the YAML block out of the rendered body;
	// remark-gfm adds tables, strikethrough and autolinks.
	const plugin = mdx({
		remarkPlugins: [remarkFrontmatter, remarkGfm],
	}) as Plugin;
	const compile = plugin.transform as (
		this: unknown,
		code: string,
		id: string,
	) => Promise<{ code: string } | undefined>;
	return {
		...plugin,
		enforce: "pre",
		// @mdx-js/rollup ignores the query and would recompile our frontmatter module.
		transform(code, id) {
			if (id.endsWith("?frontmatter")) return;
			return compile.call(this, code, id);
		},
	};
}

/**
 * `import x from "post.mdx?frontmatter"` → just the post's YAML frontmatter as an
 * object. Lets the blog list/meta load every post's frontmatter without bundling
 * the post bodies, which stay lazy chunks (see src/lib/blog.ts).
 */
function mdxFrontmatter(): Plugin {
	return {
		name: "mdx-frontmatter-only",
		enforce: "pre",
		async load(id) {
			const [file, query] = id.split("?");
			if (!file.endsWith(".mdx") || query !== "frontmatter") return;
			const source = await readFile(file, "utf-8");
			const yaml = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
			return `export default ${JSON.stringify(yaml ? parseYaml(yaml) : {})};`;
		},
	};
}

// https://tanstack.com/start/latest/docs/framework/react/guide/hosting
export default defineConfig({
	// Keep 5173 so the API's dev CORS origin doesn't need to change.
	server: { port: 5173 },
	plugins: [
		// Runs the SSR build inside the Workers runtime (workerd), in dev and preview too.
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		// Includes the router plugin: generates src/routeTree.gen.ts from src/routes/
		// (with auto code splitting on by default).
		tanstackStart(),
		// Blog posts (src/content/cam-nang/*.mdx).
		mdxFrontmatter(),
		mdxPosts(),
		// Must come after tanstackStart().
		react({ include: /\.(mdx|jsx|tsx)$/ }),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "./src"),
		},
	},
});
