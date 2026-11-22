import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import Footer from "@/components/home/Footer";
import Header from "@/components/home/Header";
import appCss from "@/index.css?url";
import ErrorPage from "@/pages/auth/ErrorPage";
import NotFoundPage from "@/pages/auth/NotFoundPage";

const SITE_URL = "https://timtruong.app";
const DEFAULT_TITLE = "Tìm trường đại học phù hợp ở TP.HCM - TimTruong";
const DEFAULT_DESCRIPTION =
	"TimTruong giúp học sinh THPT tìm trường đại học và ngành học phù hợp ở TP.HCM theo điểm thi, tổ hợp môn. Tra cứu điểm chuẩn, học phí nhanh chóng.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

// Runs before first paint so dark-mode users don't see a light flash.
// Must mirror the logic in src/hooks/useTheme.ts.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.add(d?"dark":"light")}catch(e){}})()`;

export const Route = createRootRoute({
	// Site-wide defaults (pages override them via PageMetadata).
	// No canonical/og:url here: every page sets its own via PageMetadata, and a
	// site-wide "/" default would conflict with it.
	head: () => ({
		meta: [
			{ charSet: "UTF-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1.0" },
			{ name: "theme-color", content: "#ffffff" },
			// Giai đoạn hoàn thiện: chặn index toàn site. Gỡ dòng này khi sẵn sàng launch.
			{ name: "robots", content: "noindex, follow" },
			{ title: DEFAULT_TITLE },
			{ name: "description", content: DEFAULT_DESCRIPTION },
			// Open Graph (mặc định cho trang chủ; từng trang sẽ ghi đè qua PageMetadata)
			{ property: "og:type", content: "website" },
			{ property: "og:site_name", content: "TimTruong" },
			{ property: "og:locale", content: "vi_VN" },
			{ property: "og:title", content: DEFAULT_TITLE },
			{ property: "og:description", content: DEFAULT_DESCRIPTION },
			{ property: "og:image", content: DEFAULT_IMAGE },
			// Twitter Card
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: DEFAULT_TITLE },
			{ name: "twitter:description", content: DEFAULT_DESCRIPTION },
			{ name: "twitter:image", content: DEFAULT_IMAGE },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
		],
	}),

	shellComponent: RootDocument,

	// Renders for every route
	component: () => (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1 flex flex-col">
				{/* Child routes render here */}
				<Outlet />
				<TanStackRouterDevtools />
			</main>
			<Footer />
			<Toaster position="bottom-right" richColors />
		</div>
	),

	// Renders when no route matches the URL
	notFoundComponent: NotFoundPage,

	// Renders when an uncaught error is thrown — receives { error, reset }
	errorComponent: ErrorPage,
});

/** The HTML document around every page (replaces the old index.html). */
function RootDocument({ children }: { children: ReactNode }) {
	return (
		// The theme script changes <html>'s class before React hydrates.
		<html lang="vi" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
