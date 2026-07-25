import type { Paragraph, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const wideAttribute = /^\{\.wide\}(?=\s|$)/;

export const remarkImageAttributes: Plugin<[], Root> = () => (tree) => {
	visit(tree, "paragraph", (paragraph: Paragraph) => {
		for (let index = 0; index < paragraph.children.length - 1; index++) {
			const image = paragraph.children[index];
			const attribute = paragraph.children[index + 1];

			if (
				!image ||
				!attribute ||
				image.type !== "image" ||
				attribute.type !== "text" ||
				!wideAttribute.test(attribute.value)
			) {
				continue;
			}

			const className = image.data?.hProperties?.className;
			const classes = Array.isArray(className) ? className.map(String) : [];

			image.data = {
				...image.data,
				hProperties: {
					...image.data?.hProperties,
					className: [...new Set([...classes, "wide"])],
				},
			};

			attribute.value = attribute.value.replace(wideAttribute, "");
			if (!attribute.value) {
				paragraph.children.splice(index + 1, 1);
			}
		}
	});
};
