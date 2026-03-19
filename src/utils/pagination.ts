import type { PaginationLink } from "@/types";

interface PaginationUrls {
	next?: string | undefined;
	prev?: string | undefined;
}

interface PaginationLabels {
	next: string;
	prev: string;
}

export function getPaginationLinks(urls: PaginationUrls, labels: PaginationLabels) {
	const links: {
		nextUrl?: PaginationLink;
		prevUrl?: PaginationLink;
	} = {};

	if (urls.prev) {
		links.prevUrl = {
			text: labels.prev,
			url: urls.prev,
		};
	}

	if (urls.next) {
		links.nextUrl = {
			text: labels.next,
			url: urls.next,
		};
	}

	return links;
}
