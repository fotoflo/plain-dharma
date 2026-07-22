/**
 * Turn the DARK-backdrop book render (/tmp/pd-book/book-raw.png, produced by
 * generate-book-photo.ts on a near-black studio backdrop) into a transparent
 * cut-out, trim it, and save to public/downloads/plain-dharma-book-photo.png.
 * One transparent PNG floats on BOTH the light (cream) and dark (night-sky)
 * pages; the page-side CSS adds the drop-shadow.
 *
 * Why luma flood-fill (not a single-colour chroma key)? Gemini bakes in a
 * gradient backdrop + a soft contact shadow, which a fixed key colour can't
 * remove (it leaves a grey halo). Instead we exploit that the backdrop is
 * uniformly DARK and the cream/yellow/orange book is BRIGHT: flood-fill from
 * the border clearing every edge-connected pixel below LUMA_THRESH. The bright
 * book stops the fill; interior dark spots (the black cover text) aren't
 * edge-connected, so they stay opaque. THRESH sits above the anti-aliased edge
 * so the cut lands on the book side — no dark indigo fringe.
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

// Edge-connected pixels with luma <= this are background. Above the ~130 luma of
// the indigo→cream anti-aliased edge, so the cut lands on the book (no fringe).
const LUMA_THRESH = 175;

async function main() {
  const { data, info } = await sharp(RAW)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels; // C === 3
  if (!W || !H) throw new Error("bad raw image");
  const luma = (i: number) =>
    0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

  // Flood-fill the dark, edge-connected background.
  const isBg = new Uint8Array(W * H);
  const stack: number[] = [];
  const seed = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (!isBg[p] && luma(p * C) <= LUMA_THRESH) {
      isBg[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1); }
  for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y); }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % W, y = (p / W) | 0;
    seed(x - 1, y); seed(x + 1, y); seed(x, y - 1); seed(x, y + 1);
  }

  // Assemble RGBA in ONE pass (RGB from source, alpha from the mask) and encode
  // once — raw round-trips through sharp corrupted the raster.
  const out = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    out[p * 4] = data[p * C];
    out[p * 4 + 1] = data[p * C + 1];
    out[p * 4 + 2] = data[p * C + 2];
    out[p * 4 + 3] = isBg[p] ? 0 : 255;
  }

  await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .trim() // crop the now-transparent margin tight to the book
    .toFile(OUT);

  const meta = await sharp(OUT).metadata();
  const removed = isBg.reduce((n, v) => n + v, 0);
  console.log(
    `✓ wrote ${OUT} (${meta.width}x${meta.height}, ` +
      `${((100 * removed) / (W * H)).toFixed(1)}% removed)`,
  );
  console.log("  Review it, then run `pnpm upload-assets` to publish.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
