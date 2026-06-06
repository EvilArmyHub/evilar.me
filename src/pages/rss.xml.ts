import rss from "@astrojs/rss";
import { getAllPosts } from "@/data/post";
import { siteConfig } from "@/site.config";
import { getContentPath, getLegacyContentRoute } from "@/utils/content-routes";

export const GET = async () => {
	const posts = await getAllPosts();

	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: import.meta.env.SITE,
		items: posts.map((post) => {
			const legacyRoute = getLegacyContentRoute("post", post.id);

			return {
				title: post.data.title,
				description: post.data.description,
				pubDate: post.data.publishDate,
				link: getContentPath(post.id),
				customData: legacyRoute
					? `<guid isPermaLink="true">${new URL(legacyRoute.source, siteConfig.url).href}</guid>`
					: undefined,
			};
		}),
	});
};
