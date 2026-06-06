# Evil Army Community Website

Official portal and community website for Evil Army.

## Features

- Fast static pages built with Astro.
- Client-side search using Pagefind.
- Code syntax highlighting via Expressive Code.
- Blog posts and short notes.

## Content Management

Add markdown or MDX files to these directories:
- Articles: `src/content/post/`
- Notes: `src/content/note/`
- Tag metadata: `src/content/tag/`

### Article Metadata (Frontmatter)

- title: Heading and search title (maximum 60 characters).
- description: SEO description (50 to 160 characters).
- publishDate: ISO publication date.
- updatedDate: Optional update date.
- tags: List of tags.
- coverImage: Optional image path and alt text.
- ogImage: Optional social share image path.
- draft: Set to true to hide from production.

### Note Metadata (Frontmatter)

- title: Title (maximum 60 characters).
- description: Optional SEO description.
- publishDate: ISO publication date.

### Tag Metadata (Frontmatter)

- title: Optional header override.
- description: Optional custom description.

## Development

Install dependencies:
```bash
pnpm install
```

Start development server:
```bash
pnpm dev
```

Build static site:
```bash
pnpm build
```

Preview local build:
```bash
pnpm preview
```

Run checks and formatting:
```bash
pnpm check
pnpm lint
pnpm format
```

## Technical Stack

- Astro 6.3
- Tailwind CSS 4
- TypeScript
- Biome
- Sharp (image processing and social image validation)

This project is a fork of [astro-theme-cactus](https://github.com/chrismwilliams/astro-theme-cactus).
