import { h as _h, type Properties } from "hastscript";
import type { Node, Paragraph, RootContent } from "mdast";
import type { Directives } from "mdast-util-directive";

type HtmlParagraph = Paragraph & {
	data: NonNullable<Paragraph["data"]> & {
		hName: string;
		hProperties: Properties;
	};
};

/** Checks if a node is a directive. */
export function isNodeDirective(node: Node): node is Directives {
	return (
		node.type === "containerDirective" ||
		node.type === "leafDirective" ||
		node.type === "textDirective"
	);
}

/** From Astro Starlight: Function that generates an mdast HTML tree ready for conversion to HTML by rehype. */
export function h(el: string, attrs: Properties = {}, children: RootContent[] = []): HtmlParagraph {
	const { properties, tagName } = _h(el, attrs);
	return {
		children: children as HtmlParagraph["children"],
		data: { hName: tagName, hProperties: properties },
		type: "paragraph",
	};
}
