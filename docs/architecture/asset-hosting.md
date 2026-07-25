# Asset hosting (offsite media on Supabase Storage) — Plain Dharma

*Last updated: 2026-07-25*

The heavy binary assets — audio mp3s, illustrations, and download bundles — are
**not committed to git** and **not served from Vercel `/public`**. They live in
a public **Supabase Storage** bucket + CDN and are referenced by URL.

## Why

Audio is regenerated in place and was re-committed on every pass, so the git
history ballooned (it had reached ~441 MB). Object storage decouples the heavy,
frequently-regenerated media from source control: regenerate as often as you
like and the repo stays small.

The split is **metadata in git, binaries on the CDN**:

| Stays in git (small) | Offsite on the CDN (heavy) |
|---|---|
| per-sutta `manifest.json` (the web build reads it via `fs`) | `audio/**/*.mp3` (slow + `fast/`) |
| `packages/content/asset-version.json` (hashes + sizes, including `-dark.png` variants) | `illustrations/<slug>.png` + `-dark.png` variants + `originals.zip` |
| the MDX source under `packages/content/` | `downloads/*` (m4b, pdf, epub, covers, zips, `text/`) |

## Where things are

- **Project / bucket:** Supabase project `ffoiltrarbdbibmymlqm`, public bucket
  `assets`. Public base URL:
  `https://ffoiltrarbdbibmymlqm.supabase.co/storage/v1/object/public/assets`
- **Bucket layout mirrors the old `/public` paths 1:1:** `audio/<locale>/<slug>/<file>.mp3`,
  `illustrations/<slug>.png` + `<slug>-dark.png` (dark-mode variant), `downloads/<file>`.
