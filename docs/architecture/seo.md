# SEO Architecture & Refactor Plan

*Last updated: 2026-06-01 — **IMPLEMENTED** on branch `worktree-seo-refactor`. Full pass: structured data + `x-default` hreflang + CC0/`isBasedOn` signals + app-store links.*

**Implementation notes (decisions made during the build):**
- **Hand-rolled JSON-LD types**, not `schema-dts` — keeps this branch free of a dependency/lockfile change; builders return `Record<string, unknown>` nodes. Revisit if the graph grows.
- **`dateModified` = MDX mtime**, via the new shared `suttaMtime` helper (`src/lib/sutta-dates.ts`), now used by both the sitemap and `Article`. Caveat: git doesn't preserve mtimes, so on a fresh CI checkout this resolves to *checkout/deploy time*, not authoring date — same effective behavior the sitemap already had (it was silently falling back to build time because it pointed at the removed `src/content` path; that path bug is fixed here too).

This doc audits the current SEO surface, then specifies the refactor. The headline finding: the **metadata layer is already mature** (sitemap, robots, canonical, hreflang, OG/Twitter, per-page descriptions). The one material gap is **structured data (JSON-LD), which is entirely absent**. This refactor is therefore mostly *additive* — a new structured-data layer plus a few signal upgrades — not a rewrite.

Related docs: [`og-cards.md`](./og-cards.md) (the link-preview image system), [`sitemap.md`](../sitemap.md) (URL + locale architecture), [`i18n.md`](./i18n.md).

---

## 1. Current state (audit)

| Surface | File | Status |
|---|---|---|
| XML sitemap | `src/app/sitemap.ts` | ✅ EN+ZH static + 6 EN + 6 ZH sutta pages; `lastModified` from MDX mtime; priorities; transactional routes omitted |
| robots | `src/app/robots.ts` | ✅ allows `/`, disallows `/download/donate`, `/download/thank-you`, `/api/`; declares `sitemap` + `host` |
| metadataBase | `src/app/layout.tsx:37` | ✅ `new URL(SITE_URL)` |
| Shared OG/site constants | `src/lib/og-meta.ts` | ✅ `SITE_NAME`, `SITE_URL`, `SITE_DESCRIPTION`, `ogBase(locale)` |
| Canonical + hreflang | every `page.tsx` | ✅ `alternates.canonical` + `languages` (`zh-Hans`↔`en`) |
| Per-sutta metadata | `src/app/[slug]/page.tsx` + `zh` twin | ✅ title, description (`subtitle`), OG `article`, Twitter `summary_large_image` |
| OG images | `src/app/**/opengraph-image.tsx` + `src/lib/og-card.tsx` | ✅ per-page, brand template, adaptive sizing |
| Structured data (JSON-LD) | — | ❌ **none anywhere** |
| `x-default` hreflang | — | ❌ only `zh-Hans`/`en` pairs, no `x-default` |
| License / source lineage signals | `canonical-links.ts` exists (data) | ⚠️ data present, not surfaced to crawlers as `license`/`isBasedOn` |

**Conclusion: ready.** The architecture is clean, centralized, and locale-keyed. Nothing structural blocks the refactor.

---

## 2. Goals

1. Add **JSON-LD structured data** so Google understands the site (`WebSite`, `Organization`) and each sutta page (`Article` + `BreadcrumbList`), enabling richer SERP treatment and stronger entity/E-E-A-T signals.
2. Advertise the project's **CC0 license and canonical Pali-source lineage** (`license`, `isBasedOn`) — high-value and unusually credible for a public-domain text.
3. Close the **`x-default` hreflang** gap.
4. Keep everything **`output: 'export'`-compatible** — pure build-time generation, no runtime, no new API routes (per `CLAUDE.md`).

Non-goals: keyword meta tags (ignored by Google), a `SearchAction` (no site-search endpoint exists — see §7), AMP, or any change to URL structure / slugs.

---

## 3. Proposed design

### 3.1 New module: `src/lib/structured-data.ts`

Pure builder functions that return plain JS objects (the JSON-LD graph). No React, no fs — mirrors the platform-agnostic style of `og-meta.ts`. Keeps schema logic testable and out of the page components.

