import * as fs from "node:fs";
import { WEBMENTION_API_KEY } from "astro:env/server";
import type {
	WebmentionType,
	WebmentionsCache,
	WebmentionsChildren,
	WebmentionsFeed,
} from "@/types";

const DOMAIN = import.meta.env.SITE;
const CACHE_DIR = ".data";
const filePath = `${CACHE_DIR}/webmentions.json`;
const FETCH_TIMEOUT_MS = 5000;
const validWebmentionTypes: readonly WebmentionType[] = ["like-of", "mention-of", "in-reply-to"];

const emptyCache = {
	lastFetched: null,
	children: [],
} satisfies WebmentionsCache;

let webMentionsPromise: Promise<WebmentionsCache> | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isWebmentionEntry(value: unknown): value is WebmentionsChildren {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value["wm-id"] === "number" &&
		typeof value["wm-target"] === "string" &&
		typeof value["wm-property"] === "string" &&
		typeof value["wm-received"] === "string" &&
		typeof value.url === "string"
	);
}

function normalizeFeed(data: unknown): WebmentionsFeed | null {
	if (!isRecord(data)) {
		return null;
	}

	const children = Array.isArray(data.children) ? data.children.filter(isWebmentionEntry) : [];

	if (typeof data.name !== "string" || typeof data.type !== "string") {
		return null;
	}

	return {
		name: data.name,
		type: data.type,
		children,
	};
}

function normalizeCache(data: unknown): WebmentionsCache {
	if (!isRecord(data)) {
		return emptyCache;
	}

	return {
		lastFetched: typeof data.lastFetched === "string" ? data.lastFetched : null,
		children: Array.isArray(data.children) ? data.children.filter(isWebmentionEntry) : [],
	};
}

function normalizeUrlForCompare(value: string) {
	const url = new URL(value);
	url.hash = "";
	if (
		(url.protocol === "https:" && url.port === "443") ||
		(url.protocol === "http:" && url.port === "80")
	) {
		url.port = "";
	}
	if (url.pathname !== "/") {
		url.pathname = url.pathname.replace(/\/+$/, "") || "/";
	}
	return url.toString();
}

const hostName = DOMAIN ? new URL(DOMAIN).hostname : null;

// Calls webmention.io api.
async function fetchWebmentions(timeFrom: string | null, perPage = 1000) {
	if (!hostName) {
		console.warn("No domain specified. Please set in astro.config.ts");
		return null;
	}

	if (!WEBMENTION_API_KEY) {
		console.warn("No webmention api token specified in .env");
		return null;
	}

	const url = new URL("https://webmention.io/api/mentions.jf2");
	url.searchParams.set("domain", hostName);
	url.searchParams.set("token", WEBMENTION_API_KEY);
	url.searchParams.set("sort-dir", "up");
	url.searchParams.set("per-page", String(perPage));

	if (timeFrom) {
		url.searchParams.set("since", timeFrom);
	}

	try {
		const res = await fetch(url, {
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		});

		if (!res.ok) {
			console.warn(`Failed to fetch webmentions: ${res.status} ${res.statusText}`);
			return null;
		}

		return normalizeFeed(await res.json());
	} catch (error) {
		console.warn(
			`Failed to fetch webmentions: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return null;
	}
}

// Merge cached entries [a] with fresh webmentions [b], merge by wm-id
function mergeWebmentions(a: WebmentionsCache, b: WebmentionsFeed): WebmentionsChildren[] {
	return Array.from(
		[...a.children, ...(b.children ?? [])]
			.reduce((map, obj) => map.set(obj["wm-id"], obj), new Map())
			.values(),
	);
}

// filter out WebmentionChildren
export function filterWebmentions(webmentions: WebmentionsChildren[]) {
	return webmentions.filter((webmention) => {
		// make sure the mention has a property so we can sort them later
		if (!validWebmentionTypes.includes(webmention["wm-property"])) return false;

		// make sure 'mention-of' or 'in-reply-to' has text content.
		if (webmention["wm-property"] === "mention-of" || webmention["wm-property"] === "in-reply-to") {
			return webmention.content && webmention.content.text !== "";
		}

		return true;
	});
}

// save combined webmentions in cache file
function writeToCache(data: WebmentionsCache) {
	try {
		fs.mkdirSync(CACHE_DIR, { recursive: true });
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
	} catch (error) {
		console.warn(
			`Failed to write webmentions cache: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

function getFromCache(): WebmentionsCache {
	try {
		if (fs.existsSync(filePath)) {
			const data = fs.readFileSync(filePath, "utf-8");
			return normalizeCache(JSON.parse(data));
		}
	} catch (error) {
		console.warn(
			`Failed to read webmentions cache: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}

	return emptyCache;
}

async function getAndCacheWebmentions() {
	const cache = getFromCache();
	const mentions = await fetchWebmentions(cache.lastFetched);

	if (mentions) {
		mentions.children = filterWebmentions(mentions.children ?? []);
		const webmentions: WebmentionsCache = {
			lastFetched: new Date().toISOString(),
			// Make sure the first arg is the cache
			children: mergeWebmentions(cache, mentions),
		};

		writeToCache(webmentions);
		return webmentions;
	}

	return cache;
}

let webMentions: WebmentionsCache;

export async function getWebmentionsForUrl(url: string) {
	if (!webMentionsPromise) {
		webMentionsPromise = getAndCacheWebmentions();
	}

	if (!webMentions) {
		webMentions = await webMentionsPromise;
	}

	const normalizedUrl = normalizeUrlForCompare(url);

	return webMentions.children.filter((entry) => {
		try {
			return normalizeUrlForCompare(entry["wm-target"]) === normalizedUrl;
		} catch {
			return false;
		}
	});
}
