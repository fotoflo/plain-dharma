/**
 * Create small cream-colored placeholder PNG files for each sutta illustration,
 * so the pages render without 404s while the real Gemini-generated images are
 * blocked by API quota.
 *
 * Replace these by running `pnpm generate-illustrations` once API quota is
 * available — that script skips any slug whose .png already exists, so DELETE
 * the placeholder before regenerating.
 */

import { writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, crc32 } from "node:zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_DIR = join(__dirname, "..", "public", "illustrations");

const SLUGS = [
  "first-talk",
  "not-self",
  "fire-sermon",
  "loving-kindness",
  "mindfulness",
  "how-to-decide",
];

// Build a tiny valid PNG: 16x16 solid cream (#F5EFE0) — the site's paper bg.
function makePng(width: number, height: number, r: number, g: number, b: number): Buffer {
  // PNG signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = chunk("IHDR", ihdrData);

  // IDAT chunk — one filter byte (0) per row, then RGB pixels
  const rowBytes = 1 + width * 3;
  const raw = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    raw[rowStart] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const p = rowStart + 1 + x * 3;
      raw[p] = r;
      raw[p + 1] = g;
      raw[p + 2] = b;
    }
  }
  const idat = chunk("IDAT", deflateSync(raw));

  // IEND
  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput) >>> 0, 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

const placeholder = makePng(400, 400, 0xf5, 0xef, 0xe0); // cream

let created = 0;
let skipped = 0;
for (const slug of SLUGS) {
  const path = join(OUT_DIR, `${slug}.png`);
  if (existsSync(path)) {
    console.log(`  skipped ${slug} (exists)`);
    skipped++;
    continue;
  }
  writeFileSync(path, placeholder);
  console.log(`  created placeholder ${path} (${placeholder.length} bytes)`);
  created++;
}

console.log(`\n${created} created, ${skipped} skipped`);
