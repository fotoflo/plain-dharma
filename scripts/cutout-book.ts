/**
 * Turn the flat-gray book render (/tmp/pd-book/book-raw.png, produced by
 * generate-book-photo.ts) into a transparent-background cut-out, then trim and
 * save it to public/downloads/plain-dharma-book-photo.png.
 *
 * Why chroma-key instead of asking Gemini for transparency? Gemini's image model
 * returns opaque RGB. So we render the book on a flat neutral gray and key that
 * gray out here. The cream cover / yellow spine / black text / orange sun are all
 * far from mid-gray, so the key is unambiguous. The page-side CSS adds the shadow.
 *
 * Run with: node --import tsx scripts/cutout-book.ts
 * Then: pnpm upload-assets
 */

import sharp from "sharp";
import { join } from "node:path";

const RAW = "/tmp/pd-book/book-raw.png";
const OUT = join(
  process.cwd(),
  "public",
  "downloads",
  "plain-dharma-book-photo.png",
);

// Distance (0–255) from the sampled background gray within which a pixel is
// considered fully background. Pixels between INNER and OUTER fade their alpha
// for a soft anti-aliased edge.
const INNER = 26; // <= this far from bg  -> fully transparent
const OUTER = 60; // >= this far from bg  -> fully opaque

async function main() {
  const img = sharp(RAW).ensureAlpha();
  const { width, height } = await img.metadata();
  if (!width || !height) throw new Error("bad raw image");

  const { data } = await img
    .raw()
    .toBuffer({ resolveWithObject: true }); // RGBA, 4 channels

  // Sample background = average of the four corners (a few px in).
  const pad = 4;
  const corners = [
    [pad, pad],
    [width - 1 - pad, pad],
    [pad, height - 1 - pad],
    [width - 1 - pad, height - 1 - pad],
  ];
  let br = 0, bg = 0, bb = 0;
  for (const [x, y] of corners) {
    const i = (y * width + x) * 4;
    br += data[i]; bg += data[i + 1]; bb += data[i + 2];
  }
  br /= 4; bg /= 4; bb /= 4;
  console.log(`bg gray ≈ rgb(${br.toFixed(0)}, ${bg.toFixed(0)}, ${bb.toFixed(0)})`);

  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    const dr = data[i] - br;
    const dg = data[i + 1] - bg;
    const db = data[i + 2] - bb;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    let alpha: number;
    if (dist <= INNER) alpha = 0;
    else if (dist >= OUTER) alpha = 255;
    else alpha = Math.round(((dist - INNER) / (OUTER - INNER)) * 255);
    data[i + 3] = alpha;
  }

  // Flood-fill from the border so only background CONNECTED to the edge is
  // cleared — protects any cover region that happens to sit near the key color.
  const fullyKeyed = new Uint8Array(width * height); // 1 = matched key color
  for (let p = 0; p < width * height; p++) {
    fullyKeyed[p] = data[p * 4 + 3] === 0 ? 1 : 0;
  }
  const reachable = new Uint8Array(width * height);
  const stack: number[] = [];
  const pushIf = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (!reachable[p] && fullyKeyed[p]) {
      reachable[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < width; x++) {
    pushIf(x, 0);
    pushIf(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushIf(0, y);
    pushIf(width - 1, y);
  }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % width;
    const y = (p / width) | 0;
    pushIf(x - 1, y);
    pushIf(x + 1, y);
    pushIf(x, y - 1);
    pushIf(x, y + 1);
  }
  // Any pixel that was keyed transparent but NOT reachable from the edge is an
  // interior region (e.g. a light patch on the cover) — restore it opaque.
  for (let p = 0; p < width * height; p++) {
    if (fullyKeyed[p] && !reachable[p]) data[p * 4 + 3] = 255;
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .trim() // crop the now-transparent margin tight to the book
    .toFile(OUT);

  const out = await sharp(OUT).metadata();
  console.log(`✓ wrote ${OUT} (${out.width}x${out.height}, alpha=${out.hasAlpha})`);
  console.log("  Review it, then run `pnpm upload-assets` to publish.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
