/**
 * Build the subsetted Noto Serif SC font used by the Chinese Open Graph cards.
 *
 * Run with: pnpm generate-og-fonts
 * (Equivalent to: tsx scripts/generate-og-fonts.ts)
 *
 * next/og (Satori) has no system fonts and renders missing glyphs as tofu, so
 * the ZH OG cards need a CJK font shipped to them. A full CJK font is ~10MB, so
 * instead we scan every source that feeds Chinese text into a card, collect the
 * exact glyphs used, and ask the Google Fonts API for a subset containing only
 * those — a few hundred glyphs, well under 300KB. Re-run this whenever the ZH
 * card copy or a ZH sutta title/kicker changes; otherwise new glyphs render as
 * empty boxes.
 *
 * Output: src/app/fonts/NotoSerifSC-OG-700.ttf (committed).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "src/app/fonts/NotoSerifSC-OG-700.ttf");

// Sources that contribute Chinese text to a card: the content registry (ZH
// sutta titles + kicker_override) and the ZH OG route files (static card copy).
const SOURCES = [
  "packages/content/index.ts",
  "src/app/zh/opengraph-image.tsx",
  "src/app/zh/read/opengraph-image.tsx",
  "src/app/zh/about/opengraph-image.tsx",
  "src/app/zh/glossary/opengraph-image.tsx",
  "src/app/zh/[slug]/opengraph-image.tsx",
];

// CJK ideographs (+ Ext A, compat), CJK punctuation, and fullwidth forms.
const CJK = /[　-〿㐀-䶿一-鿿豈-﫿＀-￯]/;

function collectGlyphs(): string[] {
  const set = new Set<string>();
  for (const rel of SOURCES) {
    const text = readFileSync(join(ROOT, rel), "utf8");
    for (const ch of text) {
      if (CJK.test(ch)) set.add(ch);
    }
  }
  return [...set].sort(); // sorted → deterministic request + output
}

async function main() {
  const glyphs = collectGlyphs();
  if (glyphs.length === 0) throw new Error("no CJK glyphs found in sources");

  const text = encodeURIComponent(glyphs.join(""));
  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&text=${text}`;

  // A UA with no browser token can't be detected as woff2-capable, so the API
  // serves a TrueType subset — the only outline format next/og's Satori accepts
  // (it does not decode woff2). A full Chrome UA would return woff2 instead.
  const css = await fetch(cssUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  }).then((r) => {
    if (!r.ok) throw new Error(`fonts.googleapis.com ${r.status}`);
    return r.text();
  });

  const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('truetype'\)/);
  if (!match) throw new Error(`no truetype url in CSS response:\n${css}`);

  const ttf = Buffer.from(
    await fetch(match[1]).then((r) => {
      if (!r.ok) throw new Error(`font download ${r.status}`);
      return r.arrayBuffer();
    }),
  );

  writeFileSync(OUT, ttf);
  console.log(
    `Wrote ${OUT} — ${glyphs.length} glyphs, ${(ttf.length / 1024).toFixed(1)}KB`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
