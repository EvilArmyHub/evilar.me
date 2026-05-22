import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const AVIF_QUALITY = 70;
const AVIF_EFFORT = 4;

function isConvertibleImage(filePath: string) {
	return SOURCE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function stageReplacement(sourcePath: string, avifPath: string) {
	execFileSync("git", ["add", avifPath], { stdio: "inherit" });
	execFileSync("git", ["rm", "--cached", "--ignore-unmatch", sourcePath], { stdio: "ignore" });
}

export async function compressToAvif(filePath: string) {
	if (!isConvertibleImage(filePath) || !existsSync(filePath)) {
		return;
	}

	const { dir, name } = path.parse(filePath);
	const avifPath = path.join(dir, `${name}.avif`);

	await sharp(filePath)
		.rotate()
		.avif({
			effort: AVIF_EFFORT,
			quality: AVIF_QUALITY,
		})
		.toFile(avifPath);

	await fs.unlink(filePath);
	stageReplacement(filePath, avifPath);
	console.log(`Converted ${filePath} -> ${avifPath}`);
}

const filePaths = process.argv.slice(2);

if (filePaths.length === 0) {
	console.log("No staged JPEG or PNG files to optimize.");
} else {
	await Promise.all(filePaths.map((filePath) => compressToAvif(filePath)));
}
