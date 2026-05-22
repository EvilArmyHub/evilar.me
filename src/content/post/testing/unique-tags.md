---
title: "Уникальные теги в коллекциях"
publishDate: "2025-09-07"
description: "Материал для проверки удаления дублирующихся тегов независимо от регистра"
tags: ["blog", "blog", "Blog", "test", "bloG", "Test", "BLOG"]
---

## Проверка zod-трансформации

Если открыть файл `src/content/post/unique-tags.md`, в массиве тегов можно увидеть несколько повторов слова blog в разном регистре.

Они удаляются функцией `removeDupsAndLowercase` из `src/content/config.ts`.
