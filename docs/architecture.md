# Архитектура проекта

Этот документ помогает быстро понять, как устроен сайт, где лежит основная логика и в какие файлы идти при типовых изменениях.

## Что это за проект

- Стек: Astro 6, TypeScript, Tailwind CSS 4, MD/MDX content collections, Pagefind, Biome.
- Сайт статически собирается в `dist/`.
- Основные типы контента: статьи, заметки и метаданные тегов.
- Базовый layout один, а статья использует отдельный layout поверх него.

## Карта проекта

```text
src/
  components/
    layout/        Хедер, футер и связанные UI-части
    blog/          Компоненты статей, архивов, TOC, webmentions
    note/          Отрисовка заметок
  content/
    post/          Статьи
    note/          Заметки
    tag/           Контент и метаданные страниц тегов
  data/            Получение и подготовка коллекций
  layouts/         Базовые layout-файлы страниц
  pages/           Маршруты Astro
  plugins/         Пользовательские remark-плагины
  scripts/         Небольшие клиентские модули
  styles/          Глобальные стили, токены и feature/block CSS
  utils/           Общие утилиты
```

## Главные точки входа

- `src/layouts/Base.astro` — базовый каркас всех страниц: `<head>`, тема, skip link, header, main, footer.
- `src/components/BaseHead.astro` — все мета-теги, canonical, RSS discovery, manifest, webmention links и подключение `src/styles/global.css`.
- `src/site.config.ts` — центральная конфигурация сайта: title, url, locale, menu links, Expressive Code.
- `astro.config.ts` — интеграции Astro, markdown pipeline, env schema и Vite plugins.

Если нужно понять, как страница собирается целиком, обычно достаточно идти по цепочке:

`src/pages/*` -> `src/layouts/Base.astro` или `src/layouts/BlogPost.astro` -> `src/components/*`

## Контентная модель

Схемы коллекций описаны в `src/content.config.ts`.

### `post`

- Источник: `src/content/post/**/*.{md,mdx}`
- Обязательные поля: `title`, `description`, `publishDate`
- Дополнительные поля: `updatedDate`, `tags`, `coverImage`, `ogImage`, `draft`, `pinned`
- Теги приводятся к lowercase и очищаются от дублей на уровне схемы
- В production draft-посты исключаются через `getAllPosts()` из `src/data/post.ts`

### `note`

- Источник: `src/content/note/**/*.{md,mdx}`
- Обязательные поля: `title`, `publishDate`
- `description` опционален
- Для заметок используется строгий формат datetime

### `tag`

- Источник: `src/content/tag/**/*.{md,mdx}`
- Используется для дополнительных заголовков и описаний страниц тегов
- `entry.id` должен совпадать со строкой тега, которая встречается в постах

## Data layer

Подготовка коллекций вынесена в `src/data/`.

- `src/data/post.ts`
  - `getAllPosts()` — получить статьи с учетом draft-логики
  - `getSortedPosts()` — отсортировать статьи по дате
  - `getPinnedPosts()` — выбрать pinned-статьи
  - `getPostsByTag()` — отфильтровать статьи по тегу
  - `getTagMeta()` — достать метаданные тега из коллекции `tag`
  - `groupPostsByYear()` — сгруппировать статьи по году публикации
  - `getUniqueTags()` / `getUniqueTagsWithCount()` — собрать теги для страниц архивов и тегов
- `src/data/note.ts`
  - `getAllNotes()` — получить все заметки
  - `getSortedNotes()` — отсортировать заметки по дате
  - `getLatestNotes()` — взять последние N заметок

Правило: страницы должны по возможности собирать view-model из функций `src/data/*`, а не дублировать `getCollection()` и сортировки локально.

## Маршруты и их ответственность

### Основные страницы

- `src/pages/index.astro` — главная: intro, social links, pinned posts, свежие статьи и последние заметки
- `src/pages/about.astro` — статическая страница
- `src/pages/404.astro` — not found

### Статьи

- `src/pages/posts/[...page].astro` — пагинированный архив статей
- `src/pages/posts/[...slug].astro` — отдельная статья
- `src/pages/rss.xml.ts` — RSS для статей

Архив статей использует:

