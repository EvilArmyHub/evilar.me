# Project Architecture

This document provides a clear and concise overview of the website architecture, core logic, and key files for common modifications.

## Project Overview

- Stack: Astro 6, TypeScript, Tailwind CSS 4, MD/MDX content collections, Pagefind search, Biome linting.
- Output: Statically built to the dist/ directory.
- Core content: Blog posts, short notes, and tag metadata.

## Directory Structure

- src/components/layout: Header, footer, and basic UI blocks.
- src/components/blog: Blog-specific components, archive layouts, table of contents, and webmentions.
- src/components/note: Components for rendering short notes.
- src/content/post: Markdown/MDX files for long-form blog posts.
- src/content/note: Markdown/MDX files for short notes.
- src/content/tag: Markdown files containing metadata for tag pages.
- src/data: Core data fetching, sorting, and tag-extraction logic.
- src/layouts: Shared page wrappers and article template layouts.
- src/pages: Astro routing layer and endpoints.
- src/plugins: Custom remark markdown extensions.
- src/scripts: Lightweight client-side scripts.
- src/styles: Global style declarations, Tailwind design tokens, and block styles.
- src/utils: Common utility functions.

## Primary Entry Points

- src/layouts/Base.astro: Standard page wrapper managing HTML document setup, themes, skip links, header, main slot, and footer.
- src/components/BaseHead.astro: HTML head elements including metadata, canonical links, RSS discovery, manifest, and global stylesheet imports.
- src/site.config.ts: Global configuration parameters including site title, domain URL, locale settings, navigation links, and Expressive Code options.
- astro.config.ts: Central Astro configuration for integrations, markdown pipelines, environment schema validation, and Vite plugins.

Page rendering flow:
src/pages/* -> src/layouts/Base.astro or BlogPost.astro -> src/components/*

## Content Collections

Defined inside src/content.config.ts:

- post:
  - Source: src/content/post/**/*.{md,mdx}
  - Required: title, description, publishDate
  - Optional: updatedDate, tags, coverImage, ogImage, draft, pinned
  - Processing: Tags are automatically cleaned of duplicates and converted to lowercase during schema validation. Drafts are filtered out in production via src/data/post.ts.

- note:
  - Source: src/content/note/**/*.{md,mdx}
  - Required: title, publishDate
  - Optional: description
  - Processing: Uses strict ISO datetime formatting.

- tag:
  - Source: src/content/tag/**/*.{md,mdx}
  - Required: ID matching a tag name defined in post entries. Used to store custom titles and descriptions for tag pages.

## Data Layer

Abstracted within the src/data/ directory:

- src/data/post.ts:
  - getAllPosts(): Retrieves posts and applies draft logic.
  - getSortedPosts(): Sorts retrieved posts chronologically.
  - getPinnedPosts(): Filters out pinned posts.
  - getPostsByTag(): Filters posts by a specific tag.
  - getTagMeta(): Retrieves metadata for a specific tag.
  - groupPostsByYear(): Groups posts by calendar year.
  - getUniqueTags() / getUniqueTagsWithCount(): Extracts tags and count metrics.

- src/data/note.ts:
  - getAllNotes(): Retrieves all notes from the collection.
  - getSortedNotes(): Sorts notes chronologically.
  - getLatestNotes(): Returns the top N latest notes.

Pages should consume data through these helper functions rather than querying collections directly.

## Routing

- Primary Pages:
  - src/pages/index.astro: Homepage displaying intro text, social links, pinned posts, recent articles, and latest notes.
  - src/pages/about.astro: Static info page.
  - src/pages/404.astro: Not found page.

- Posts:
  - src/pages/posts/[...page].astro: Paginated post archive index.
  - src/pages/posts/[...slug].astro: Individual blog post pages.
  - src/pages/rss.xml.ts: Post RSS feed endpoint.

- Notes:
  - src/pages/notes/[...page].astro: Paginated notes listing index.
  - src/pages/notes/[...slug].astro: Individual note pages.
  - src/pages/notes/rss.xml.ts: Note RSS feed endpoint.

- Tags:
  - src/pages/tags/index.astro: List of all tags.
  - src/pages/tags/[tag]/[...page].astro: Paginated list of posts matching a tag.

## Layouts and Templates

- src/layouts/Base.astro:
  - Renders global components including ThemeProvider, BaseHead, Header, main element wrapper, and Footer.
  - Configures compact styles if the isArticleLayout property is active.

- src/layouts/BlogPost.astro:
  - Exclusive layout for posts.
  - Resolves metadata, dates, and social image paths.
  - Triggers the post rendering pipeline for remark/rehype processing.
  - Adds the data-pagefind-body selector to index content.
  - Integrates Masthead, TOC, WebMentions, and a scroll-to-top button.

