import fs from "node:fs";
import path from "node:path";
import {
	type ContentKind,
	legacyContentRoutes,
	reservedContentRootSegments,
} from "../src/utils/content-routes";

interface ContentRouteEntry {
	file: string;
	id: string;
	kind: ContentKind;
}

const projectRoot = process.cwd();
const contentExtensions = new Set([".md", ".mdx"]);

function collectContentEntries(kind: ContentKind): ContentRouteEntry[] {
	const contentDirectory = path.join(projectRoot, "src", "content", kind);
	const entries: ContentRouteEntry[] = [];

	function walk(directory: string) {
		for (const directoryEntry of fs.readdirSync(directory, { withFileTypes: true })) {
			const absolutePath = path.join(directory, directoryEntry.name);

			if (directoryEntry.isDirectory()) {
				walk(absolutePath);
				continue;
			}

			const extension = path.extname(directoryEntry.name).toLowerCase();
			if (!directoryEntry.isFile() || !contentExtensions.has(extension)) {
				continue;
			}

			const relativePath = path.relative(contentDirectory, absolutePath);
			entries.push({
				file: path.relative(projectRoot, absolutePath),
				id: relativePath.slice(0, -extension.length).split(path.sep).join("/"),
				kind,
			});
		}
	}

	walk(contentDirectory);
	return entries;
}

function getPublicRootEntries() {
	return new Set(
		fs
			.readdirSync(path.join(projectRoot, "public"), { withFileTypes: true })
			.map((entry) => entry.name.toLowerCase()),
	);
}

function getPageRootEntries() {
	const entries = new Set<string>();
	const dynamicRoutes: string[] = [];

	for (const entry of fs.readdirSync(path.join(projectRoot, "src", "pages"), {
		withFileTypes: true,
	})) {
		if (entry.isDirectory()) {
			entries.add(entry.name.toLowerCase());
			continue;
		}

		if (!entry.isFile()) {
			continue;
		}

		const routeName = entry.name.replace(/\.(astro|js|ts)$/, "");
		if (routeName === "index" || routeName === "[...slug]") {
			continue;
		}

		if (routeName.startsWith("[")) {
			dynamicRoutes.push(entry.name);
			continue;
		}

		entries.add(routeName.toLowerCase());
	}

	return { dynamicRoutes, entries };
}

function isReservedRootSegment(
	segment: string,
	pageRootEntries: Set<string>,
	publicRootEntries: Set<string>,
) {
	const normalizedSegment = segment.toLowerCase();

	return (
		reservedContentRootSegments.includes(
			normalizedSegment as (typeof reservedContentRootSegments)[number],
		) ||
		pageRootEntries.has(normalizedSegment) ||
		publicRootEntries.has(normalizedSegment) ||
		/^sitemap-\d+\.xml$/.test(normalizedSegment)
	);
}

const entries = [...collectContentEntries("post"), ...collectContentEntries("note")];
const { dynamicRoutes, entries: pageRootEntries } = getPageRootEntries();
const publicRootEntries = getPublicRootEntries();
const errors: string[] = [];
const entriesByNormalizedId = new Map<string, ContentRouteEntry[]>();

for (const dynamicRoute of dynamicRoutes) {
	errors.push(
		`src/pages/${dynamicRoute}: competing root dynamic route must be included in content route validation`,
	);
}

for (const entry of entries) {
	const normalizedId = entry.id.toLowerCase();
	const existingEntries = entriesByNormalizedId.get(normalizedId) ?? [];
	existingEntries.push(entry);
	entriesByNormalizedId.set(normalizedId, existingEntries);

	const rootSegment = entry.id.split("/")[0];
	if (rootSegment && isReservedRootSegment(rootSegment, pageRootEntries, publicRootEntries)) {
		errors.push(
			`${entry.file}: content ID "${entry.id}" conflicts with reserved root path "/${rootSegment}/"`,
		);
	}
}

for (const duplicateEntries of entriesByNormalizedId.values()) {
	if (duplicateEntries.length < 2) {
		continue;
	}

	errors.push(
		`Duplicate content route "${duplicateEntries[0]?.id}" is defined by ${duplicateEntries
			.map(({ file, kind }) => `${kind} ${file}`)
			.join(", ")}`,
	);
}

const exactEntries = new Set(entries.map(({ id, kind }) => `${kind}:${id}`));
const legacySources = new Set<string>();
const legacyDestinations = new Set<string>();

for (const route of legacyContentRoutes) {
	const entryKey = `${route.kind}:${route.id}`;
	if (!exactEntries.has(entryKey)) {
		errors.push(
			`Legacy redirect "${route.source}" points to missing ${route.kind} content "${route.id}"`,
		);
	}

	const normalizedSource = route.source.toLowerCase();
	if (legacySources.has(normalizedSource)) {
		errors.push(`Duplicate legacy redirect source "${route.source}"`);
	}
	legacySources.add(normalizedSource);

	const normalizedDestination = route.destination.toLowerCase();
	if (legacyDestinations.has(normalizedDestination)) {
		errors.push(`Duplicate legacy redirect destination "${route.destination}"`);
	}
	legacyDestinations.add(normalizedDestination);
}

if (errors.length > 0) {
	console.error("Content route validation failed:");
	for (const error of errors) {
		console.error(`- ${error}`);
	}
	process.exitCode = 1;
} else {
	const postCount = entries.filter(({ kind }) => kind === "post").length;
	const noteCount = entries.filter(({ kind }) => kind === "note").length;
	console.log(
		`Content routes are valid: ${postCount} posts, ${noteCount} notes, ${legacyContentRoutes.length} legacy redirects`,
	);
}
