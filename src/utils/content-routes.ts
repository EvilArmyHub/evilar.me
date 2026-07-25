export type ContentKind = "post" | "note";

interface LegacyContentRoute {
	destination: string;
	id: string;
	kind: ContentKind;
	source: string;
}

const legacyContentIds = {
	post: ["about-site", "lore"],
	note: [
		"alex-statement",
		"another-vlad-statement",
		"cheeseburger-giveaway",
		"clown-whisper",
		"elevenlabs-invite",
		"evil-army-in-signal",
		"files",
		"frank-revelation",
		"riddle-question",
		"supergalactic-hero-cones",
		"timurs-dreams",
		"vlad-statement",
		"voice-chat-ended",
		"wplace-live",
	],
} as const satisfies Record<ContentKind, readonly string[]>;

export const reservedContentRootSegments = [
	"404",
	"_actions",
	"_astro",
	"_server_islands",
	"about",
	"manifest.webmanifest",
	"notes",
	"pagefind",
	"posts",
	"robots.txt",
	"rss.xml",
	"sitemap-index.xml",
	"tags",
] as const;

export function getContentPath(id: string) {
	const normalizedId = id.replace(/^\/+|\/+$/g, "");
	if (!normalizedId) {
		throw new Error("Content ID cannot be empty");
	}

	return `/${normalizedId}/`;
}

export function getLegacyContentPath(kind: ContentKind, id: string) {
	const prefix = kind === "post" ? "posts" : "notes";
	return `/${prefix}${getContentPath(id)}`;
}

export const legacyContentRoutes: readonly LegacyContentRoute[] = [
	...legacyContentIds.post.map((id) => ({
		destination: getContentPath(id),
		id,
		kind: "post" as const,
		source: getLegacyContentPath("post", id),
	})),
	...legacyContentIds.note.map((id) => ({
		destination: getContentPath(id),
		id,
		kind: "note" as const,
		source: getLegacyContentPath("note", id),
	})),
];

export function getLegacyContentRoute(kind: ContentKind, id: string) {
	return legacyContentRoutes.find((route) => route.kind === kind && route.id === id);
}

export function getAstroLegacyRedirects() {
	return Object.fromEntries(
		legacyContentRoutes.map(({ destination, source }) => [source, destination]),
	);
}

export function getVercelLegacyRedirects() {
	return legacyContentRoutes.flatMap(({ destination, source }) => {
		const sourceWithoutTrailingSlash = source.replace(/\/$/, "");

		return [
			{ destination, permanent: true, source: sourceWithoutTrailingSlash },
			{ destination, permanent: true, source },
		];
	});
}
