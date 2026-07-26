import type { Root } from "hast";
import type { Plugin } from "unified";

/**
 * Custom Rehype plugin that transforms markdown images referencing .webm videos
 * (e.g. ![Alt Text](/video.webm)) into proper HTML <video> elements.
 */
export const rehypeVideos: Plugin<[], Root> = () => (tree) => {
	function visit(node: any) {
		if (node.type === "element" && node.tagName === "img") {
			const src = node.properties?.src;
			if (typeof src === "string" && src.endsWith(".webm")) {
				node.tagName = "video";
				node.properties = {
					...node.properties,
					src,
					controls: true,
					autoplay: true,
					loop: true,
					muted: true,
					preload: "metadata",
					playsinline: true,
					playsInline: true,
				};
			}
		}
		if (node.children) {
			for (const child of node.children) {
				visit(child);
			}
		}
	}
	visit(tree);
};
