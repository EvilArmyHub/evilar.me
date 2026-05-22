# Evil Army community website

This is the official portal and community site for Evil Army.

## How the Site Works

This website is statically generated using Astro. It is built for performance, accessibility, and clean typography. The site consists of articles (posts) and short status updates (notes). It includes a static client-side search powered by Pagefind and syntax highlighting for code blocks via Expressive Code.

## Adding Content

Content is organized using Astro Content Collections. You can publish articles, notes, and customize tag descriptions by adding markdown or MDX files.

- Posts: Place your markdown files in src/content/post/.
- Notes: Place short status updates in src/content/note/.
- Tags: Place custom tag page metadata in src/content/tag/.

### Post Frontmatter Options

- title: Used as the page heading and search index title. Max length 60 characters.
- description: SEO metadata description. Length between 50 and 160 characters.
- publishDate: ISO publication date, which controls chronological sorting.
- updatedDate: Optional date representing when a post was last modified.
- tags: Array of tags to group and organize posts on tag indices.
- coverImage: Optional object defining cover picture source path and alt description text.
- ogImage: Optional custom Open Graph sharing card image path.
- draft: Boolean. Set to true to filter the post out of production deployments.

### Note Frontmatter Options

- title: Header name and title property. Max length 60 characters.
- description: Optional SEO description metadata.
- publishDate: ISO publication timestamp.

### Tag Frontmatter Options

- title: Optional header override text.
- description: Optional custom description display block.

## Development Workflow

- pnpm install: Install project package dependencies.
- pnpm dev: Spin up local environment listener.
- pnpm build: Compile optimized static pages into the dist folder.
- pnpm preview: Run a local static file server to inspect the generated bundle.
- pnpm check: Validate TypeScript types and content collections schemas.
- pnpm lint: Run Biome code quality checks.
- pnpm format: Run formatting commands to maintain clean code layout.

## Credits

This project is a fork of the excellent astro-theme-cactus template. You can explore the original implementation at github.com/chrismwilliams/astro-theme-cactus.

Technical Specifications:
- Astro v6.3
- Tailwind CSS v4
- Pagefind Search Integration
- Expressive Code Syntax Highlighting
- Satori and Sharp OG Image Generation
- MDX support for flexible layouts