```ts
// shapes are illustrative — finalize field set during impl
export function websiteJsonLd(locale: Locale): WithContext<WebSite>
export function organizationJsonLd(): WithContext<Organization>
export function suttaJsonLd(locale: Locale, slug: SuttaSlug): WithContext<Article>
export function breadcrumbJsonLd(items: {name: string; url: string}[]): WithContext<BreadcrumbList>
```

Use the `schema-dts` types (dev-dependency, types-only — zero runtime weight) for compile-time correctness of the graph. (Decision point: adopt `schema-dts` vs. hand-rolled `Record<string, unknown>`. Recommend `schema-dts` — it catches schema typos at build time.)

### 3.2 New component: `src/components/JsonLd.tsx`

A tiny server component rendering the graph as a script tag:

```tsx
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify is XSS-safe here (no user input); escape `<` defensively
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
```

### 3.3 Injection points

| Schema | Where | Locale handling |
|---|---|---|
| `Organization` + `WebSite` | `src/app/layout.tsx` (once, site-wide) | default `en`; the `/zh` home additionally emits a `zh`-`inLanguage` `WebSite` on its own page |
| `Article` + `BreadcrumbList` | `src/app/[slug]/page.tsx` + `src/app/zh/[slug]/page.tsx` | `inLanguage` from the page locale |

