# AGENTS Guide

## Project Overview

- Stack: Astro 6, TypeScript, Tailwind CSS 4, MD/MDX content collections, Pagefind search, Biome linting.
- Main config: `astro.config.ts`, `src/content.config.ts`, `src/site.config.ts`, `tailwind.config.ts`.
- Content lives in `src/content/post`, `src/content/note`, and `src/content/tag`.
- Layout and UI live in `src/layouts` and `src/components`.
- Custom markdown plugins live in `src/plugins`.

## Package Manager Priority

- Use `pnpm` for all dependency and script workflows in this repository.
- Do not introduce `npm` or `yarn` commands into docs, scripts, automation, or Docker setup unless explicitly requested.
- Respect the lockfile: `pnpm-lock.yaml` is the source of truth.
- The repo declares `packageManager` in `package.json`; prefer `corepack enable` when bootstrapping environments.

## Common Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm check
pnpm lint
pnpm format
```

## Working Notes

- Keep changes compatible with Astro 6 APIs and existing content collection types.
- Prefer small, targeted edits that preserve the current site structure and theme behavior.
- When editing docs, keep examples pnpm-first and align file paths with the current repo layout.
- Validate significant changes with `pnpm check` and `pnpm build`.
