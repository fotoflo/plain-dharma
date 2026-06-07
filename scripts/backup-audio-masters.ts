/**
 * Side-backup of the raw ElevenLabs audio MASTERS to durable offsite storage.
 *
 * The render pipeline keeps the un-stretched ElevenLabs output of each section at
 *   public/audio/{en,zh}/<slug>/candidates/orig-<file>.mp3
 * These are gitignored and live only locally; each re-record overwrites them.
 * This script copies every such master into the same public `assets` bucket the
 * site uses, but under a SEPARATE `audio-masters/` prefix so it can never affect
 * the live site. It does NOT touch asset-version.json or any live/fast audio.
 *
 * Bucket key mapping (drops the `candidates/` segment):
 *   public/audio/en/first-talk/candidates/orig-01-opening.mp3
 *     -> audio-masters/en/first-talk/orig-01-opening.mp3
 *
 * Auth: reuses upload-assets-to-supabase.ts exactly — reads NEXT_PUBLIC_SUPABASE_URL
 * and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) from .env.local.
 *
 * Run:
 *   node --env-file=.env.local --import tsx scripts/backup-audio-masters.ts
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = join(ROOT, "public", "audio");
const BUCKET = "assets";
const PREFIX = "audio-masters";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "ERROR: need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY " +
      "(or SUPABASE_SERVICE_ROLE_KEY) in .env.local."
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

/** Find every candidates/orig-*.mp3 under public/audio. */
function* findMasters(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* findMasters(full);
    } else if (
      entry.isFile() &&
      entry.name.startsWith("orig-") &&
      entry.name.endsWith(".mp3") &&
      dir.endsWith(`${join("", "candidates")}`)
    ) {
      yield full;
    }
  }
}

/** public/audio/en/x/candidates/orig-y.mp3 -> audio-masters/en/x/orig-y.mp3 */
function bucketKeyFor(absPath: string): string {
  const rel = absPath
    .slice(AUDIO_DIR.length + 1)
    .split(/[\\/]/)
    .filter((seg) => seg !== "candidates")
    .join("/");
  return `${PREFIX}/${rel}`;
}

async function main(): Promise<void> {
  if (!existsSync(AUDIO_DIR)) {
    console.error(`No audio dir at ${AUDIO_DIR}`);
    process.exit(1);
  }

  const files = [...findMasters(AUDIO_DIR)].sort();
  if (files.length === 0) {
    console.error("No masters found (*/candidates/orig-*.mp3).");
    process.exit(1);
  }

  let uploaded = 0;
  let bytes = 0;
  for (const file of files) {
    const bucketKey = bucketKeyFor(file);
    const buf = readFileSync(file);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(bucketKey, buf, { contentType: "audio/mpeg", upsert: true });
    if (error) {
      console.error(`  x ${bucketKey}: ${error.message}`);
      process.exit(1);
    }
    uploaded += 1;
    bytes += statSync(file).size;
    console.log(`  ok ${bucketKey}`);
  }

  console.log(
    `\n[masters] backed up ${uploaded} masters (${(bytes / 1e6).toFixed(1)} MB) ` +
      `to ${BUCKET}/${PREFIX}/`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
