/**
 * Back up the recorded narration (public/audio/**) to Supabase Storage.
 *
 * Why: regenerating audio overwrites public/audio/<locale>/ in place. This
 * archives the current mp3s + manifests to a private Storage bucket first, so
 * the old voice/takes are recoverable independently of git history.
 *
 * Storage cost: the whole public/audio tree is ~182 MB — well inside Supabase's
 * 1 GB free-tier Storage allotment.
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY            (new "sb_secret_…" key)  — or —
 *   SUPABASE_SERVICE_ROLE_KEY     (legacy service_role JWT)
 *   (the publishable/anon key can't create buckets or write to a private one)
 *
 * Run:
 *   node --env-file=.env.local --import tsx scripts/backup-audio-to-supabase.ts
 *   # optional first arg = archive prefix (defaults to today's date)
 *   node --env-file=.env.local --import tsx scripts/backup-audio-to-supabase.ts 2026-05-30-pre-regen
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = join(ROOT, "public", "audio");
const BUCKET = "audio-archive";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "ERROR: need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY " +
      "(or SUPABASE_SERVICE_ROLE_KEY) in .env.local.\n" +
      "Get a secret key at:\n" +
      "  https://supabase.com/dashboard/project/ffoiltrarbdbibmymlqm/settings/api-keys"
  );
  process.exit(1);
}

const prefix = process.argv.slice(2).find((a) => !a.startsWith("--")) ??
  new Date().toISOString().slice(0, 10);

const supabase = createClient(url, key, { auth: { persistSession: false } });

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile()) yield full;
  }
}

function contentType(path: string): string {
  if (path.endsWith(".mp3")) return "audio/mpeg";
  if (path.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

async function ensureBucket(): Promise<void> {
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  if (error && !/not found|does not exist/i.test(error.message)) throw error;
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: false,
  });
  if (createErr) throw createErr;
  console.log(`[backup] created private bucket "${BUCKET}"`);
}

async function main(): Promise<void> {
  await ensureBucket();

  const files = [...walk(AUDIO_DIR)];
  if (files.length === 0) {
    console.error(`No files under ${AUDIO_DIR}`);
    process.exit(1);
  }

  let uploaded = 0;
  let bytes = 0;
  for (const file of files) {
    const rel = relative(AUDIO_DIR, file).split(/[\\/]/).join("/");
    const dest = `${prefix}/${rel}`;
    const buf = readFileSync(file);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(dest, buf, { contentType: contentType(file), upsert: true });
    if (error) {
      console.error(`  ✗ ${dest}: ${error.message}`);
      process.exit(1);
    }
    uploaded += 1;
    bytes += statSync(file).size;
    if (uploaded % 20 === 0) console.log(`  …${uploaded}/${files.length}`);
  }

  console.log(
    `[backup] uploaded ${uploaded} files (${(bytes / 1e6).toFixed(1)} MB) ` +
      `to ${BUCKET}/${prefix}/`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