- `src/components/blog/archive/PinnedPostsSection.astro`
- `src/components/blog/archive/PostsYearGroup.astro`
- `src/components/blog/archive/PostsSidebar.astro`

Страница статьи использует `src/layouts/BlogPost.astro`, который добавляет:

- masthead статьи
- table of contents
- блок webmentions
- кнопку scroll-to-top

### Заметки

- `src/pages/notes/[...page].astro` — пагинированный список заметок
- `src/pages/notes/[...slug].astro` — отдельная заметка
- `src/pages/notes/rss.xml.ts` — RSS для заметок

Отрисовка заметок сосредоточена в `src/components/note/Note.astro`.

### Теги

- `src/pages/tags/index.astro` — индекс тегов
- `src/pages/tags/[tag]/[...page].astro` — пагинированная страница конкретного тега

Для тегов используется сочетание данных из постов и необязательного контента из `src/content/tag`.

## Layouts и UI-композиция

### `src/layouts/Base.astro`

Содержит инфраструктуру страницы:

- `<ThemeProvider />` в `<head>`
- `<BaseHead />` с мета-тегами
- `<Header />`
- `<main id="main">`
- `<Footer />`

Флаг `isArticleLayout` нужен для компактного варианта хедера и article-specific spacing.

### `src/layouts/BlogPost.astro`

Это layout только для статей. Он:

- вычисляет `articleDate` и social image
- вызывает `render(post)` для получения `Content`, headings и frontmatter от remark plugins
- включает `data-pagefind-body` на article content
- рендерит `Masthead`, `TOC` и `WebMentions`

Если нужно менять presentation статьи целиком, начинать стоит с этого файла.

## Header, search и theme

### Header

Хедер собран из нескольких частей:

- `src/components/layout/Header.astro` — верхний контейнер и wiring
- `src/components/layout/HeaderBrand.astro` — бренд и ссылка на главную
- `src/components/layout/HeaderNav.astro` — основная навигация
- `src/components/layout/HeaderActions.astro` — поиск, тема, mobile menu button
- `src/scripts/mobile-nav-toggle.ts` — клиентское переключение мобильного меню

Источник навигации один: `menuLinks` в `src/site.config.ts`.

### Search

Поиск работает поверх Pagefind.

- `src/components/Search.astro` — обертка feature
- `src/components/SearchButton.astro` — кнопка вызова
- `src/components/SearchDialog.astro` — диалог и mount point для Pagefind UI
- `src/scripts/site-search.ts` — клиентская логика модального окна, hotkeys и инициализации поиска
- `src/styles/blocks/search.css` — стили поискового интерфейса

Важные детали:

- реальный индекс строится только после production build
- `package.json` запускает `pagefind --site dist` в `postbuild`
- индексируются только области, помеченные `data-pagefind-body`
- у статей теги экспортируются как фильтр через `data-pagefind-filter`
- dev-режим не показывает рабочий индекс, а только оболочку поиска

### Theme

Тема работает через `data-theme` на `document.documentElement`.

- `src/components/ThemeProvider.astro` — ранняя инициализация темы, синхронизация с system preference и Astro view transitions
- `src/components/ThemeToggle.astro` — UI-переключатель темы
- `src/site.config.ts` — селекторы тем для Expressive Code
- `src/styles/tokens.css` — theme tokens и dark variant

Если правится тема, нужно учитывать и обычный UI, и code blocks Expressive Code.

## Стили

Единая точка входа — `src/styles/global.css`.

Файлы организованы по ролям:

- `src/styles/global.css` — Tailwind entrypoint и импорты остальных слоев
- `src/styles/tokens.css` — шрифты, CSS tokens, `@theme`, dark variant, базовые theme rules
- `src/styles/utilities.css` — shared base/components rules и общие utility-like классы проекта
- `src/styles/prose.css` — настройка `@utility prose`
- `src/styles/components/*.css` — стили отдельных компонентов
- `src/styles/blocks/search.css` — изолированный блок поиска

Практическое правило:

- tokens и глобальные правила — в `src/styles/*.css`
- стили конкретной feature — рядом с feature block/component CSS
- Tailwind utility-классы в Astro-шаблонах остаются основным способом локальной верстки

## Markdown pipeline

Markdown и MDX настраиваются в `astro.config.ts`.

