# AGENTS.md

## Tech Stack

- Astro 6
- TypeScript
- Tailwind CSS 4
- MDX content collections
- Pagefind search
- Biome linting and formatting
- pnpm

## Key Directories

- `src/pages/` - Astro routes, RSS feeds, and dynamic content pages.
- `src/content/` - Post, note, and tag content collections.
- `src/components/` - Reusable UI components.
- `src/layouts/` - Page and post layouts.
- `src/styles/` - Global styles, tokens, prose, utilities, and component CSS.
- `src/plugins/` - Custom markdown/remark plugins.
- `src/data/` - Content query helpers.
- `scripts/` - Media and pre-commit tooling.
- `public/` - Static assets.

## Content Rules

- Content schemas are defined in `src/content.config.ts`; follow them rather than inventing new frontmatter fields.
- Posts live in `src/content/post`; notes live in `src/content/note`; tags live in `src/content/tag`.
- Keep post titles within the configured schema limit.
- Tags are normalized by the content schema.
- Keep Russian locale behavior consistent with `src/site.config.ts`.

## Routing and Generated Output

- Routes live in `src/pages/`.
- Individual post and note pages are handled by `src/pages/[...slug].astro`.
- Post and note archives are handled by `src/pages/posts/[...page].astro` and `src/pages/notes/[...page].astro`.
- Tag pages are handled by `src/pages/tags/[tag]/[...page].astro`.
- RSS routes live under `src/pages/rss.xml.ts` and `src/pages/notes/rss.xml.ts`.
- The default OG image is `public/social-card.png`; posts can override it with `ogImage`.
- Legacy content redirects and canonical content paths are defined in `src/utils/content-routes.ts`.
- Do not edit generated output such as `dist`, `.astro`, or `node_modules`.

## Development Workflow

1. Read related files before editing.
2. Prefer existing components, layouts, utilities, styles, and content helpers.
3. Make focused changes; avoid broad refactors unless requested.
4. Keep Astro 6, content collections, MDX, and Tailwind behavior intact.
5. Align imports, naming, and style with surrounding code.

## Validation

- Use the lightest validation that matches the change.
- Content-only or docs-only edits usually need no command.
- Astro, TypeScript, component, layout, plugin, or schema changes should use `pnpm check`.
- Routing, config, Pagefind, RSS, OG image, or build pipeline changes should use `pnpm build`.
- Built OG image metadata and files can be checked separately with `pnpm check:og`.
- Content route changes should pass `pnpm check:routes`; this also runs before builds and commits.
- Use `pnpm lint` or `pnpm format` only when linting or formatting is relevant.

## Don't

- Add dependencies when the existing stack is enough.
- Change package manager, routing, linting, formatting, or content conventions without a reason.
- Rename or move content trees unless explicitly requested.
