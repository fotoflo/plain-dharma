/**
 * Publish a built artifact into public/downloads/ so it's served from the site
 * at /downloads/<name>.
 *
 * Publishing is tied to generation: each build script (build-ebook, build-pdf,
 * build-audiobook, generate-cover) calls this immediately after it writes its
 * output, so the file friends download is always the one you just built and you
 * never have to remember a separate publish step.
 *
 * scripts/publish-downloads.ts remains as a batch "republish everything that's
 * currently in dist/" convenience for the rare case you want to re-sync all
 * four at once.
 */

import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOWNLOADS_DIR = join(ROOT, "public", "downloads");

/**
 * Copy `srcAbs` to public/downloads/`destName`. No-op (with a warning) if the
 * source doesn't exist, so callers can publish optional artifacts unconditionally.
 */
export function publishToDownloads(srcAbs: string, destName: string): void {
  if (!existsSync(srcAbs)) {
    console.warn(`[publish] skip ${destName} — source missing: ${srcAbs}`);
    return;
  }
  if (!existsSync(DOWNLOADS_DIR)) mkdirSync(DOWNLOADS_DIR, { recursive: true });
  const destAbs = join(DOWNLOADS_DIR, destName);
  copyFileSync(srcAbs, destAbs);
  const size = (statSync(destAbs).size / 1024).toFixed(0);
  console.log(`[publish] public/downloads/${destName}  ${size} KB`);
}
