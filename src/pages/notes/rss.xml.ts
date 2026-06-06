import rss from "@astrojs/rss";
import { getAllNotes } from "@/data/note";
import { siteConfig } from "@/site.config";
import { getContentPath, getLegacyContentRoute } from "@/utils/content-routes";

export const GET = async () => {
	const notes = await getAllNotes();

	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: import.meta.env.SITE,
		items: notes.map((note) => {
			const legacyRoute = getLegacyContentRoute("note", note.id);

			return {
				title: note.data.title,
				pubDate: note.data.publishDate,
				link: getContentPath(note.id),
				customData: legacyRoute
					? `<guid isPermaLink="true">${new URL(legacyRoute.source, siteConfig.url).href}</guid>`
					: undefined,
			};
		}),
	});
};
