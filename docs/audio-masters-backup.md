# Audio masters backup

Durable offsite backup of the raw, un-stretched ElevenLabs narration **masters**.

The render pipeline (`scripts/render-english-audio.ts`) stores each section's raw
ElevenLabs output at `public/audio/{en,zh}/<slug>/candidates/orig-<file>.mp3`.
The live (−20% atempo) and `fast/` variants are derived from these. The
`candidates/` masters are **gitignored** and exist only locally; each re-record
overwrites them, so they are ephemeral. This backup preserves a copy.

## Backup location

- **Bucket:** `assets` (the same public Supabase Storage bucket the site uses)
- **Prefix:** `audio-masters/`
- **CDN base:** `https://ffoiltrarbdbibmymlqm.supabase.co/storage/v1/object/public/assets/audio-masters/`

The `candidates/` path segment is dropped in the key:

```
public/audio/en/first-talk/candidates/orig-01-opening.mp3
  -> audio-masters/en/first-talk/orig-01-opening.mp3
```

This prefix is **isolated** from the live site: it is not referenced by
`asset-version.json`, `assetUrl()`, or any app code, so it can never affect what
the site serves.

## Snapshot (2026-06-08)

- **Files:** 40 masters (all `en`; no `zh` masters present locally)
- **Total size:** ~39.5 MB
- Uploaded with `upsert: true`, so re-running overwrites in place.

## How to back up (re-run after re-recording)

```bash
node --env-file=.env.local --import tsx scripts/backup-audio-masters.ts
```

Reuses the same Supabase auth as `pnpm upload-assets`
(`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
from `.env.local`). It does **not** write `asset-version.json` and does **not**
touch the live/fast audio — it only adds/overwrites files under `audio-masters/`.

## How to restore

Download from `<ASSET_BASE>/audio-masters/<locale>/<slug>/orig-<file>.mp3` back
into the matching local `public/audio/<locale>/<slug>/candidates/orig-<file>.mp3`
(re-add the `candidates/` segment). Example:

```bash
curl -fL -o public/audio/en/first-talk/candidates/orig-01-opening.mp3 \
  "https://ffoiltrarbdbibmymlqm.supabase.co/storage/v1/object/public/assets/audio-masters/en/first-talk/orig-01-opening.mp3"
```
