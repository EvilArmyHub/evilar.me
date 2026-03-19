---
title: "Пример OG-изображения"
publishDate: "2023-01-27"
description: "Пример того, как добавить собственную social card через frontmatter"
tags: ["example", "blog", "image"]
ogImage: "/social-card.png"
---

## Как добавить собственное изображение для соцсетей

Этот материал показывает, как добавить к статье собственное [open graph](https://ogp.me/) изображение, также известное как OG image.
Если указать необязательное поле `ogImage` во frontmatter, [satori](https://github.com/vercel/satori) перестанет автоматически генерировать изображение для этой страницы.

Если открыть файл `src/content/post/social-image.md`, вы увидите, что `ogImage` указывает на изображение из папки `public`[^1].

```yaml
ogImage: "/social-card.png"
```

Посмотреть изображение, заданное для этой страницы шаблона, можно [здесь](https://astro-cactus.chriswilliams.dev/social-card.png).

[^1]: Сам файл изображения может лежать в любом удобном месте.
