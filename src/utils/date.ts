import type { CollectionEntry } from "astro:content";
import { siteConfig } from "@/site.config";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATETIME_WITH_OFFSET_PATTERN =
	/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

export type DateInputKind = "date" | "datetime";

export function isValidDate(value: unknown): value is Date {
	return value instanceof Date && Number.isFinite(value.getTime());
}

function createUtcDate(year: number, month: number, day: number): Date | null {
	const date = new Date(Date.UTC(year, month - 1, day));

	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}

	return date;
}

function parseDateOnlyString(value: string): Date | null {
	const match = DATE_ONLY_PATTERN.exec(value);

	if (!match) {
		return null;
	}

	const [, year, month, day] = match;
	return createUtcDate(Number(year), Number(month), Number(day));
}

function parseIsoDatetimeString(value: string): Date | null {
	if (!ISO_DATETIME_WITH_OFFSET_PATTERN.test(value)) {
		return null;
	}

	const date = new Date(value);
	return isValidDate(date) ? date : null;
}

export function parseStrictDateInput(value: string | Date, kind: DateInputKind): Date {
	if (value instanceof Date) {
		if (isValidDate(value)) {
			return value;
		}

		throw new Error("Date object must be valid");
	}

	const normalizedValue = value.trim();
	const parsedDate =
		kind === "date"
			? parseDateOnlyString(normalizedValue)
			: parseIsoDatetimeString(normalizedValue);

	if (parsedDate) {
		return parsedDate;
	}

	throw new Error(
		kind === "date"
			? "Expected a strict YYYY-MM-DD date string"
			: "Expected a strict ISO 8601 datetime string with timezone offset",
	);
}

export function getFormattedDate(
	date: Date | undefined,
	options?: Intl.DateTimeFormatOptions,
): string {
	if (!isValidDate(date)) {
		return "Invalid Date";
	}

	const formattedDate = new Intl.DateTimeFormat(siteConfig.date.locale, {
		...(siteConfig.date.options as Intl.DateTimeFormatOptions),
		...options,
	}).format(date);

	if (siteConfig.date.locale === "ru-RU") {
		return formattedDate.replace(/\sг\.?$/, "").replace(/\./g, "");
	}

	return formattedDate;
}

export function collectionDateSort(
	a: CollectionEntry<"post" | "note">,
	b: CollectionEntry<"post" | "note">,
) {
	return b.data.publishDate.getTime() - a.data.publishDate.getTime();
}
