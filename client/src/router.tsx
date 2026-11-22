import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// TanStack Start calls this once per request on the server, and once in the browser.
export function getRouter() {
	return createRouter({ routeTree });
}

// Registers the router type globally so Link, useNavigate, useSearch, etc.
// are all fully type-safe throughout the app
declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
