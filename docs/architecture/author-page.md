# Author Page (`/author`)

An English-only page about the editor, Alex Miller, linked from the footer byline ("edited by Alex Miller").

## Key files

| File | Role |
|---|---|
| `src/app/author/page.tsx` | Route, metadata (`type: "profile"`, `altLanguages("/author", { zh: false })`), Person JSON-LD |
| `src/views/AuthorView.tsx` | The page: headshot with caption, bio, editing method, "Elsewhere" links |
| `src/app/author/opengraph-image.tsx` | Link-preview card (reuses the `how-to-decide` illustration) |
| `src/lib/author.ts` | `AUTHOR_NAME` + `AUTHOR_LINKS` — one list feeding both the page and the JSON-LD `sameAs`, so they can't drift |
| `src/lib/structured-data.ts` | `personJsonLd()` with a stable `@id` (`/author#person`); `bookJsonLd()` references it as `editor` |
| `public/author/alex-miller.jpg` | Headshot, 1000px / ~138 KB. Committed (small), not on the CDN |
| `src/components/layout/Footer.tsx` | Byline links to `/author` (was aimhuge.com) |

## Patterns

- The page is plain `<img>` (output:'export'-safe), like `/how-it-was-made`.
- Credits stay honest: Buddha is the author; Claude Opus translated; Alex edited. JSON-LD uses `editor`, never `author`, for Alex.
- The same bio also lives on aimhuge.com/author (separate repo); keep the two in step by hand.
- The oral-tradition sentence ("The suttas began as an oral tradition…") also appears on About (EN + ZH), the home blurb (EN + ZH), How it was made, the book's "About This Book" page (`scripts/lib/book-source.ts`), the back cover (`book/back-cover.html`) and the KDP description. Change them together.
