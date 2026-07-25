import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { siteConfig } from "../src/site.config";

const EXPECTED_WIDTH = 1200;
const EXPECTED_HEIGHT = 630;
const SUPPORTED_FORMATS = new Set(["gif", "jpeg", "png", "webp"]);
const distDirectory = path.resolve("dist");
const siteOrigin = new URL(siteConfig.url).origin;
const errors: string[] = [];
const checkedImages = new Map<string, Promise<void>>();
let pageCount = 0;

function collectHtmlFiles(directory: string): string[] {
	const files: string[] = [];

	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const absolutePath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			files.push(...collectHtmlFiles(absolutePath));
		} else if (entry.isFile() && entry.name.endsWith(".html")) {
			files.push(absolutePath);
		}
	}

	return files;
}

function getAttribute(tag: string, attribute: string) {
	const match = tag.match(new RegExp(`\\b${attribute}=(["'])(.*?)\\1`, "i"));
	return match?.[2];
}

function getMetaContent(html: string, key: string) {
	for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
		if (getAttribute(tag, "property") === key || getAttribute(tag, "name") === key) {
			return getAttribute(tag, "content");
		}
	}

	return undefined;
}

function getLocalImagePath(imageUrl: URL) {
	const pathname = decodeURIComponent(imageUrl.pathname).replace(/^\/+/, "");
	const imagePath = path.resolve(distDirectory, pathname);

	if (!imagePath.startsWith(`${distDirectory}${path.sep}`)) {
		return null;
	}

	return imagePath;
}

async function checkImage(imageUrl: URL, declaredType: string | undefined) {
	if (checkedImages.has(imageUrl.href)) {
		return checkedImages.get(imageUrl.href);
	}

	const check = (async () => {
		const imagePath = getLocalImagePath(imageUrl);
		if (!imagePath) {
			errors.push(`${imageUrl.href}: image path escapes dist`);
			return;
		}

		if (!fs.existsSync(imagePath)) {
			errors.push(`${imageUrl.href}: referenced image does not exist in dist`);
			return;
		}

		const metadata = await sharp(imagePath).metadata();
		if (!metadata.format || !SUPPORTED_FORMATS.has(metadata.format)) {
			errors.push(
				`${imageUrl.href}: unsupported format "${metadata.format ?? "unknown"}"; use PNG, JPEG, WebP, or GIF`,
			);
		}

		if (metadata.width !== EXPECTED_WIDTH || metadata.height !== EXPECTED_HEIGHT) {
			errors.push(
				`${imageUrl.href}: expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}, got ${metadata.width ?? "?"}x${metadata.height ?? "?"}`,
			);
		}

		const actualType = metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
		if (declaredType !== actualType) {
			errors.push(
				`${imageUrl.href}: og:image:type is "${declaredType ?? "missing"}", expected "${actualType}"`,
			);
		}
	})();

	checkedImages.set(imageUrl.href, check);
	return check;
}

for (const htmlFile of collectHtmlFiles(distDirectory)) {
	const html = fs.readFileSync(htmlFile, "utf8");
	const ogImage = getMetaContent(html, "og:image");

	if (!ogImage) {
		continue;
	}

	pageCount += 1;
	const page = path.relative(distDirectory, htmlFile);
	const twitterImage = getMetaContent(html, "twitter:image");
	const declaredWidth = getMetaContent(html, "og:image:width");
	const declaredHeight = getMetaContent(html, "og:image:height");

	if (twitterImage !== ogImage) {
		errors.push(`${page}: twitter:image must match og:image`);
	}
	if (declaredWidth !== String(EXPECTED_WIDTH) || declaredHeight !== String(EXPECTED_HEIGHT)) {
		errors.push(`${page}: OG dimensions must declare ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`);
	}

	const imageUrl = new URL(ogImage, siteConfig.url);
	if (imageUrl.origin === siteOrigin) {
		await checkImage(imageUrl, getMetaContent(html, "og:image:type"));
	}
}

await Promise.all(checkedImages.values());

if (errors.length > 0) {
	console.error("Social image validation failed:");
	for (const error of errors) {
		console.error(`- ${error}`);
	}
	process.exitCode = 1;
} else {
	console.log(
		`Social images are valid: ${pageCount} pages, ${checkedImages.size} local image${checkedImages.size === 1 ? "" : "s"}`,
	);
}
