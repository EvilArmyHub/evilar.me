import type { Parent, PhrasingContent, Root, RootContent, Table, TableCell } from "mdast";
import "mdast-util-to-hast";
import { toString as mdastToString } from "mdast-util-to-string";
import type { Plugin } from "unified";
import { h } from "../utils/remark";

const BENCHMARK_OPENING = /^:::\s+bench(?:\s+(.+?))?\s*$/u;
const BENCHMARK_CLOSING = ":::";
const DETAIL_SUFFIX = /^(.*?)\s*\{([^{}]+)\}\s*$/u;

function isParagraphWithText(node: RootContent | undefined, value: string): boolean {
	return node?.type === "paragraph" && mdastToString(node).trim() === value;
}

function getOpeningTitle(node: RootContent | undefined): string | undefined | null {
	if (node?.type !== "paragraph") return null;

	const match = BENCHMARK_OPENING.exec(mdastToString(node).trim());
	if (!match) return null;

	return match[1]?.trim() || undefined;
}

function hasStrongText(cell: TableCell): boolean {
	return cell.children.some((child) => child.type === "strong" && mdastToString(child).trim());
}

function addClass(node: Table | TableCell, className: string) {
	const data = (node.data ??= {});
	const properties = (data.hProperties ??= {}) as { className?: string[] };
	properties.className = [...(properties.className ?? []), className];
}

/** Turns a trailing `{detail}` into the muted second line of a benchmark cell. */
function transformDetail(cell: TableCell) {
	const lastChild = cell.children.at(-1);
	if (lastChild?.type !== "text") return;

	const match = DETAIL_SUFFIX.exec(lastChild.value);
	if (!match) return;

	const primaryText = match[1]?.trimEnd() ?? "";
	const detailText = match[2]?.trim() ?? "";
	if (!detailText) return;

	if (primaryText) {
		lastChild.value = primaryText;
	} else {
		cell.children.pop();
	}

	const detail: PhrasingContent = {
		type: "emphasis",
		children: [{ type: "text", value: detailText }],
		data: { hProperties: { className: ["benchmark-detail"] } },
	};
	cell.children.push(detail);
}

function prepareTable(table: Table) {
	const header = table.children[0];
	const modelCount = Math.max(0, (header?.children.length ?? 1) - 1);
	const selectedColumn = Math.max(
		1,
		header?.children.findIndex((cell, index) => index > 0 && hasStrongText(cell)) ?? 1,
	);

	addClass(table, "benchmark-table");

	for (const [rowIndex, row] of table.children.entries()) {
		for (const [columnIndex, cell] of row.children.entries()) {
			transformDetail(cell);
			addClass(cell, columnIndex === 0 ? "benchmark-label" : "benchmark-value");

			if (columnIndex === selectedColumn) addClass(cell, "benchmark-selected");
			if (rowIndex === 0) addClass(cell, "benchmark-heading");
		}
	}

	return modelCount;
}

function createBenchmarkFigure(table: Table, title?: string): RootContent {
	const modelCount = prepareTable(table);
	const label = title ?? "Результаты бенчмарков";
	const children: RootContent[] = [];

	if (title) {
		children.push(
			h("figcaption", { class: "benchmark-caption" }, [{ type: "text", value: title }]),
		);
	}

	children.push(
		h(
			"div",
			{
				"aria-label": label,
				class: "benchmark-scroll",
				role: "region",
				style: `--benchmark-model-count: ${modelCount}`,
			},
			[table],
		),
		h("p", { "aria-hidden": "true", class: "benchmark-scroll-hint" }, [
			{ type: "text", value: "Проведите, чтобы увидеть остальные модели" },
		]),
	);

	return h(
		"figure",
		{ "data-at-end": "false", "data-overflow": "true", class: "benchmark not-prose" },
		children,
	);
}

/**
 * Renders a Markdown table wrapped in a Djot-inspired benchmark directive:
 *
 * ::: bench Optional caption
 *
 * | Бенчмарк {Описание} | **Выбранная модель** | Другая модель |
 * | --- | ---: | ---: |
 * | Название {Описание} | 99,8 % {± 0,2} | 52,4 % |
 *
 * :::
 */
export const remarkBenchmarks: Plugin<[], Root> = () => (tree) => {
	const parent = tree as Parent;

	for (let index = 0; index < parent.children.length - 2; index += 1) {
		const opening = parent.children[index] as RootContent | undefined;
		const table = parent.children[index + 1] as RootContent | undefined;
		const closing = parent.children[index + 2] as RootContent | undefined;
		const title = getOpeningTitle(opening);

		if (title === null || table?.type !== "table") continue;
		if (!isParagraphWithText(closing, BENCHMARK_CLOSING)) continue;

		parent.children.splice(index, 3, createBenchmarkFigure(table, title));
	}
};
