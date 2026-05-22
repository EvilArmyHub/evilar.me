import fs from "node:fs/promises";
import path from "node:path";
import { encode } from "blurhash";
import { parse as parseExif } from "exifr";
import sharp from "sharp";

const IMAGE_EXTENSIONS = new Set([".avif", ".jpg", ".jpeg", ".png", ".webp"]);
const MAX_WIDTH = 1440;
const BLURHASH_SIZE = 32;
const BLURHASH_COMPONENT_X = 4;
const BLURHASH_COMPONENT_Y = 3;

type ExifDateFields = {
	CreateDate?: unknown;
	DateTimeOriginal?: unknown;
	ModifyDate?: unknown;
};

type ProcessedPhoto = {
	filePath: string;
	sidecarPath: string;
	width: number;
	height: number;
	blurhash: string;
};

function isImagePath(filePath: string) {
	return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function pad(value: number) {
	return value.toString().padStart(2, "0");
}

function formatPhotoTimestamp(date: Date) {
	return [
		date.getFullYear(),
		pad(date.getMonth() + 1),
		pad(date.getDate()),
		pad(date.getHours()),
		pad(date.getMinutes()),
		pad(date.getSeconds()),
	].join("-");
}

function parseExifDate(value: unknown): Date | null {
	if (value instanceof Date && Number.isFinite(value.getTime())) {
		return value;
	}

	if (typeof value !== "string") {
		return null;
	}

	const normalizedExifDate = value
		.trim()
		.replace(/^(\d{4}):(\d{2}):(\d{2})\s/, "$1-$2-$3T");
	const parsedDate = new Date(normalizedExifDate);

	return Number.isFinite(parsedDate.getTime()) ? parsedDate : null;
}

async function getCaptureDate(filePath: string) {
	try {
		const exif = (await parseExif(filePath, [
			"DateTimeOriginal",
			"CreateDate",
			"ModifyDate",
		])) as ExifDateFields | undefined;
		const exifDate =
			parseExifDate(exif?.DateTimeOriginal) ??
			parseExifDate(exif?.CreateDate) ??
			parseExifDate(exif?.ModifyDate);

		if (exifDate) {
			return exifDate;
		}
	} catch {
		// Some optimized files have no readable EXIF. Fall back to filesystem metadata.
	}

	const stats = await fs.stat(filePath);
	return stats.mtime;
}

async function collectImagePaths(inputPath: string): Promise<string[]> {
	const stats = await fs.stat(inputPath);

	if (stats.isFile()) {
		return isImagePath(inputPath) ? [inputPath] : [];
	}

	if (!stats.isDirectory()) {
		return [];
	}

	const entries = await fs.readdir(inputPath, { withFileTypes: true });
	const nestedPaths = await Promise.all(
		entries.map((entry) => collectImagePaths(path.join(inputPath, entry.name))),
	);

	return nestedPaths.flat();
}

async function getUniqueTargetPath(sourcePath: string, captureDate: Date) {
	const sourceDirectory = path.dirname(sourcePath);
	const sourceExtension = path.extname(sourcePath).toLowerCase();
	const baseName = `p-${formatPhotoTimestamp(captureDate)}`;
	let candidatePath = path.join(sourceDirectory, `${baseName}${sourceExtension}`);
	let index = 2;

	while (candidatePath !== sourcePath) {
		try {
			await fs.access(candidatePath);
			candidatePath = path.join(sourceDirectory, `${baseName}-${index}${sourceExtension}`);
			index += 1;
		} catch {
			break;
		}
	}

	return candidatePath;
}

async function writeOptimizedImage(sourcePath: string, targetPath: string) {
	const extension = path.extname(targetPath).toLowerCase();
	const temporaryPath = path.join(
		path.dirname(targetPath),
		`.${path.basename(targetPath, extension)}.${process.pid}${extension}`,
	);

	let pipeline = sharp(sourcePath).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });

	if (extension === ".avif") {
		pipeline = pipeline.avif({ effort: 4, quality: 70 });
	} else if (extension === ".jpg" || extension === ".jpeg") {
		pipeline = pipeline.jpeg({ mozjpeg: true, quality: 82 });
	} else if (extension === ".png") {
		pipeline = pipeline.png({ adaptiveFiltering: true, compressionLevel: 9 });
	} else if (extension === ".webp") {
		pipeline = pipeline.webp({ quality: 82 });
	}

	await pipeline.toFile(temporaryPath);

	if (sourcePath !== targetPath) {
		await fs.unlink(sourcePath);
	}

	await fs.rename(temporaryPath, targetPath);
}

async function createBlurhash(filePath: string) {
	const { data, info } = await sharp(filePath)
		.resize(BLURHASH_SIZE, BLURHASH_SIZE, { fit: "inside" })
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);

	return encode(pixels, info.width, info.height, BLURHASH_COMPONENT_X, BLURHASH_COMPONENT_Y);
}

async function processPhoto(sourcePath: string): Promise<ProcessedPhoto> {
	const captureDate = await getCaptureDate(sourcePath);
	const targetPath = await getUniqueTargetPath(sourcePath, captureDate);
	await writeOptimizedImage(sourcePath, targetPath);

	const metadata = await sharp(targetPath).metadata();
	const blurhash = await createBlurhash(targetPath);
	const sidecarPath = targetPath.replace(/\.[^.]+$/, ".json");
	const sidecar = {
		blurhash,
		height: metadata.height,
		src: path.basename(targetPath),
		width: metadata.width,
	};

	await fs.writeFile(`${sidecarPath}.tmp`, `${JSON.stringify(sidecar, null, 2)}\n`);
	await fs.rename(`${sidecarPath}.tmp`, sidecarPath);

	return {
		blurhash,
		filePath: targetPath,
		height: metadata.height ?? 0,
		sidecarPath,
		width: metadata.width ?? 0,
	};
}

const inputPaths = process.argv.slice(2);
const photoInputs = inputPaths.length > 0 ? inputPaths : ["src/content"];
const imagePaths = (await Promise.all(photoInputs.map((inputPath) => collectImagePaths(inputPath))))
	.flat()
	.sort();

if (imagePaths.length === 0) {
	console.log("No photos found to process.");
} else {
	const processedPhotos = await Promise.all(imagePaths.map((filePath) => processPhoto(filePath)));

	for (const photo of processedPhotos) {
		console.log(
			`Processed ${photo.filePath} (${photo.width}x${photo.height}), sidecar ${photo.sidecarPath}`,
		);
	}
}
