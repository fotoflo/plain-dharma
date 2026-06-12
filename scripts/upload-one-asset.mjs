// Surgically upload ONE file to the assets bucket and patch its entry in
// packages/content/asset-version.json — unlike upload-assets, this never
// rewrites the rest of the version map, so a partial local public/ tree
// (heavy assets live offsite) can't clobber entries for files not on disk.
//   node --env-file=.env.local scripts/upload-one-asset.mjs downloads/plain-dharma.epub
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION_MAP = join(ROOT, "packages", "content", "asset-version.json");
const BUCKET = "assets";

const rel = process.argv[2];
if (!rel) {
  console.error("usage: upload-one-asset.mjs <path relative to public/>");
  process.exit(1);
}
const file = join(ROOT, "public", rel);

const TYPES = {
  ".epub": "application/epub+zip",
  ".pdf": "application/pdf",
  ".m4b": "audio/mp4",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
  ".zip": "application/zip",
};
const contentType = TYPES[extname(file)] ?? "application/octet-stream";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const buf = readFileSync(file);
const { error } = await supabase.storage
  .from(BUCKET)
  .upload(rel, buf, { contentType, upsert: true });
if (error) {
  console.error(`upload failed: ${error.message}`);
  process.exit(1);
}

const map = JSON.parse(readFileSync(VERSION_MAP, "utf8"));
map[rel] = {
  v: createHash("sha256").update(buf).digest("hex").slice(0, 8),
  bytes: statSync(file).size,
};
writeFileSync(VERSION_MAP, JSON.stringify(map, null, 2) + "\n");
console.log(`uploaded ${rel} (${buf.length} bytes), version ${map[rel].v} ✓`);
