/**
 * Archive EVERY audio take to Supabase Storage — a durable, deduplicated take
 * library, so no recording is ever lost across regenerations. Non-destructive:
 * it never touches the public `assets` bucket the live site plays from.
 *
 * Structure (private `audio-archive` bucket):
 *   <locale>/<slug>/<section>/<date>-<kind>[-takeN].mp3
 *     date = the take's recording date (file mtime, YYYY-MM-DD)
 *     kind ∈ current | fast | orig | candidate   (inferred from the local path)
 *     -takeN only if a DIFFERENT take already exists for that date+kind
 *   _index.json — every take: { locale, slug, section, kind, date, sha, bytes, src }
 *
 * Human-readable + collision-proof: a new recording lands under a new dated
 * name and never overwrites an older one. A content hash underneath means
 * identical bytes are skipped (no dupes). Run before/after any generate-audio.
 *
 * Requires in .env.local: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY
 * (or SUPABASE_SERVICE_ROLE_KEY). Run:
 *   node --env-file=.env.local --import tsx scripts/archive-audio-takes.ts
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = join(ROOT, "public", "audio");
const BUCKET = "audio-archive";
const INDEX = "_index.json";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("ERROR: need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

type Take = { locale: string; slug: string; section: string; kind: string; date: string; sha: string; bytes: number; src: string; dest: string };

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && e.name.endsWith(".mp3")) yield full;
  }
}

/** Map a local path → (locale, slug, section, kind). */
function classify(rel: string): { locale: string; slug: string; section: string; kind: string } {
  const [locale, slug, ...rest] = rel.split("/");
  const tail = rest.join("/");
  const strip = (f: string) => f.replace(/\.mp3$/, "");
  if (rest[0] === "fast") return { locale, slug, section: strip(rest[1]), kind: "fast" };
  if (rest[0] === "candidates") {
    const m = /^orig-(.+)\.mp3$/.exec(rest[1]);
    return m
      ? { locale, slug, section: m[1], kind: "orig" }
      : { locale, slug, section: strip(rest[1]), kind: "candidate" };
  }
  return { locale, slug, section: strip(tail), kind: "current" };
}

async function ensureBucket(): Promise<void> {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (error) throw error;
  console.log(`[archive] created private bucket "${BUCKET}"`);
}

async function loadIndex(): Promise<Record<string, Take>> {
  const { data } = await supabase.storage.from(BUCKET).download(INDEX);
  if (!data) return {};
  try {
    return JSON.parse(await data.text());
  } catch {
    return {};
  }
}

async function main(): Promise<void> {
  await ensureBucket();
  const index = await loadIndex();
  const seenSha = new Set(Object.values(index).map((t) => t.sha));

  const files = [...walk(AUDIO_DIR)];
  let added = 0;
  const byKind: Record<string, number> = {};

  for (const file of files) {
    const rel = relative(AUDIO_DIR, file).split(/[\\/]/).join("/");
    const { locale, slug, section, kind } = classify(rel);
    const buf = readFileSync(file);
    const sha = createHash("sha256").update(buf).digest("hex").slice(0, 8);
    byKind[kind] = (byKind[kind] ?? 0) + 1;
    if (seenSha.has(sha)) continue; // identical bytes already archived — no dupe

    const date = statSync(file).mtime.toISOString().slice(0, 10);
    const base = `${locale}/${slug}/${section}/${date}-${kind}`;
    let dest = `${base}.mp3`;
    for (let n = 2; index[dest]; n++) dest = `${base}-take${n}.mp3`; // same date+kind, different audio

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(dest, buf, { contentType: "audio/mpeg", upsert: true });
    if (error) {
      console.error(`  ✗ ${dest}: ${error.message}`);
      process.exit(1);
    }
    index[dest] = { locale, slug, section, kind, date, sha, bytes: buf.length, src: rel, dest };
    seenSha.add(sha);
    added += 1;
    if (added % 15 === 0) console.log(`  …+${added} new takes`);
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(INDEX, Buffer.from(JSON.stringify(index, null, 2)), {
      contentType: "application/json",
      upsert: true,
    });
  if (error) throw error;

  const total = Object.keys(index).length;
  console.log(
    `[archive] ${added} new take(s) uploaded, ${total} total in ${BUCKET}/\n` +
      `  this run by kind: ${Object.entries(byKind).map(([k, n]) => `${k}=${n}`).join("  ")}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