## Header, Search, and Theme Switcher

- Header UI:
  - Assembled from Header, HeaderBrand, HeaderNav, and HeaderActions components inside src/components/layout/.
  - Utilizes mobile-nav-toggle.ts for responsive navigation styling.
  - Navigation menu list is driven entirely by menuLinks in src/site.config.ts.

- Pagefind Search:
  - Implemented in src/components/Search.astro using Pagefind UI.
  - Customized by src/styles/blocks/search.css to align with current design tokens.
  - Indexes only HTML blocks with a data-pagefind-body attribute.
  - Builds search index automatically during postbuild script execution via pagefind --site dist.
  - Supports quick triggers using Command/Control + K hotkey combinations.

- Theme Management:
  - Controlled by a data-theme attribute on document.documentElement.
  - Initialized inline by ThemeProvider to prevent flash of style issues.
  - Toggled manually by ThemeToggle.astro.
  - Style definitions reside in src/styles/tokens.css, which also feeds Expressive Code styling rules in src/site.config.ts.

## Stylesheet Architecture

Central style entry point is src/styles/global.css.

File organization:
- global.css: Tailwind CSS directives and import orchestration.
- tokens.css: Typography, colors, theme variables, and Tailwind theme extension definitions.
- utilities.css: Common utilities and general structural rules.
- prose.css: Configuration for the customized prose text utility.
- components/*.css: Modular styles for isolated interactive components.
- blocks/search.css: Isolated search layout adjustments.

Always prefer Tailwind utility classes in templates for page structure.

## Markdown Pipeline

Astro Markdown processing is configured in astro.config.ts:

- Rehype Plugins:
  - rehypeHeadingIds: Generates semantic HTML heading IDs.
  - rehypeAutolinkHeadings: Appends anchor links inside content headings.
  - rehypeExternalLinks: Appends secure attributes to outbound links.
  - rehypeUnwrapImages: Removes wrapping paragraph tags around image elements.

- Remark Plugins:
  - remarkReadingTime: Estimates reading duration.
  - remarkDirective: Parses colon syntax for directives.
  - remarkGithubCard: Embeds dynamic GitHub repository cards.
  - remarkAdmonitions: Parses admonition blocks (note, tip, caution, warning, important).

## Integrated Features

- SEO: Managed inside src/components/BaseHead.astro.
- RSS: Powered by rss.xml endpoints using the site configuration variable.
- Social Images: Generated on-demand via the og-image API endpoint using Satori (converting HTML/Tailwind to SVG) and Sharp (rendering SVG to PNG).
- Webmentions: Links are injected into page headers, fetched via utility modules, and rendered by the webmention component architecture.

## Configuration Variables

Verified inside astro.config.ts:
- WEBMENTION_API_KEY: Private server variable for authentication.
- WEBMENTION_URL: Public client feed URL.
- WEBMENTION_PINGBACK: Public pingback receiver endpoint.

## Development Workflows

Configured inside package.json:
- pnpm dev: Starts a local development server.
- pnpm check: Performs diagnostics on codebase types and frontmatter schemas.
- pnpm build: Generates static bundle and initiates search index.
- pnpm preview: Spawns local preview server to inspect built bundle.

## Component Editing Checklist

- General styling and variables: src/styles/tokens.css, src/site.config.ts
- Main menu links: src/site.config.ts
- Navigation bar layout: src/components/layout/HeaderActions.astro, src/components/layout/*
- Blog post layout: src/layouts/BlogPost.astro, src/components/blog/*
- Pagefind configuration: src/components/Search.astro, src/styles/blocks/search.css
- Database schemes: src/content.config.ts, src/data/*
- Remark custom behavior: astro.config.ts, src/plugins/*

## Architectural Invariants

- Use pnpm exclusively for package management and command execution.
- src/styles/global.css is the lone global styling sheet, imported in BaseHead.astro.
- Draft posts are strictly omitted from feeds and deployment builds.
- All tags are converted to lowercase at schema level.
- data-pagefind-body controls index inclusion for site search.
- Pinned homepage posts are selected from the global post collection, not from recent history.
- menuLinks is the single source of truth for header and footer navigation.
- data-theme is the core contract for UI styling and code snippets.

## Onboarding Route for New Developers

Suggested sequence to understand the workspace:
1. README.md
2. src/site.config.ts
3. astro.config.ts
4. src/content.config.ts
5. src/layouts/Base.astro
6. src/pages/index.astro
7. src/pages/posts/[...page].astro and [...slug].astro
8. src/layouts/BlogPost.astro
9. src/components/Search.astro
10. src/styles/global.css