### Rehype plugins

- `rehypeHeadingIds`
- `rehypeAutolinkHeadings`
- `rehypeExternalLinks`
- `rehypeUnwrapImages`

### Remark plugins

- `src/plugins/remark-reading-time.ts`
- `remark-directive`
- `src/plugins/remark-github-card.ts`
- `src/plugins/remark-admonitions.ts`

Отсюда берутся:

- reading time в статье
- admonitions в markdown
- GitHub card directive
- подготовка heading anchors для TOC

## SEO, RSS, OG и дополнительные интеграции

### SEO и head

`src/components/BaseHead.astro` отвечает за:

- title и description
- canonical URL
- Open Graph и Twitter meta
- favicon и manifest links
- RSS auto-discovery
- webmention links

### RSS

- `src/pages/rss.xml.ts` — статьи
- `src/pages/notes/rss.xml.ts` — заметки

RSS использует `import.meta.env.SITE`, поэтому production URL должен быть корректно задан в `site` через `astro.config.ts` и `src/site.config.ts`.

### OG images

- `src/pages/og-image/[...slug].png.ts` — генерация OG изображений через Satori
- если в посте задан `ogImage`, автоматическая генерация для него не нужна

### Webmentions

- клиентские ссылки на endpoint добавляются в `BaseHead`
- получение и подготовка данных реализованы в `src/utils/webmentions.ts`
- UI вебментшнов живет в `src/components/blog/webmentions/`

Для полноценной работы нужны env-переменные, описанные в `astro.config.ts`.

## Environment variables

Схема переменных объявлена в `astro.config.ts`:

- `WEBMENTION_API_KEY` — secret server env
- `WEBMENTION_URL` — public client env
- `WEBMENTION_PINGBACK` — public client env

Если webmention token не задан, сайт все равно собирается, но часть функций webmentions будет отключена.

## Сборка и локальная работа

Основные команды определены в `package.json`:

- `pnpm dev` — локальная разработка
- `pnpm check` — проверка Astro/types/content
- `pnpm build` — production build
- `pnpm preview` — локальный просмотр сборки

Особенность поиска: для локальной проверки именно Pagefind-поиска нужен production build, потому что индекс появляется после `postbuild`.

## Где что менять

### Изменить глобальные метаданные и бренд

- `src/site.config.ts`
- `public/icon.svg`
- `public/social-card.png`

### Изменить меню

- `src/site.config.ts`
- при необходимости визуальные детали: `src/components/layout/*`

### Добавить новый тип UI в хедер

- `src/components/layout/HeaderActions.astro`
- если нужен client behavior: `src/scripts/`

### Изменить страницу статьи

- `src/layouts/BlogPost.astro`
- `src/components/blog/*`

### Изменить поведение поиска

- `src/scripts/site-search.ts`
- `src/components/Search*.astro`
- `src/styles/blocks/search.css`

### Изменить правила контента

- `src/content.config.ts`
- затем проверить страницы и data layer в `src/data/`

### Изменить markdown-возможности

- `astro.config.ts`
- `src/plugins/*`

## Полезные инварианты

- Используем `pnpm` для всех команд и зависимостей.
- `src/styles/global.css` импортируется один раз через `src/components/BaseHead.astro`.
- Draft-посты не должны попадать в production-маршруты и RSS.
- Теги в постах нормализуются в lowercase на уровне content schema.
- `data-pagefind-body` определяет, какой контент реально индексируется поиском.
- `menuLinks` из `src/site.config.ts` — единый источник навигации.
- `data-theme` на корневом элементе — базовый контракт для темы и Expressive Code.

## Рекомендуемый маршрут знакомства с проектом

Если разработчик только подключился, самый быстрый порядок чтения такой:

1. `README.md`
2. `src/site.config.ts`
3. `astro.config.ts`
4. `src/content.config.ts`
5. `src/layouts/Base.astro`
6. `src/pages/index.astro`
7. `src/pages/posts/[...page].astro` и `src/pages/posts/[...slug].astro`
8. `src/layouts/BlogPost.astro`
9. `src/components/Search.astro` и `src/scripts/site-search.ts`
10. `src/styles/global.css` и связанные `src/styles/*.css`
