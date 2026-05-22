import { decode } from "blurhash";

const DEFAULT_WIDTH = 32;
const DEFAULT_HEIGHT = 32;

function pixelToRgb(pixels: Uint8ClampedArray, index: number) {
	return `rgb(${pixels[index]},${pixels[index + 1]},${pixels[index + 2]})`;
}

export function getBlurhashDataUrl(
	blurhash: string,
	width = DEFAULT_WIDTH,
	height = DEFAULT_HEIGHT,
) {
	const pixels = decode(blurhash, width, height);
	const rects: string[] = [];

	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const index = 4 * (y * width + x);
			rects.push(`<rect width="1" height="1" x="${x}" y="${y}" fill="${pixelToRgb(pixels, index)}"/>`);
		}
	}

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${rects.join("")}</svg>`;
	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
