import { useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

// The saved theme lives in localStorage, which only exists in the browser.
// useSyncExternalStore renders "system" on the server and during hydration (so
// the HTML matches), then switches to the saved value without a hydration error.
// The <html> class itself is set before first paint by the inline script in
// src/routes/__root.tsx, which must mirror this logic.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
	listeners.add(onChange);
	window.addEventListener("storage", onChange); // other tabs
	return () => {
		listeners.delete(onChange);
		window.removeEventListener("storage", onChange);
	};
}

const getSavedTheme = (): Theme =>
	(localStorage.getItem(STORAGE_KEY) as Theme) || "system";

const getServerTheme = (): Theme => "system";

function applyTheme(theme: Theme) {
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const effective =
		theme === "system" ? (prefersDark ? "dark" : "light") : theme;
	const root = document.documentElement;
	root.classList.remove("light", "dark");
	root.classList.add(effective);
}

export const useTheme = () => {
	const theme = useSyncExternalStore(subscribe, getSavedTheme, getServerTheme);

	const setTheme = (next: Theme) => {
		localStorage.setItem(STORAGE_KEY, next);
		for (const notify of listeners) notify();
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: `theme` is the re-run trigger; the body reads the saved value directly.
	useEffect(() => {
		// Read the saved value directly: during hydration `theme` is still the
		// server's "system", and applying that would flash the wrong theme.
		const saved = getSavedTheme();
		applyTheme(saved);

		if (saved === "system") {
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			const handleChange = () => applyTheme("system");
			mediaQuery.addEventListener("change", handleChange);
			return () => mediaQuery.removeEventListener("change", handleChange);
		}
	}, [theme]);

	return { theme, setTheme };
};
