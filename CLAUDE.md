# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Plain Dharma (plaindharma.com) — a free, CC0 reading site for six foundational Buddhist suttas in plain modern English. Reading-first hybrid static/RSC site on Vercel: no auth, no database, no middleware, no server actions, no user state.

**Server-side carve-outs** (the only routes that aren't statically prerendered):
- `src/app/api/checkout/route.ts` — Stripe Checkout Session creator powering the donation flow on `/download/donate`.
- `src/app/api/subscribe/route.ts` — newsletter signup, called from the home-page form. Sends a welcome email to the subscriber and a notification to the owner via Resend (no contact list). `RESEND_API_KEY` is server-only so it never reaches the browser.

Everything else should remain compatible with `output: 'export'`. Don't add more API routes or server-only features without equivalent justification (paid services with keys that must stay server-side, or persistence the static site genuinely can't do).

## Commands

| Command | Notes |
|---|---|
| `pnpm dev` | Next.js dev on :8008 |
| `pnpm dev:tunnel` | Dev + ngrok in parallel; auto-prints QR for phone testing |
| `pnpm ngrok:qr` / `pnpm ngrok:status` | Reprint QR / show tunnel status |
| `pnpm build` | Production build (`next build`) |
| `pnpm lint` | ESLint (`eslint-config-next`) |
| `pnpm generate-illustrations` | Run Gemini image generation (needs `GOOGLE_GENERATIVE_AI_KEY` in `.env.local`) |
| `pnpm transparentize-illustrations` | Alpha-fade backgrounds in-place |
| `pnpm generate-audio` | TTS pipeline (run via `node --env-file=.env.local --import tsx`) |

No test runner is configured.

## Architecture (big picture)

**Content is the source of truth.** Six MDX files under `src/content/en/{slug}.mdx` are authoritative for every surface (per-teaching pages, `/read`, home listing, og:images, future PDF). `combined-suttas.md` at the repo root, if present, is a *generated artifact* — never edit it as source.

**The registry in `src/content/index.ts` is the only place that knows the canonical order, metadata, and how to load each sutta:**

- `SUTTAS` — canonical slug order (`as const` tuple)
- `SUTTA_META` — title, subtitle, ordinal, `pali_name`, teaser (typed `Record<SuttaSlug, …>`)
- `LOADERS[locale][slug]` — dynamic MDX imports; **must be exhaustive** (TS errors if a slug is missing for a locale)
- `loadSutta`, `getMeta`, `getNeighbors`, `getAvailableLocales`

Adding a new sutta = update `SUTTAS`, add to `SUTTA_META`, add to every locale in `LOADERS`, drop the MDX file. Adding a new locale = add to `SUPPORTED_LOCALES` and add a full inner `LOADERS` record. Frontmatter is stripped at compile time by `remark-frontmatter` — it does not render — so anything you need on the page must live in `SUTTA_META`.

**Routing.** App Router. English currently served at `/` with no locale prefix. `src/app/[slug]/page.tsx` calls `generateStaticParams` from `SUTTAS` and sets `dynamicParams = false`, so unknown slugs are build-time 404s. Locale routing under `app/[locale]/...` is planned but not implemented — see `docs/sitemap.md`.

**Adjacent content modules** (all under `src/content/`):
- `drops.ts` — editorial one-liners (`<Drop />`) and `PREFACE`/`CLOSING` framing for `/read`
- `canonical-links.ts` — Pali Nikaya references + scholarly translation links
- `illustrations.ts` — `getIllustrationUrl(slug)` returns `/illustrations/{slug}.png?v=<mtime>`; **Server-only** (uses `fs.statSync`), do not import into Client Components or edge code
- `audio.ts` — audio asset registry

**Illustration pipeline.** `scripts/generate-illustrations.ts` calls Gemini's image model (tries several model names — Google's preview endpoints rename often; update `MODEL_CANDIDATES` when they change), writes to `public/illustrations/{slug}.png`, skips slugs whose file already exists (safe re-runs). Then `scripts/transparentize-illustrations.ts` alpha-fades the near-white Gemini background to transparent (luma > 0.86 + low saturation, soft edge) using ImageMagick if available, else `sharp`. Optional `{slug}-dark.png` variants render via `dark:hidden` / `hidden dark:block` in `SuttaIllustration.tsx` (CSS-only, no hydration).

**Design system.** Tailwind v4 with `@theme inline` in `src/app/globals.css` aliasing raw `--color-*` CSS variables. Dark mode is a `.dark` class on `<html>`; `ThemeToggle.tsx` exports a `themeInitScript` string injected via `dangerouslySetInnerHTML` in `layout.tsx` to apply the saved/system theme before first paint (flicker-free). Reading pages use the custom `.prose-dharma` class — *not* shadcn's `prose`. Body font: Garamond Libre (local OTFs in `src/app/fonts/`); UI font: Geist Sans (npm `geist` package).

## Gotchas

- **Turbopack remark plugins must be string names**, not imported functions, in `next.config.ts` — Rust can't cross the JS boundary with function refs. Use `[["remark-frontmatter", ["yaml"]]]`.
- **`images.localPatterns` is load-bearing in production.** Without the `/illustrations/**` and `/logo/**` entries, Next.js `<Image>` refuses any local path with a `?v=` query string, breaking cache-busting.
- **`fs.statSync` in `illustrations.ts`** runs at build time on Vercel and is fine for SSG/RSC, but it is incompatible with edge runtime — do not move illustration URL generation into middleware or edge functions.
- **`dynamicParams = false`** in `src/app/[slug]/page.tsx` means slugs outside `SUTTAS` 404 at build time with no server fallback.
- **ngrok versions split.** `scripts/shell/ngrok-dev.sh` prefers the system `ngrok` (v3 config: `~/.config/ngrok/ngrok.yml`) and falls back to `node_modules/.bin/ngrok` (v2 — different YAML format). `pnpm dev:tunnel` sets `NGROK=1`; the `dev` script forks ngrok only if that env var is set.
- **`allowedDevOrigins` in `next.config.ts`** allowlists the dev LAN IP (`192.168.1.140`) and ngrok hostnames so phones/HMR can load `/_next/*`. Update the LAN IP if your network changes. Dev-only — has no production effect.
- **`tsx` scripts under `scripts/`** are outside the Next.js compile graph; changes require re-running the script manually.

## Deeper docs

`docs/architecture/` has detailed pages on each system — read these before non-trivial changes:

- `overview.md` — full stack, file conventions, locale plan
- `content-pipeline.md` — MDX + registry data flow
- `design-system.md` — palette, typography, `Wash`/`NightSky`/`ThemeToggle` internals
- `illustrations.md` — Gemini generation + transparency pipeline
- `dev-workflow.md` — ngrok, MDX authoring, phone-on-LAN
- `deployment.md` — Vercel project `fastmonitor/plain-dharma`, DNS, static-export compatibility
- `mobile.md` — React Native (Expo) app, pnpm monorepo (`apps/mobile` + `packages/content`), shared content, audio/offline

`DESIGN_REVIEW.md` at the repo root is a code+rendered-asset review with measured WCAG contrast numbers and prioritized fixes — consult before changing palette tokens or the muted-ink scale.
