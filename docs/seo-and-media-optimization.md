# SEO, Microformats, and Media Optimization Guide

This document outlines the implemented architecture, standards, and automation scripts used to achieve search engine optimization (SEO), IndieWeb semantic microformats support, and optimized media compression within the project.

---

## 1. Microformats2 Semantic Markup

Microformats2 is a standard for adding semantic markup to HTML, allowing feeds, search engines, and web syndication tools to parse posts and author information automatically.

### Semantic Schema for Articles

Every article container in `src/layouts/BlogPost.astro` is structured with the following microformats classes:

- **`h-entry`**: The root class applied to the main article element container.
- **`p-name`**: Applied to the article title heading element (`<h1>`), denoting the post title.
- **`dt-published`**: Applied to the primary publication date time element.
- **`dt-updated`**: Applied to the updated date time element (if present).
- **`e-content`**: Applied to the element wrapping the main post content slot (`<slot />`), telling feed parsers exactly where the post body starts and ends.
- **`p-author h-card`**: A nested card containing author metadata.

### HTML Structure Example

The implemented integration pattern in `src/layouts/BlogPost.astro` and `src/components/blog/Masthead.astro` is:

```html
<article class="h-entry grow break-words" data-pagefind-body>
  <!-- Masthead with title and date -->
  <div id="blog-hero">
    <h1 class="p-name page-title text-[2.7rem]">{title}</h1>
    <p>
      <time class="dt-published" datetime={publishDate.toISOString()}>
        {formattedPublishDate}
      </time>
      {updatedDate && (
        <span>
          Updated: <time class="dt-updated" datetime={updatedDate.toISOString()}>{formattedUpdatedDate}</time>
        </span>
      )}
    </p>
  </div>

  <!-- Hidden/Visible Author Card (IndieWeb requirement) -->
  <div class="p-author h-card hidden" aria-hidden="true">
    <a class="u-url p-name" href="https://evilar.me/">Chris Williams</a>
    <img class="u-photo" src="/icon.svg" alt="" />
  </div>

  <!-- Main Body Content -->
  <div class="e-content prose">
    <slot />
  </div>
</article>
```

---

## 2. Permissive Robots.txt & Sitemaps

To maximize visibility and indexing by all crawlers—including traditional search engines and AI web scrapers—the site generates a fully permissive `robots.txt` alongside an automated XML sitemap.

This is managed using the `astro-robots-txt` and `@astrojs/sitemap` integrations in `astro.config.ts`.

### Configuration in `astro.config.ts`

```typescript
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://evilar.me",
  integrations: [
    sitemap(),
    robotsTxt({
      policy: [
        {
          userAgent: "*",
          allow: "/",
        },
      ],
      sitemap: true,
    }),
  ],
});
```

This ensures that:
- Every search engine, AI bot, and archiver is allowed full access (`allow: /`).
- The sitemap is automatically linked at the bottom of the generated `robots.txt` for easy discovery.

---

## 3. Photographic Media & Blurhash Pipeline

To keep photographic assets organized and ensure fast load times, photos can be normalized before publication with `pnpm media:photos`.

### The Pipeline Process

1. **Date-Based Renaming**: Raw images are renamed based on their EXIF capture timestamp into the standardized format: `p-YYYY-MM-DD-HH-MM-SS.ext`. If EXIF data is unavailable, filesystem modification time is used.
2. **Dimension Constraints**: High-resolution photos are resized to a maximum width of `1440px`. This keeps files light while remaining razor-sharp on retina screens.
3. **Blurhash Generation**: A lightweight 32x32 color-matrix representation (**Blurhash**) is extracted and saved as a JSON sidecar file alongside the photo:
   - Example: `p-2025-10-12-14-30-00.json` containing `{"blurhash": "L6PZ|~yD?.jc00Rj?aW-~qj[fQay"}`.
4. **Progressive Rendering Metadata**: Sidecar JSON includes `src`, `width`, `height`, and `blurhash`. Article cover images can opt into placeholders by copying the generated Blurhash value into `coverImage.blurhash`; `src/components/blog/Masthead.astro` converts it to a tiny SVG background with `src/utils/blurhash.ts`.

### Photo Processing Script

The implementation lives in `scripts/process-photos.ts` and can process one or more files or directories:

```bash
pnpm media:photos src/content/post/my-gallery
```

Without arguments, the script scans `src/content`.

---

## 4. Git Pre-Commit AVIF Image Optimizer

To prevent heavy `.jpg`, `.jpeg`, and `.png` files from bloating the Git repository and dragging down web performance, a pre-commit Git hook converts new assets to the highly efficient `.avif` format automatically.

### AVIF Compression Settings

AVIF is exceptionally efficient. To maintain visual fidelity without any noticeable compression artifacts, we use a balanced quality configuration:
- **Target Quality**: `70` (visibly lossless, yet saves up to 80% space compared to high-quality JPEGs).
- **Effort Level**: `4` or `5` (compromise between compression speed and file size reduction).
- **Non-AVIF Source Only**: The optimizer only converts `.jpg`, `.jpeg`, and `.png` inputs. If an image is already in `.avif` format, it skips it entirely to prevent unnecessary re-compression.

### Optimization Script (`scripts/img-compress-precommit.ts`)

Here is the TypeScript implementation for the automated pre-commit hook script:

```typescript
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export async function compressToAvif(filePath: string) {
  const { dir, name, ext } = path.parse(filePath);
  const lowerExt = ext.toLowerCase();

  // If already an AVIF image, skip processing
  if (lowerExt === ".avif") {
    console.log(`[SKIP] Already AVIF: ${filePath}`);
    return;
  }

  // Only process standard formats
  if (![".jpg", ".jpeg", ".png"].includes(lowerExt)) {
    return;
  }

  const avifPath = `${dir}/${name}.avif`;
  console.log(`[OPTIMIZE] Converting ${filePath} -> ${avifPath}`);

  try {
    const buffer = await fs.readFile(filePath);
    const image = sharp(buffer);

    // Bake EXIF orientation data into the physical pixels before stripping EXIF metadata
    await image
      .rotate()
      .avif({
        quality: 70,     // Highly optimized visual fidelity
        effort: 4,       // Balances speed and size
      })
      .toFile(avifPath);

    await fs.unlink(filePath);
    console.log(`[SUCCESS] Created ${name}.avif and removed source.`);
  } catch (error) {
    console.error(`[ERROR] Failed to optimize image ${filePath}:`, error);
  }
}
```

### Git Hook Integration

To register this compression step automatically before each commit, `simple-git-hooks` and `lint-staged` are configured in `package.json`:

```json
{
  "scripts": {
    "prepare": "simple-git-hooks"
  },
  "simple-git-hooks": {
    "pre-commit": "pnpm exec lint-staged"
  },
  "lint-staged": {
    "**/*.{jpg,jpeg,png}": [
      "pnpm exec tsx scripts/img-compress-precommit.ts"
    ]
  }
}
```