Rendering JSON-LD in RSC body is fully static-export-compatible (it's just markup in the prerendered HTML).

### 3.4 Sutta `Article` field mapping

| JSON-LD field | Source |
|---|---|
| `headline` / `name` | `getMeta(locale, slug).title` |
| `description` | `getMeta(locale, slug).subtitle` (or `teaser` for a longer snippet) |
| `inLanguage` | `en` / `zh-Hans` |
| `datePublished` / `dateModified` | MDX file mtime (same source as `sitemap.ts` — extract a shared `suttaMtime` helper) |
| `image` | the per-slug OG image URL (`/{slug}/opengraph-image` / `…-card`) |
| `author` / `publisher` | `Organization` ("Plain Dharma") |
| `license` | `https://creativecommons.org/publicdomain/zero/1.0/` |
| `isBasedOn` | `CANONICAL_LINKS[slug]` → SuttaCentral URL + `paliReference` (e.g. `SN 56.11`) |
| `url` / `mainEntityOfPage` | canonical page URL |

`canonical-links.ts` already holds `paliName`, `paliReference`, and per-locale `linksByLocale` — exactly the lineage data `isBasedOn` wants. No new content authoring required.

### 3.5 `x-default` hreflang

Add a shared helper so every page's `alternates.languages` includes `x-default` (→ the EN URL). Centralize the alternates construction (currently hand-written per page) in a small `altLanguages(path)` helper in `og-meta.ts` to prevent drift.

### 3.6 App store links (iOS + Android)

The mobile app (`apps/mobile`, bundle `com.plaindharma.app`) gets a web presence in two places — structured data and visible badges. **Both can land now and "wait for publishing"**: the URLs resolve to a store 404 until the listings go live, so we gate the *visible* badges behind a flag while letting the markup ship.

Single source of truth — a new `src/lib/app-links.ts`:

```ts
export const APP_LINKS = {
  ios:     "https://apps.apple.com/app/id6774981366",
  android: "https://play.google.com/store/apps/details?id=com.plaindharma.app",
  published: false, // flip to true on store approval — gates visible badges only
} as const;
```

**Structured data.** Add a `MobileApplication` node (schema.org subtype of `SoftwareApplication`) and reference both store URLs from `Organization.sameAs`:

| JSON-LD field | Value |
|---|---|
| `@type` | `MobileApplication` |
| `name` | "Plain Dharma" |
| `operatingSystem` | `"iOS, Android"` |
| `applicationCategory` | `"BookApplication"` |
| `offers` | `{ @type: Offer, price: "0", priceCurrency: "USD" }` (free) |
| `installUrl` / `downloadUrl` | `APP_LINKS.ios` + `.android` |
| `publisher` | `Organization` (`@id` ref) |
| `inLanguage` | `["en", "zh-Hans"]` |

`Organization.sameAs` gains `[APP_LINKS.ios, APP_LINKS.android]`. The `MobileApplication` graph can ship regardless of `published` — store-listing structured data referencing a pending app is harmless, and it's discovered the moment the listing flips live.

**UI badges.** Render official **App Store** + **Google Play** badge SVGs on `/download` (the natural home — it's already the "get the dharma" hub) and optionally the footer. Wrap in `APP_LINKS.published &&` so they appear only once the apps are approved — until then the structured data is present but no dead badge is shown to users. (Alternative if you'd rather tease: show the badges now with a "Coming soon" caption and no link — decide during impl.)

---

## 4. File-by-file change list (implementation checklist)

- [x] ~~`package.json` — `schema-dts`~~ → chose hand-rolled types (see notes above).
- [x] `src/lib/structured-data.ts` — **new**: builders incl. `mobileApplicationJsonLd`; `graph()`, `siteJsonLd`, `suttaPageJsonLd`.
- [x] `src/lib/app-links.ts` — **new**: `APP_LINKS` (iOS + Android URLs + `published` flag).
- [x] `src/lib/sutta-dates.ts` — **new**: shared `suttaMtime` (reads real `packages/content` MDX path).
- [x] `src/components/JsonLd.tsx` — **new**: script-tag renderer.
- [x] `src/lib/og-meta.ts` — `altLanguages()` helper (canonical + `zh-Hans`/`en` + `x-default`) + CC0 `LICENSE_URL`.
- [x] `src/app/layout.tsx` — `<JsonLd>` for `Organization` (+ `sameAs` store URLs) + `WebSite` + `MobileApplication`.
- [x] `/download` page — App Store / Google Play CTAs gated on `APP_LINKS.published`, using the **official badges** (Apple SVG + Google PNG) in `public/badges/`.
- [x] `src/app/[slug]/page.tsx` + `zh/[slug]/page.tsx` — `<JsonLd>` `Article` + `BreadcrumbList`; `alternates` → `altLanguages`.
- [x] Static-page sweep — all 6 EN + 6 ZH pages use `altLanguages` (`x-default` everywhere).
- [x] `src/app/sitemap.ts` — uses shared `suttaMtime` (also fixes the stale `src/content` path).
- [x] `docs/architecture/seo.md` — flipped to implemented. *(TODO: cross-link from `overview.md` when convenient.)*

### Verification done
- `pnpm lint` — clean for all changed files (only pre-existing `apps/mobile` `require()` errors remain).
- `tsc --noEmit` — exit 0, zero errors.
- Standalone render of `siteJsonLd` + `suttaPageJsonLd` (EN + ZH) — valid JSON, correct `@id` cross-refs, locale tags, `isBasedOn`, CC0, app links.
- **Still to do before merge:** Google Rich Results Test against a preview deploy; confirm one well-formed `<script type="application/ld+json">` per page in `view-source`.

---

## 5. Validation (no test runner configured)

1. **Standalone render check** — a throwaway tsx script (pattern already used for OG previews) that calls the builders and prints the graph; eyeball every sutta + the site graph.
2. **Google Rich Results Test** / **Schema.org validator** — paste rendered HTML from a local `pnpm build` (or a preview deploy) for `Article` + `BreadcrumbList` validation.
3. **`pnpm lint`** must stay clean.
4. **Build** once to confirm static export still succeeds (clean up artifacts after — per project preference, prefer lint, build only to verify).
5. Spot-check `view-source` on a sutta page for a single well-formed `<script type="application/ld+json">` per schema, valid JSON, correct `inLanguage` per locale.

---

## 6. Risks & mitigations

- **Concurrent agents** — this branch is isolated in a worktree off clean `main`; the hot files (`layout.tsx`, per-route `page.tsx`) are exactly where other agents work, so rebase/merge carefully before landing.
- **Duplicate/conflicting schema** — emit exactly one node per type per page; don't repeat `Organization` on every page (site-wide once in layout, referenced by `@id` from `Article.publisher`).
- **Stale dates** — bind `Article.dateModified` to the same mtime source as the sitemap so they never disagree.
- **ZH glyph/locale correctness** — `inLanguage: "zh-Hans"`, `Organization` name stays "Plain Dharma" (brand, not translated).

## 7. Deferred / reserved

- **`SearchAction` on `WebSite`** — only meaningful with a real search endpoint; the site has none. Revisit if site-search ships.
- **`AudioObject` on sutta pages** — the narrations could be marked up for audio-rich results, but the manifest/asset wiring is non-trivial; defer to a follow-up once core schema lands.
- **`/translations` & `/print`** routes (reserved in `sitemap.md`) — add to sitemap + structured data when built.
