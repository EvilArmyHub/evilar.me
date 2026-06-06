import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
// Rehype plugins
import { rehypeHeadingIds, unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import robotsTxt from "astro-robots-txt";
import webmanifest from "astro-webmanifest";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeUnwrapImages from "rehype-unwrap-images";
import { rehypeVideos } from "./src/plugins/rehype-videos";
// Remark plugins
import remarkDirective from "remark-directive"; /* Handle ::: directives as nodes */
import { remarkAdmonitions } from "./src/plugins/remark-admonitions"; /* Add admonitions */
import { remarkGithubCard } from "./src/plugins/remark-github-card";
import { remarkReadingTime } from "./src/plugins/remark-reading-time";
import { expressiveCodeOptions, siteConfig } from "./src/site.config";
import {
	getAstroLegacyRedirects,
	legacyContentRoutes,
} from "./src/utils/content-routes";

const legacyContentPaths = new Set(
	legacyContentRoutes.map(({ source }) => source.replace(/\/$/, "")),
);

// https://astro.build/config
export default defineConfig({
	site: siteConfig.url,
	redirects: getAstroLegacyRedirects(),
	server: {
		port: 1337,
	},
	image: {
		domains: ["webmention.io"],
	},
	integrations: [
		expressiveCode(expressiveCodeOptions),
		icon(),
		sitemap({
			filter: (page) => {
				const pathname = new URL(page).pathname.replace(/\/$/, "");
				return !legacyContentPaths.has(pathname);
			},
		}),
		mdx(),
		robotsTxt({
			policy: [
				{
					userAgent: "*",
					allow: "/",
				},
			],
			sitemap: true,
		}),
		webmanifest({
			name: siteConfig.title,
			short_name: "evilarme",
			description: siteConfig.description,
			lang: siteConfig.lang,
			icon: "public/icon.svg",
			icons: [
				{
					src: "icons/apple-touch-icon.png",
					sizes: "180x180",
					type: "image/png",
				},
				{
					src: "icons/icon-192.png",
					sizes: "192x192",
					type: "image/png",
				},
				{
					src: "icons/icon-512.png",
					sizes: "512x512",
					type: "image/png",
				},
			],
			start_url: "/",
			background_color: "#1d1f21",
			theme_color: "#2bbc8a",
			display: "standalone",
			config: {
				insertFaviconLinks: false,
				insertThemeColorMeta: false,
				insertManifestLink: false,
			},
		}),
	],
	markdown: {
		processor: unified({
			rehypePlugins: [
				rehypeHeadingIds,
				[rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: ["not-prose"] } }],
				[
					rehypeExternalLinks,
					{
						rel: ["noreferrer", "noopener"],
						target: "_blank",
					},
				],
				rehypeUnwrapImages,
				rehypeVideos,
			],
			remarkPlugins: [remarkReadingTime, remarkDirective, remarkGithubCard, remarkAdmonitions],
			remarkRehype: {
				footnoteLabelProperties: {
					className: [""],
				},
			},
		}),
	},
	vite: {
		plugins: [tailwind(), rawFonts([".ttf", ".woff"]), servePagefindDev()],
	},
	env: {
		schema: {
			WEBMENTION_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
			WEBMENTION_URL: envField.string({ context: "client", access: "public", optional: true }),
			WEBMENTION_PINGBACK: envField.string({ context: "client", access: "public", optional: true }),
		},
	},
});

type NextFunction = (err?: unknown) => void;

interface DevServer {
	middlewares: {
		use(handler: (req: IncomingMessage, res: ServerResponse, next: NextFunction) => void): unknown;
	};
}

function servePagefindDev() {
	const CONTENT_TYPES: Record<string, string> = {
		".js": "application/javascript",
		".css": "text/css",
		".json": "application/json",
		".wasm": "application/wasm",
	};

	return {
		name: "serve-pagefind-dev",
		configureServer(server: DevServer) {
			server.middlewares.use((req, res, next) => {
				if (req.url?.startsWith("/pagefind/")) {
					const filePath = path.join(process.cwd(), "dist", req.url.split("?")[0]!);
					if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
						const ext = path.extname(filePath);
						res.setHeader("Content-Type", CONTENT_TYPES[ext] ?? "application/octet-stream");
						res.writeHead(200);
						res.end(fs.readFileSync(filePath));
						return;
					}
				}
				next();
			});
		},
	};
}

function rawFonts(ext: string[]) {
	return {
		name: "vite-plugin-raw-fonts",
		// @ts-expect-error:next-line
		transform(_, id) {
			if (ext.some((e) => id.endsWith(e))) {
				const buffer = fs.readFileSync(id);
				return {
					code: `export default ${JSON.stringify(buffer)}`,
					map: null,
				};
			}
		},
	};
}
