# Asset hosting (offsite media on Supabase Storage) — Plain Dharma

*Last updated: 2026-06-08*

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
