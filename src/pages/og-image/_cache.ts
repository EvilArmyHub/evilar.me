import { cacheDir } from "astro:config/server";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CACHE_VERSION = "v1";
const OG_IMAGE_CACHE_DIR = path.join(fileURLToPath(cacheDir), "og-images");

interface OgImageCacheKey {
	pubDate: Date;
	title: string;
}

interface WriteOgImageCacheInput extends OgImageCacheKey {
	data: Buffer;
}

function ensureCacheDir() {
	fs.mkdirSync(OG_IMAGE_CACHE_DIR, { recursive: true });
}

function getCacheFilePath({ pubDate, title }: OgImageCacheKey) {
	const cacheInput = `${CACHE_VERSION}:${title}:${pubDate.toISOString()}`;
	const cacheKey = crypto.createHash("sha256").update(cacheInput).digest("hex").slice(0, 16);
	return path.join(OG_IMAGE_CACHE_DIR, `${cacheKey}.png`);
}

export function readOgImageCache(input: OgImageCacheKey): Buffer | null {
	try {
		const cacheFilePath = getCacheFilePath(input);
		return fs.existsSync(cacheFilePath) ? fs.readFileSync(cacheFilePath) : null;
	} catch (error) {
		console.warn(
			`Failed to read OG image cache: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return null;
	}
}

export function writeOgImageCache({ data, ...cacheKey }: WriteOgImageCacheInput) {
	try {
		ensureCacheDir();
		fs.writeFileSync(getCacheFilePath(cacheKey), data);
	} catch (error) {
		console.warn(
			`Failed to write OG image cache: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}
