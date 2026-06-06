# Project Architecture

Overview of website architecture, core logic, and key files for modifications.

## Project Overview

- Tech Stack: Astro 6.3, TypeScript 6, Tailwind CSS 4.3, MD/MDX, Pagefind, Biome.
- Requirements: Node.js 22.12 or newer.
- Build Output: Static files in `dist/`.

## Directory Structure

- `src/components/`: UI components for layout, blog, and notes.
- `src/content/`: Markdown and MDX files for posts, notes, and tags.
- `src/data/`: Data fetching, sorting, and tag logic.
- `src/layouts/`: Base page templates.
- `src/pages/`: File-based routes.
- `src/plugins/`: Custom markdown extensions.
- `src/scripts/`: Client-side scripts.
- `src/styles/`: Global and component styles.
- `src/utils/`: Shared utilities.

## Primary Files

- `src/layouts/Base.astro`: Base HTML layout managing themes, headers, and footers.
- `src/components/BaseHead.astro`: HTML head metadata, RSS discovery, and stylesheets.
- `src/site.config.ts`: Configuration for site title, URL, navigation, and settings.
- `astro.config.ts`: Astro integrations, plugins, and markdown configuration.

Page rendering flow:
`src/pages/*` -> `src/layouts/Base.astro` (or `BlogPost.astro`) -> components

## Content Collections

Defined in `src/content.config.ts`:

### Articles (`src/content/post/`)
- Required: `title`, `description`, `publishDate`.
- Optional: `updatedDate`, `tags`, `coverImage`, `ogImage`, `draft`, `pinned`.
- Note: Tags convert to lowercase and filter duplicates. Drafts are omitted in production.

### Notes (`src/content/note/`)
- Required: `title`, `publishDate`.
- Optional: `description`.
- Note: Requires ISO datetime format.

### Tags (`src/content/tag/`)
- Required: File ID matching a post tag. Stores custom titles and descriptions.

## Data Layer

Use functions in `src/data/` to query content collections instead of querying them directly in pages:
- `src/data/post.ts`: Retrieves, sorts, and filters posts (by tag, drafts, pinned posts) and manages tag metadata.
- `src/data/note.ts`: Retrieves, sorts, and limits notes.

## Routes

- Homepage: `src/pages/index.astro`
- Info Page: `src/pages/about.astro`
- Error Page: `src/pages/404.astro`
- Content pages: `src/pages/[...slug].astro` renders articles and notes at `/<slug>/`
- Article archive: `src/pages/posts/[...page].astro`; feed: `src/pages/rss.xml.ts`
- Note archive: `src/pages/notes/[...page].astro`; feed: `src/pages/notes/rss.xml.ts`
- Tags: `src/pages/tags/index.astro` (all tags), `[tag]/[...page].astro` (tagged articles)
- Legacy `/posts/<slug>/` and `/notes/<slug>/` redirects are defined in `src/utils/content-routes.ts`.

## Layouts

- `src/layouts/Base.astro`: Renders main page wrapper, HTML head, theme provider, header, footer, and main content slot.
- `src/layouts/BlogPost.astro`: Renders blog articles. Handles metadata, reading time, table of contents, webmentions, and Pagefind indexing.

## Components and Features

### Header
Assembled from components in `src/components/layout/`. Uses `menuLinks` from `src/site.config.ts` for links, and `mobile-nav-toggle.ts` for responsive styling.

### Search
Uses Pagefind in `src/components/Search.astro`.
- Indexes only elements marked with `data-pagefind-body`.
- Generates indices during build step (`pagefind --site dist`).
- Open search modal with `Cmd/Ctrl + K`.

### Themes
Uses a `data-theme` attribute on `document.documentElement`.
- Managed by `ThemeProvider` (prevents screen flashes) and toggled via `ThemeToggle.astro`.
- Styles are defined in `src/styles/tokens.css`.

## Styling

Global styles load through `src/styles/global.css`.
- `tokens.css`: Custom theme colors, variables, and Tailwind extensions.
- `utilities.css`: Layout helper classes.
- prose.css: Typography configurations.
- `components/*.css`: Component-specific styles.
- `blocks/search.css`: Custom search element styles.

Prefer Tailwind utility classes for building layouts.

## Markdown Processing

Plugins configured in `astro.config.ts`:
- Rehype: Generates heading IDs, appends anchor links, protects external links, and unwraps direct images.
- Remark: Adds estimated reading time, parses directive colon syntax, embeds GitHub cards, and enables admonition blocks (notes, tips, warnings).

## SEO, RSS, and Webmentions

- SEO: Managed in `src/components/BaseHead.astro`.
- RSS Feeds: Built automatically from post and note collections.
- Social Images: `public/social-card.png` is the default; articles can override it with the `ogImage` frontmatter field.
- Webmentions: Integrated using standard headers, automated feed fetching, and layout widgets.

## Dependency Strategy

Dependencies are updated using `pnpm`. Current constraints:
- Node.js: Requires Node.js 22.12+ (Astro 6 minimum).
- Styles: cssnano 8 requires declaring `postcss` explicitly as a devDependency.
- Search & Formatters: Sharp (image processing and OG validation), Pagefind (static indexer), and Biome (linter and formatter) must match current build target capabilities.

## Configuration Variables

Configured in `astro.config.ts`:
- `WEBMENTION_API_KEY`: Private token for webmention authentication.
- `WEBMENTION_URL`: Public feed URL.
- `WEBMENTION_PINGBACK`: Public pingback receiving endpoint.

## Component Editing Checklist

- Styles & site config: `src/styles/tokens.css`, `src/site.config.ts`
- Menu links: `src/site.config.ts`
- Header navigation: `src/components/layout/`
- Article layout: `src/layouts/BlogPost.astro`, `src/components/blog/`
- Search & styles: `src/components/Search.astro`, `src/styles/blocks/search.css`
- Content schemas: `src/content.config.ts`, `src/data/`
- Markdown configuration: `astro.config.ts`, `src/plugins/`

## Project Rules

- Use `pnpm` exclusively.
- All styles must import through `src/styles/global.css`.
- Draft posts are excluded from feeds and production builds.
- Tags are automatically forced to lowercase at the schema level.
- Use `data-pagefind-body` to mark elements for indexing.
- Pinned homepage posts are fetched from the global post collection.
- Navigation links must use `menuLinks` in `src/site.config.ts`.
- Themes must toggle via the `data-theme` HTML attribute.

## Setup and Reading Guide

Recommended files to read in order:
1. `README.md`
2. `src/site.config.ts`
3. `astro.config.ts`
4. `src/content.config.ts`
5. `src/layouts/Base.astro`
6. `src/pages/index.astro`
7. `src/pages/[...slug].astro` and the archive routes under `src/pages/posts/` and `src/pages/notes/`
8. `src/layouts/BlogPost.astro`
9. `src/components/Search.astro`
10. `src/styles/global.css`
