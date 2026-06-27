# Handoff — book-wide translation credit ("Translated by Claude Opus, edited by Alex Miller")

Branch: `chore/credit-claude-translator`

## Goal

Credit the whole book honestly and consistently on **every** surface:

- **Author** = Gautama Buddha
- **Translator** = Claude Opus (drafted the English from the Pāli)
- **Editor** = Alex Miller (edited line by line)

Rendered as the role-split byline **"translated by Claude Opus / edited by Alex Miller"** — *not* a combined "translated & edited by both", which would falsely imply Alex translated the Pāli (he doesn't read it). This was a deliberate correction made late in the session.

## Decisions

- **Metadata "author" role** (EPUB creator, KDP contributor, JSON-LD, M4B): author = Gautama Buddha; Claude Opus = translator contributor; Alex Miller = editor contributor.
- **Chinese edition: left untouched** — its editor is Yan Zhang, not Alex. ZH strings/credits were intentionally not changed (JSON-LD editor is conditional: `zh → Yan Zhang`).
- **Audiobook narration re-recorded** (opening + colophon) with the new credit (ElevenLabs, ~$0.04). M4B rebuilt.
- **Model name**: plain "Claude Opus" everywhere, **no version number** — the translation spanned multiple Opus releases, so "4.8" would be false precision.

## Done (committed on this branch)

Text/metadata surfaces (all now role-split, consistent):
- `packages/content/strings.ts` — footer byline, `pHowMade1`, contribute intro
- `scripts/lib/book-source.ts` — added `ORIGINAL_AUTHOR`/`TRANSLATOR`/`EDITOR`/`BYLINE` consts; About + colophon copy
- `scripts/build-ebook.ts` — EPUB metadata roles (author/trl/edt/cov)
- `scripts/build-audiobook.ts` — M4B tags (artist=Buddha, composer=Claude Opus, byline in comment)
- `src/content/en_tts/frontmatter.mdx`, `colophon.mdx` — narration copy (re-rendered; manifests updated)
- `src/lib/structured-data.ts` — JSON-LD author/translator/editor Person nodes
- `docs/publishing/KDP_PUBLISHING.md` — contributor roles + byline guidance

Covers (fully redesigned, role-split credit):
- `scripts/generate-cover.ts` (6×9 raster from InDesign PDF) and `scripts/templates/front-cover.tex` + `scripts/generate-front-cover.ts` (5×8 print + square audiobook).
- Layout is **rule-driven** (see code comments): name size ≈ 0.5–0.6× the title cap-height; long two-name byline **stacks** so it stays < 0.75× title width; credit grouped role→name (tight) with even between-group gaps; URL re-stamped as a lower bottom-margin footer (the baked InDesign URL sat too high); golden-ratio/measured placement.
- **Sun saturation**: the baked InDesign sun read as over-saturated next to the audiobook sun. Fixed by desaturating **only the sun's region** (`SUN_SATURATION=84` in `generate-cover.ts`) — saturation-only (no brightness) so the surrounding cream and the gold stripe are untouched (no seam). The tex/audiobook sun is deepened from its pale source via `SUN_BRIGHTNESS=96`/`SUN_SATURATION=135` in `generate-front-cover.ts`.

## Remaining (NOT done — pick up here)

1. **Rebuild cover-dependent distributables with the FINAL covers.** The EPUB/PDFs/KDP/M4B were rebuilt mid-session against *earlier* cover iterations. Re-run so they embed the final covers + final byline:
   - `pnpm generate-cover && pnpm generate-front-cover`
   - `pnpm build-ebook && pnpm build-pdf && pnpm build-print-pdf && pnpm build-kdp`
   - `pnpm build-audiobook` (M4B; narration already re-rendered)
2. **Publish heavy assets to the CDN:** `pnpm upload-assets` — until this runs, the new covers/audiobook are NOT live (covers/audio/m4b are offsite on Supabase, not in git). This is the outward/irreversible step — confirm with owner first.
3. **Deploy the web text changes:** merge `chore/credit-claude-translator` → `main` and push (Git-connected Vercel build, ~1 min). Footer/about/JSON-LD update on deploy.
4. Optional: mirror the role-split + sun fixes onto any other cover consumers (storyboard, etc.) if they exist.

## Gotchas / notes

- Heavy binaries (covers, audio, m4b, zips) live in the Supabase `assets` bucket, not git → `upload-assets` is what makes them live. `asset-version.json` (committed) is the cache-bust map.
- `xelatex` IS installed (`/usr/local/bin` + BasicTeX) and `pandoc`/`magick` are available, so all builds run locally.
- After rendering any cover, **open it** for the owner (they review visually).
- House style: reader-facing English uses "sutra", but audiobook spoken titles keep "Sutta" — don't "fix".
