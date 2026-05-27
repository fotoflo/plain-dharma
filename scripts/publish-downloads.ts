/**
 * Copy the latest built EPUB + PDF + cover JPEG into public/downloads/ so
 * they're served from the site. Run after `pnpm build-ebook` / `build-pdf`.
 *
 * The files are publicly accessible at:
 *   /downloads/plain-dharma.epub
 *   /downloads/plain-dharma.pdf
 *   /downloads/plain-dharma-cover.jpg
 *
 * This is intentional — the donation flow is honor-system. Anyone who guesses
 * the URL can download without paying. We nudge with the donation page; we
 * don't gate.
 *
 * Run: pnpm publish-downloads
 */

import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEST = join(ROOT, "public", "downloads");

const ARTIFACTS = [
  { src: "dist/ebook/plain-dharma.epub",    dest: "plain-dharma.epub" },
  { src: "dist/pdf/plain-dharma.pdf",       dest: "plain-dharma.pdf" },
  { src: "dist/audiobook/plain-dharma.m4b", dest: "plain-dharma.m4b" },
  { src: "dist/ebook/cover.jpg",            dest: "plain-dharma-cover.jpg" },
];

function main(): void {
  if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true });
  for (const { src, dest } of ARTIFACTS) {
    const srcAbs = join(ROOT, src);
    if (!existsSync(srcAbs)) {
      console.error(`[publish-downloads] missing: ${src} — run the corresponding build script first`);
      process.exit(1);
    }
    const destAbs = join(DEST, dest);
    copyFileSync(srcAbs, destAbs);
    const size = (statSync(destAbs).size / 1024).toFixed(0);
    console.log(`[publish-downloads] ${dest}  ${size} KB`);
  }
}

main();
