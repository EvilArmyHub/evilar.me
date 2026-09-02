import fs from "node:fs";
import path from "node:path";
import type { Element, Root } from "hast";
import sharp from "sharp";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const imageDimensionsCache = new Map<string, { width: number; height: number } | null>();

/**
 * Rehype plugin to automatically optimize public images in Markdown content:
 * - Reads image dimensions (width/height) from public/ via sharp to eliminate CLS
 * - Adds loading="lazy" and decoding="async"
 * - Injects data-image-component="true" to satisfy Astro performance audits
 */
export const rehypePublicImages: Plugin<[], Root> = () => async (tree, file) => {
	const filePath = (file?.path || file?.history?.[0] || "").toString();
	const isNote = filePath.includes("/content/note/") || filePath.includes("\\content\\note\\");
	const imageNodes: Element[] = [];

	visit(tree, "element", (node: Element) => {
		if (node.tagName === "img" && typeof node.properties?.src === "string") {
			const src = node.properties.src;
			if (src.startsWith("/") && !src.startsWith("//") && !src.endsWith(".webm")) {
				imageNodes.push(node);
			}
		}
	});

	if (imageNodes.length === 0) return;

	await Promise.all(
		imageNodes.map(async (node) => {
			const src = node.properties.src as string;
			const cleanPath = src.split("?")[0];
			if (!cleanPath) return;

			const absoluteFilePath = path.join(process.cwd(), "public", cleanPath);

			let dimensions = imageDimensionsCache.get(cleanPath);

			if (dimensions === undefined) {
				if (fs.existsSync(absoluteFilePath)) {
					try {
						const metadata = await sharp(absoluteFilePath).metadata();
						if (metadata.width && metadata.height) {
							dimensions = { width: metadata.width, height: metadata.height };
						} else {
							dimensions = null;
						}
					} catch {
						dimensions = null;
					}
				} else {
					dimensions = null;
				}
				imageDimensionsCache.set(cleanPath, dimensions);
			}

			if (dimensions) {
				if (!node.properties.width) {
					node.properties.width = dimensions.width;
				}
				if (!node.properties.height) {
					node.properties.height = dimensions.height;
				}
			}

			if (!node.properties.loading) {
				node.properties.loading = isNote ? "eager" : "lazy";
			}
			if (isNote && !node.properties.fetchpriority) {
				node.properties.fetchpriority = "high";
			}
			if (!node.properties.decoding) {
				node.properties.decoding = "async";
			}
			node.properties["data-image-component"] = "true";
		}),
	);
};
