/**
 * Generates Open Graph (link preview) images at build time.
 *
 * - public/og/{slug}.png: one 1200×630 PNG per university (its logo centered on
 *   white, with the TimTruong logo in the corner). Git-ignored, rebuilt each build.
 * - public/og-image.png: the site-wide default. Only written when missing, so a
 *   hand-designed replacement is never overwritten. Committed.
 *
 * Why: Facebook/Zalo need an absolute URL to a PNG/JPEG around 1200×630. Raw logos
 * are SVG/AVIF/WebP/PNG/JPEG of any size (300px to 8000px), which many crawlers
 * reject or crop badly.
 *
 * worker/index.ts points og:image at /og/{slug}.png and falls back to the default
 * when the file is missing (e.g. a university added after the last build).
 *
 * Fail-soft like the sitemap: if the API is unreachable, or a logo is missing or
 * unreadable, it logs a warning and the build continues.
 *
 * Run: `bun run scripts/generate-og-images.ts`
 * Env: SITEMAP_API_URL (preferred) or VITE_API_URL — base URL of the API.
 */
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const API_BASE_URL =
	process.env.SITEMAP_API_URL ||
	process.env.VITE_API_URL ||
	"http://localhost:5309";
const PUBLIC_DIR = join(import.meta.dirname, "..", "public");
const OUT_DIR = join(PUBLIC_DIR, "og");
const SITE_LOGO = join(PUBLIC_DIR, "logo.svg");

const WIDTH = 1200;
const HEIGHT = 630;
const BACKGROUND = "#ffffff";

interface University {
	slug: string | null;
	imageUrl: string | null;
}

/** Renders an image file to a PNG buffer that fits inside width×height. */
function fit(file: string, width: number, height: number) {
	// density: rasterize SVGs sharply instead of at their tiny intrinsic size.
	const isSvg = file.endsWith(".svg");
	return sharp(file, isSvg ? { density: 300 } : {})
		.resize(width, height, {
			fit: "contain",
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		})
		.png()
		.toBuffer();
}

function canvas() {
	return sharp({
		create: {
			width: WIDTH,
			height: HEIGHT,
			channels: 3,
			background: BACKGROUND,
		},
	});
}

async function writeDefaultImage() {
	const out = join(PUBLIC_DIR, "og-image.png");
	if (existsSync(out)) return;
	const logo = await fit(SITE_LOGO, 640, 450);
	await canvas()
		.composite([{ input: logo, gravity: "center" }])
		.png()
		.toFile(out);
	console.log(`[og] Đã tạo ảnh mặc định ${out}`);
}

async function writeUniversityImage(u: University, siteLogo: Buffer) {
	// imageUrl is a path under public/, e.g. "/universities-logo/uit.svg".
	const logoFile = join(PUBLIC_DIR, u.imageUrl as string);
	const logo = await fit(logoFile, 460, 400);
	await canvas()
		.composite([
			{
				input: logo,
				top: Math.round((HEIGHT - 400) / 2) - 20,
				left: Math.round((WIDTH - 460) / 2),
			},
			{ input: siteLogo, top: HEIGHT - 80, left: WIDTH - 140 },
		])
		.png({ compressionLevel: 9, palette: true })
		.toFile(join(OUT_DIR, `${u.slug}.png`));
}

async function fetchUniversities(): Promise<University[]> {
	try {
		const res = await fetch(`${API_BASE_URL}/api/v1/universities`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return await res.json();
	} catch (err) {
		console.warn(
			`[og] Không lấy được danh sách trường từ ${API_BASE_URL} (${err}). ` +
				"Bỏ qua ảnh từng trường (dùng ảnh mặc định).",
		);
		return [];
	}
}

async function main() {
	await writeDefaultImage();

	// Rebuild from scratch so deleted/renamed universities don't leave stale files.
	rmSync(OUT_DIR, { recursive: true, force: true });
	mkdirSync(OUT_DIR, { recursive: true });

	const siteLogo = await fit(SITE_LOGO, 110, 60);
	const universities = await fetchUniversities();
	let written = 0;
	for (const u of universities) {
		if (!u.slug || !u.imageUrl || u.imageUrl.startsWith("http")) continue;
		try {
			await writeUniversityImage(u, siteLogo);
			written++;
		} catch (err) {
			console.warn(`[og] Bỏ qua ${u.slug}: ${err}`);
		}
	}
	console.log(
		`[og] Đã tạo ${written}/${universities.length} ảnh vào ${OUT_DIR}`,
	);
}

main();
