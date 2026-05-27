# Content Pipeline — Plain Dharma

*Last updated: 2026-05-28*

Single source of truth: one MDX file per teaching. Every surface on the site
(per-teaching page, `/read`, home listing, og:image) is composed from these
files — nothing else stores the text.

## Overview

```
src/content/
     │
     ├── en/*.mdx / zh/*.mdx  ─── teaching texts per locale
     │
     ├── index.ts  ─── SUTTAS array (canonical order)
     │              ── SUTTA_BASE (slug, ordinal, pali_name)
     │              ── SUTTA_DISPLAY[locale] (title, subtitle, teaser, kicker_override)
     │              ── LOADERS[locale][slug] (dynamic import per sutta/locale)
     │              ── getMeta(locale, slug) / getSuttasInOrder(locale)
     │
     ├── strings.ts  ─── i18n UI strings (nav, audio, home, footer, etc.)
     │               ── getStrings(locale) helper
     │               ── canonicalLinks, glossary subtitles/labels
     │
     ├── drops.ts  ─── DROPS[locale][slug] (editorial one-liner per sutta)
     │              ── PREFACE[locale] / CLOSING[locale] (framing for /read)
     │
     ├── canonical-links.ts ─── CANONICAL_LINKS[locale][slug]
     │                       ── locale-keyed (EN: Access to Insight + SuttaCentral;
     │                          ZH: SuttaCentral Āgama + CBETA Taishō)
     │
     ├── glossary.ts  ─── GLOSSARY[locale][] with parallel entries
     │
     ├── audio.ts     ─── getAudioManifest(locale, slug)
     │                 ── getCombinedAudioManifest(locale)
     │                 ── partial manifest support (skips missing)
     │
     └── illustrations.ts   ─── getIllustrationUrl(slug) — mtime-versioned URLs
```

**Locale support:** All six suttas are available in English (EN) and Chinese (ZH). The registry is structured to add new locales without code changes — see `docs/architecture/i18n.md` for details.

## Key files

| File | Role |
|---|---|
| `src/content/{locale}/{slug}.mdx` | Authoritative text per teaching per locale (six EN files, six ZH files, etc.) |
| `src/content/index.ts` | Canonical slug order, metadata registry, locale-aware loader |
| `src/content/strings.ts` | i18n strings for UI labels, metadata descriptions, canonical-links and glossary subtitles |
| `src/content/drops.ts` | Editorial one-liners and framing prose for `/read` |
| `src/content/canonical-links.ts` | Locale-keyed Pali refs + translation links (EN vs ZH sources differ) |
| `src/content/glossary.ts` | Locale-parallel glossary entries (extracted from inline view code) |
| `src/content/illustrations.ts` | Cache-busting URL helper (reads mtime from filesystem) |

## Frontmatter convention

MDX files carry YAML frontmatter, but it is **stripped at compile time** by
`remark-frontmatter` — it does not render into the page. Metadata lives in
`SUTTA_META` in `index.ts` so it is typed and tree-shakeable.

```mdx
---
slug: fire-sermon
title: The Buddha's Third Talk: The Fire Sermon
subtitle: Given on a hilltop near Gaya...
ordinal: 3
---

The body of the teaching starts here.
```

## Data flow

```
LOADERS[locale][slug]()       →  dynamic import of .mdx module
  └── mod.default (ComponentType) rendered inside <article className="prose-dharma">

SUTTA_META[slug]              →  title / subtitle / pali_name / teaser
  └── used by: [slug]/page, read/page, home/page, generateMetadata()

getStrings(locale)            →  all UI strings including canonicalLinks, glossary labels
  
DROPS[slug]                   →  <Drop text={...} /> after each article

CANONICAL_LINKS[locale][slug] →  <CanonicalLinks locale={locale} slug={slug} />
  └── reads localized labels from getStrings(locale).canonicalLinks

GLOSSARY[locale]              →  <GlossaryView locale={locale} />
  └── reads localized subtitle from getStrings(locale).glossary
```

## Important patterns and gotchas

**Turbopack-compatible remark plugins** — `remarkPlugins` in `next.config.ts`
must use string names, not imported functions, because Rust cannot cross the
JS boundary with function references:
```ts
remarkPlugins: [["remark-frontmatter", ["yaml"]]]
```

**`LOADERS` must be exhaustive** — TypeScript will error if any `SuttaSlug` is
missing from `LOADERS[locale]`. Adding a new locale means adding a full inner
record; adding a new slug means updating both `SUTTAS` and every locale's loader.

**`getAvailableLocales(slug)`** checks `LOADERS` rather than the filesystem —
it is O(1) and works in edge runtimes. Only returns locales that have an actual
loader registered.

**One typo fix, everywhere** — edit a word in `fire-sermon.mdx` and the per-
teaching page, `/read`, og:image, and future PDF all pick it up on next build.

**`combined-suttas.md` is a generated artifact**, not a source. The six
`src/content/en/*.mdx` files are the canonical source.

## Audio narration

Audio playback is built atop the MDX content. See `docs/architecture/audio.md` for the full
TTS pipeline, per-sutta and combined playlists, and the auto-scroll-to-anchor behavior that
ties audio playback to page sections via heading anchors (generated by `rehype-slug`).

Audio URLs are cache-busted via `versionSuffix()` — each mp3 file gets a `?v=<mtime-seconds>`
suffix appended during manifest load (RSC/build time), so regenerating an mp3 automatically
invalidates cached copies.