- **Two prefixes don't mirror `public/`** because their sources live outside it:
  `audio-masters/` (raw un-stretched ElevenLabs output — `backup-audio-masters.ts`)
  and `archive/` (superseded takes, pacing experiments, older book builds —
  `publish-archive.ts`). See [The archive](#the-archive-superseded-takes).
- (A separate **private** bucket `audio-archive` still holds pre-regen audio
  backups — see `scripts/backup-audio-to-supabase.ts`. Unrelated to serving.)

## The one resolver: `packages/content/assets.ts`

Platform-agnostic (web + mobile both use it):

- `ASSET_BASE` — `NEXT_PUBLIC_ASSET_BASE` / `EXPO_PUBLIC_ASSET_BASE` override, else
  the hardcoded public URL above (not a secret).
- `assetUrl(relPath)` — absolute CDN URL, cache-busted with `?v=<hash>` from the
  version map. Use for media shown/played in-page (`<img>`, `<audio>`, `<Image>`).
- `assetDownloadUrl(relPath)` — adds Supabase's `download` flag
  (`Content-Disposition: attachment`). Use for save-as links — the HTML
  `download` attribute is ignored cross-origin.
- `assetSize(relPath)` / `hasAsset(relPath)` — byte size / existence from the
  version map (no local file needed; powers `/remix` size labels + the dark-art
  fallback).

`asset-version.json` maps `"<key>": { "v": "<8-char sha>", "bytes": <n> }`. It is
**generated** by the upload script and **committed**.

## Publishing workflow

### Full asset upload (media + version map)

```
# after regenerating audio / illustrations, or editing remix bundles:
pnpm build-remix-assets     # rebuilds public/downloads zips + text copies
pnpm upload-assets          # uploads everything to the bucket, writes asset-version.json
# then commit the updated asset-version.json
```

`pnpm upload-assets` (`scripts/upload-assets-to-supabase.ts`) needs a
**`SUPABASE_SECRET_KEY`** (`sb_secret_…`) in `.env.local` — only for uploading;
reading the public bucket needs no key. Get one at
`https://supabase.com/dashboard/project/ffoiltrarbdbibmymlqm/settings/api-keys`.

### Surgical manifest-only upload (when relabeling chapters, etc.)

For manifest-only changes (e.g., chapter title edits) that don't need a full 143MB re-upload:

```
node --env-file=.env.local --import tsx scripts/upload-manifests.ts
```

`scripts/upload-manifests.ts` uploads only the per-sutta `manifest.json` files and surgically refreshes their entries in `asset-version.json` (appending fresh hashes for cache-busting), while leaving all other version-map entries untouched. This is **safe for concurrent agents** — it never rebuilds the version map from local files, which could drop entries for assets created by other agents.

### Audio master backups (preserve raw ElevenLabs output)

The render pipeline keeps un-stretched raw ElevenLabs output at `public/audio/{locale}/{slug}/candidates/orig-*.mp3` (gitignored, local only, overwritten on re-record). To preserve these as durable backups:

```
node --env-file=.env.local --import tsx scripts/backup-audio-masters.ts
```

`scripts/backup-audio-masters.ts` copies all masters to a separate `audio-masters/` prefix in the same public bucket (never visible on the live site, used only for recovery). Uses the same auth and bucket as `upload-assets`.

### The archive (superseded takes)

```
pnpm publish-archive               # upload what changed + write the index
pnpm publish-archive --index-only  # rebuild archive.json only, upload nothing
pnpm publish-archive --dry-run     # plan only, no network writes
```

Re-runs are cheap: each file is hashed locally first and skipped when the bucket
already has those exact bytes, so changing a label re-uploads nothing. Use
`--index-only` when only the *shape* of `archive.json` changed.

`scripts/publish-archive.ts` publishes everything the current pipeline *replaced* —
material that existed only on one laptop, some of it inside a git worktree one
`git worktree remove` from deletion:

| Group | Source | What it is |
|---|---|---|
| `pace-test` | `dist/pace-test/` | 11 renderings of one section + the write-up that settled how narration pauses |
| `en-2026-05-27` | `.claude/worktrees/rn-mobile/public/audio/en/` | the first full English read, superseded by the June 7 regen |
| `en-masters-2026-05-27` | same, `candidates/` | un-stretched masters behind it |
| `zh-haoran` | `.../zh_tts/` | a complete alternate Mandarin read (voice Haoran) that never shipped |
| `zh-masters` | `.../zh/*/candidates/` | **the only true multi-take material**: normal-speed originals, the title + preface in Hardy (`FS8UtxyDrvYcNCxVaziq`, Taiwanese — live before CarterSutra replaced it), and the opening at 10/20/30% slower. First Talk carries the audition notes, published as the group's write-up. |
| `builds` | `dist/{audiobook,pdf,ebook,print,kdp}/` | the last build of each artifact before the current set |
| `en-masters-2026-06-07` | already in the bucket | registered in the version map so it can be linked; 2 of the 40 are older takes than what ships |

It is **additive**: it only writes `archive/` keys, and it *merges* into
`asset-version.json` rather than rewriting it. The curated index it emits,
`packages/content/archive.json` (committed), is read through the typed, pure
`packages/content/archive.ts` — same contract as `assets.ts`, safe in
client/edge/RN code.

### The version map describes the BUCKET, not the local disk

This invariant is load-bearing and was violated once, with real consequences.

`upload-assets` used to rebuild `asset-version.json` from scratch out of whatever
sat under `public/`. That was safe only while `public/` held everything. Once the
heavy media moved offsite, `public/audio/zh/**` stopped existing locally — so a
routine `pnpm upload-assets` **silently deleted every zh entry from the map**.

The damage wasn't obvious, because it was split:

- ASCII-named tracks (`00-title.mp3`, `01-opening.mp3`, `99-drop.mp3`) kept
  working — `assetUrl` falls back to an un-versioned URL when a path isn't in
  the map, and their bucket key equals their path.
- The **18 Chinese-named section tracks did not.** Supabase rejects non-ASCII
  object keys, so those are stored as `<sha1>.mp3` and the original-name → key
  mapping exists *only* in the map's `key` field. With the entry gone, `assetUrl`
  emitted the raw Chinese path and the CDN returned **400** — on the website and
  in the mobile app, for the body of every Mandarin sutta.

Two changes keep it from recurring:

1. `upload-assets-to-supabase.ts` now starts from the existing map and overwrites
   only what it uploads. It never drops an entry.
2. `scripts/sync-version-map.ts` reconciles the map against the bucket:

```
pnpm sync-version-map              # add every bucket object missing from the map
pnpm sync-version-map --prune      # also drop entries whose object is gone
pnpm sync-version-map --dry-run    # report only
```

It downloads and hashes the **remote** bytes (the bucket is the source of truth
for what's served) and recovers original filenames for hashed keys by reading the
committed manifests. Pruning is its job, not `upload-assets`'.

> **Not everything in the bucket is live.** Uploads are `upsert` and never
> delete, so renaming a section strands the old object forever — e.g.
> `audio/en/how-to-decide/04-now-run-it-the-other-way.mp3`, orphaned when that
> section became `04-now-do-the-same-in-reverse.mp3`. So under `audio/`,
> `sync-version-map` registers **only objects a manifest actually references**
> and reports the rest as stale; otherwise phantom tracks would appear on
> `/assets`. Everywhere else (`illustrations/`, `downloads/`, `archive/`) every
> object is registered.

> **Until you upload, new media won't appear** — not on the live site and not in
> local dev (dev resolves to the CDN too). The upload is the publish step.

## Consumers

- **Web audio:** `src/content/audio.ts#getAudioManifest` reads the local
  `manifest.json`, resolves each `file`/`fileFast` to a CDN URL via
  `getAudioFileUrl`. The `AudioPlayer` passes through absolute `http` URLs
  unchanged. Fast-variant presence is keyed off `duration_fast_sec` in the
  manifest (no disk check).
- **Web illustrations:** `src/content/illustrations.ts` → `assetUrl`.
- **OG cards:** `src/lib/og-card.tsx#publicImageDataUrl` tries a local read, then
  falls back to fetching the CDN URL at build time (illustrations aren't local
  on Vercel).
- **Downloads:** `/download` flow + `/remix` use `assetDownloadUrl`. `/remix`
  text + zips are also on the CDN.
- **Mobile:** `apps/mobile/src/audio/{manifest,downloads}.ts`,
  `components/SuttaIllustration.tsx`, `lib/links.ts`, and the home cover all
  resolve through `assetUrl`. Mobile fetches the per-sutta `manifest.json` from
  the CDN as well.

## Asset discovery: the `/assets` page

`src/app/assets/page.tsx` is a **public index page** that lists, plays, and bundles every asset in the version map. It complements `/remix` (ready-made bundles) with full granular access.

### Organised by what it is, not by how it was made

Top-level accordions are the things a visitor is actually looking for:

```
Illustrations                          shared by both books, so it stands alone
The English book
  ├ Downloads
  │    ├ PDF · print PDFs · EPUB · M4B · zips · covers · book photos
  │    └ Superseded book builds        2026-06-30
  └ Narration
       ├ Current                       80 tracks, standard + fast, by sutta
       ├ English masters (current)     2026-06-07
       ├ Pacing experiments            2026-05-31
       ├ English narration, first read 2026-05-27
       └ English masters               2026-05-27
The Mandarin book · 中文
  ├ Downloads
  └ Narration
       ├ Current                       37 tracks
       ├ Mandarin voice auditions      2026-05-28
       └ Haoran read (never shipped)   2026-05-27
```

The path to any file is **book → what it is → which version → files**. Every narration take a book ever had — current and superseded — nests under that book's one `Narration` accordion, newest first; older book builds nest under `Downloads` beside the files they replace. Nothing is filed under "archive": a superseded take sits with the book it belongs to, not in a museum wing.

Both live and archived audio render through the **same** `SuttaCard`/`TrackColumn` components: canonical order, ordinal badge, Pali name, one column per cut (Standard / Fast / Un-stretched master, or "Takes" for the zh auditions, which are named by section keyword rather than numbered). To make that possible `publish-archive.ts` emits `slug`, `variant`, `num`, and `name` per item instead of a pre-baked label, and each group carries a `locale` so zh groups title their suttas in Chinese. Slugs outside `SUTTAS` — the framing tracks, and the orphaned `first-talk-title` — keep a slot at the end rather than vanishing.

Only `.mp3`/`.m4b` items become tracks; a notes file shipped alongside a group's takes carries a slug too, but surfaces as that group's write-up link. Every player is `preload="none"`, so none of the ~320 fetch until played.

> **The Mandarin narration was invisible here until 2026-07-25.** The page read `listAssets("audio/en/")` only, so 37 live zh tracks and the 30 MB zh audio zip were never listed. `liveNarration(locale)` is now parameterised.

### Zip downloads at every level (`src/components/ZipDownload.tsx`)

Each accordion — supergroup *and* group — offers a zip of everything inside it, built **in the browser**:

- The bucket serves `access-control-allow-origin: *`, so the page can fetch its own objects.
- [`client-zip`](https://github.com/Touffy/client-zip) streams them into a zip with no compression pass (mp3s don't compress anyway).
- With the File System Access API the zip streams straight to disk; otherwise it falls back to a Blob + anchor.
- The save picker is opened **inside the click handler**, before any fetching, or browsers reject it as not user-initiated.

Pre-building these server-side would have roughly **doubled bucket storage** (~270 MB of zips over a ~413 MB bucket, against a 1 GB free tier) to serve files most visitors never take. Zipping client-side costs nothing but a ~3 KB dependency.

Paths share their leading directory stripped, so a group zip opens as `first-talk/01-opening.mp3`. A whole-book zip spans `downloads/`, `audio/`, and `archive/`, which share no prefix, so those keep full paths. Groups of one file get no button — the file already has its own download link.

## Back-compat redirect

`next.config.ts` `redirects()` permanently (308) sends `/audio/:path*`,
`/illustrations/:path*`, and `/downloads/:path*` to the bucket. This keeps
already-shipped mobile builds and old shared/email links working and offloads
the bandwidth to the CDN. **Consequence:** the bucket must hold *everything*
under those prefixes (the upload script uploads the whole `downloads/` tree,
`text/` included) or a redirected path will 404.

## What's NOT offsite

`public/logo/**`, favicons, `badges/`, and other small static files stay in git
and are served by Vercel. `images.localPatterns` still lists `/logo/**`.

## Out of scope / future

- The existing ~441 MB of git history is **not** rewritten — only future commits
  stay lean (`.gitignore` + `git rm --cached`). To reclaim it, run
  git-filter-repo/BFG manually when no other worktrees are active, then force-push.
- If Supabase egress (free tier ~5 GB/mo) becomes the bottleneck, the resolver is
  the single seam to repoint at Cloudflare R2 (zero egress) — change `ASSET_BASE`.
