import type { AstroExpressiveCodeOptions } from "astro-expressive-code";
import type { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
	// Default attribution value for posts, SEO metadata, and dynamic social preview images when no explicit author is defined.
	author: "Evil Army Community",
	// Consistent locale formatting rules for timestamps across all articles, notes, and search index metadata.
	date: {
		locale: "ru-RU",
		options: {
			day: "numeric",
			month: "short",
			year: "numeric",
		},
	},
	// Default fallback snippet to satisfy search engine indexing requirements and web app manifest description constraints.
	description: "Лаконичный персональный сайт на Astro для заметок и статей",
	// Global document language identifier to assist web browsers, crawlers, and accessibility tools in text synthesis.
	lang: "ru-RU",
	// Social media meta tag property used by crawlers (e.g., Open Graph) to deliver properly localized preview cards.
	ogLocale: "ru_RU",
	// Primary brand name displayed in browser tabs and used as a prefix for global search indexes.
	title: "Evil Army",
	// Absolute base URL required to correctly construct fully qualified canonical links, sitemaps, and RSS feed paths.
	url: "https://evilar.me/",
};

// Used to generate links in both the Header & Footer.
export const menuLinks: { path: string; title: string }[] = [
	{
		path: "/",
		title: "Главная",
	},
	{
		path: "/posts/",
		title: "Статьи",
	},
	{
		path: "/notes/",
		title: "Заметки",
	},
];

// https://expressive-code.com/reference/configuration/
export const expressiveCodeOptions: AstroExpressiveCodeOptions = {
	styleOverrides: {
		borderRadius: "4px",
		codeFontFamily:
			'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
		codeFontSize: "0.875rem",
		codeLineHeight: "1.7142857rem",
		codePaddingInline: "1rem",
		frames: {
			frameBoxShadowCssValue: "none",
		},
		uiLineHeight: "inherit",
	},
	themeCssSelector(theme, { styleVariants }) {
		// If one dark and one light theme are available
		// generate theme CSS selectors compatible with the site's dark mode switch
		if (styleVariants.length >= 2) {
			const baseTheme = styleVariants[0]?.theme;
			const altTheme = styleVariants.find((v) => v.theme.type !== baseTheme?.type)?.theme;
			if (theme === baseTheme || theme === altTheme) return `[data-theme='${theme.type}']`;
		}
		// return default selector
		return `[data-theme="${theme.name}"]`;
	},
	// One dark, one light theme => https://expressive-code.com/guides/themes/#available-themes
	themes: ["dracula", "github-light"],
	useThemedScrollbars: false,
};
