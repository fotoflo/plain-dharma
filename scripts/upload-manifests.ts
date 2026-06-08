/**
 * Upload ONLY the per-sutta audio manifest.json files to the CDN and surgically
 * update their entries in asset-version.json — for manifest-only changes (e.g.
 * relabeling chapters) where re-running the full `upload-assets` would be wasteful
 * (143 MB) AND risky (it rebuilds the whole version map from local files, which
 * can drop entries for assets not present locally, e.g. another agent's work).
 *
 * This reads the current asset-version.json, replaces only the manifest keys with
 * fresh hashes (so assetUrl's ?v= changes and clients refetch), and leaves every
 * other entry untouched. Uses the same hash (sha256, 8 hex) and bucket as
 * upload-assets-to-supabase.ts.
 *
 * Run: node --env-file=.env.local --import tsx scripts/upload-manifests.ts
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SUTTAS, SUPPORTED_LOCALES } from "@plain-dharma/content";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION_MAP_PATH = join(ROOT, "packages", "content", "asset-version.json");
const BUCKET = "assets";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "ERROR: need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local."
  );
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main(): Promise<void> {
  const map = JSON.parse(readFileSync(VERSION_MAP_PATH, "utf8")) as Record<
    string,
    { v: string; bytes: number; key?: string }
  >;

  let n = 0;
  for (const locale of SUPPORTED_LOCALES) {
    for (const slug of SUTTAS) {
      const rel = `audio/${locale}/${slug}/manifest.json`;
      const file = join(ROOT, "public", rel);
      if (!existsSync(file)) continue;
      const buf = readFileSync(file);
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(rel, buf, { contentType: "application/json", upsert: true });
      if (error) {
        console.error(`  ✗ ${rel}: ${error.message}`);
        process.exit(1);
      }
      // Preserve any existing `key` field; only refresh v + bytes.
      map[rel] = {
        ...map[rel],
        v: createHash("sha256").update(buf).digest("hex").slice(0, 8),
        bytes: buf.length,
      };
      n += 1;
      console.log(`  ✓ ${rel}`);
    }
  }

  const sorted = Object.fromEntries(
    Object.keys(map)
      .sort()
      .map((k) => [k, map[k]])
  );
  writeFileSync(VERSION_MAP_PATH, JSON.stringify(sorted, null, 2) + "\n");
  console.log(
    `[manifests] uploaded ${n} manifest(s); asset-version.json refreshed (surgical).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
