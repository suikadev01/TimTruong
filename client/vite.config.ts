import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

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
		// Must come after tanstackStart().
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "./src"),
		},
	},
});
