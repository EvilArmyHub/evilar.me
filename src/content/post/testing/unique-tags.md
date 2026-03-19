---
title: "Проверка уникальности тегов"
publishDate: "2023-01-30"
description: "Материал для проверки удаления дублирующихся тегов независимо от регистра"
tags: ["blog", "blog", "Blog", "test", "bloG", "Test", "BLOG"]
---

## Проверка zod-трансформации

Если открыть файл `src/content/post/unique-tags.md`, в массиве тегов можно увидеть несколько повторов слова blog в разном регистре.

Они удаляются функцией `removeDupsAndLowercase` из `src/content/config.ts`.
