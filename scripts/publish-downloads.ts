/**
 * Batch-republish everything currently in dist/ into public/downloads/.
 *
 * Normally you don't need this: each build script (build-ebook, build-pdf,
 * build-audiobook, generate-cover) publishes its own output as the last step,
 * so generating an artifact already serves it from /downloads/*. This is the
 * "re-sync all four at once" convenience — e.g. after pulling fresh dist/
 * artifacts from elsewhere. Missing sources are skipped (not an error), so a
 * deferred audiobook won't block republishing the EPUB/PDF.
 *
 * The files are publicly accessible at:
 *   /downloads/plain-dharma.epub
 *   /downloads/plain-dharma.pdf
 *   /downloads/plain-dharma.m4b
 *   /downloads/plain-dharma-cover.jpg
 *
 * This is intentional — the donation flow is honor-system. Anyone who guesses
 * the URL can download without paying. We nudge with the donation page; we
 * don't gate.
 *
 * Run: pnpm publish-downloads
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { publishToDownloads } from "./lib/publish.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const ARTIFACTS = [
  { src: "dist/ebook/plain-dharma.epub",    dest: "plain-dharma.epub" },
  { src: "dist/pdf/plain-dharma.pdf",       dest: "plain-dharma.pdf" },
  { src: "dist/audiobook/plain-dharma.m4b", dest: "plain-dharma.m4b" },
  { src: "dist/ebook/cover.jpg",            dest: "plain-dharma-cover.jpg" },
];

function main(): void {
  for (const { src, dest } of ARTIFACTS) {
    publishToDownloads(join(ROOT, src), dest);
  }
}

main();
