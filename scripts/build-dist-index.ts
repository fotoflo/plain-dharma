/**
 * Generate dist/index.html — a browsable navigator for the build outputs.
 *
 * Groups the artifacts by UPLOAD DESTINATION (KDP paperback, KDP Kindle,
 * audiobook, reading PDFs, …) with thumbnails, sizes, and click-through links,
 * then lists everything by folder. Open dist/index.html after a build to find
 * exactly which file goes where. Runs last in `build-all`.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const INDEX = join(DIST, "index.html");
const THUMBS = join(DIST, "_thumbs"); // skipped by the walk (leading _)

const IMG = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const SKIP = /^(_|\.)|index\.html$/; // temp files, dotfiles, the index itself

/** Rasterize a PDF's first page to a small PNG thumb (cover PDFs → wraparound). */
function pdfThumb(rel: string): string | null {
  const src = join(DIST, rel);
  if (!existsSync(src)) return null;
  if (!existsSync(THUMBS)) mkdirSync(THUMBS, { recursive: true });
  const baseNoExt = join(THUMBS, rel.replace(/[/\\]/g, "__").replace(/\.[^.]+$/, ""));
  try {
    execFileSync(
      "pdftoppm",
      ["-png", "-singlefile", "-f", "1", "-l", "1", "-scale-to-x", "440", "-scale-to-y", "-1", src, baseNoExt],
      { stdio: "ignore" },
    );
  } catch {
    return null;
  }
  return existsSync(`${baseNoExt}.png`) ? relative(DIST, `${baseNoExt}.png`) : null;
}

/** A preview image for any artifact: itself if an image, a page raster for PDFs,
 *  the matching cover art for EPUB/M4B. Null → fall back to an extension chip. */
function thumbFor(rel: string): string | null {
  const ext = extname(rel).toLowerCase();
  if (IMG.has(ext)) return rel;
  if (ext === ".pdf") return pdfThumb(rel);
  const coverFor: Record<string, string> = {
    ".epub": "ebook/cover.jpg",
    ".m4b": "audiobook/audiobook-cover.jpg",
  };
  const c = coverFor[ext];
  return c && existsSync(join(DIST, c)) ? c : null;
}

function human(bytes: number): string {
  if (bytes >= 1 << 20) return `${(bytes / (1 << 20)).toFixed(1)} MB`;
  if (bytes >= 1 << 10) return `${(bytes / (1 << 10)).toFixed(0)} KB`;
  return `${bytes} B`;
}

type File = { rel: string; size: number };

/** Every file under dist/ (recursive), minus temp/dotfiles/the index. */
function walk(dir: string, acc: File[] = []): File[] {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir).sort()) {
    if (SKIP.test(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else acc.push({ rel: relative(DIST, full), size: st.size });
  }
  return acc;
}

function card(rel: string): string {
  const full = join(DIST, rel);
  if (!existsSync(full)) return "";
  const size = human(statSync(full).size);
  const name = rel.split("/").pop()!;
  const t = thumbFor(rel);
  const ext = extname(rel).slice(1).toUpperCase() || "FILE";
  const thumb = t
    ? `<img src="${t}" alt=""><span class="tag">${ext}</span>`
    : `<div class="ext">${ext}</div>`;
  return `<a class="item" href="${rel}"><div class="thumb">${thumb}</div>` +
    `<div class="meta"><span class="fn">${name}</span><span class="sz">${size}</span></div></a>`;
}

// Curated "send this there" groups. Only existing files render.
const DESTINATIONS: { title: string; note: string; files: string[] }[] = [
  {
    title: "KDP — Paperback",
    note: "kdp.amazon.com · upload the wraparound cover + one interior",
    files: [
      "kdp/plain-dharma-kdp-cover-color.pdf",
      "kdp/plain-dharma-kdp-cover-bw.pdf",
      "kdp/plain-dharma-kdp-interior-color.pdf",
      "kdp/plain-dharma-kdp-interior-bw.pdf",
    ],
  },
  {
    title: "KDP — Kindle eBook",
    note: "kdp.amazon.com · cover + manuscript",
    files: ["ebook/cover-kindle.jpg", "ebook/plain-dharma.epub"],
  },
  {
    title: "Audiobook",
    note: "ACX / Apple Books / Spotify · square cover + m4b",
    files: ["audiobook/audiobook-cover.jpg", "audiobook/plain-dharma.m4b"],
  },
  {
    title: "Reading / share PDFs",
    note: "the digital reading edition + print-at-home",
    files: [
      "pdf/plain-dharma.pdf",
      "print/plain-dharma-print-color.pdf",
      "print/plain-dharma-print-bw.pdf",
    ],
  },
  {
    title: "Cover art",
    note: "standalone cover images (front / back / ebook)",
    files: [
      "ebook/front-cover-print-color.jpg",
      "ebook/back-cover-print-color.jpg",
      "ebook/cover.jpg",
      "ebook/back-cover.jpg",
    ],
  },
];

function main(): void {
  if (!existsSync(DIST)) mkdirSync(DIST, { recursive: true });
  const all = walk(DIST);

  const destSections = DESTINATIONS.map((d) => {
    const items = d.files.map(card).filter(Boolean).join("");
    if (!items) return "";
    return `<section><h2>${d.title}</h2><p class="note">${d.note}</p><div class="grid">${items}</div></section>`;
  }).join("");

  // Everything, grouped by top-level folder.
  const byFolder = new Map<string, File[]>();
  for (const f of all) {
    const top = f.rel.includes("/") ? f.rel.split("/")[0] : ".";
    (byFolder.get(top) ?? byFolder.set(top, []).get(top)!).push(f);
  }
  const folderSections = [...byFolder.entries()]
    .sort()
    .map(([folder, files]) => {
      const rows = files
        .map((f) => `<a class="row" href="${f.rel}"><span>${f.rel}</span><span class="sz">${human(f.size)}</span></a>`)
        .join("");
      return `<details open><summary>${folder}/ <span class="count">${files.length}</span></summary>${rows}</details>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Plain Dharma — dist navigator</title>
<style>
  :root { color-scheme: dark; }
  html,body{margin:0;background:#15140f;color:#e9e3d4;font-family:system-ui,-apple-system,sans-serif;}
  header{padding:26px 30px 6px;} h1{margin:0;font-size:19px;} header p{margin:6px 0 0;opacity:.55;font-size:13px;}
  section{padding:10px 30px 6px;} h2{font-size:14px;letter-spacing:.06em;text-transform:uppercase;margin:18px 0 2px;color:#fbc608;}
  .note{margin:0 0 12px;opacity:.55;font-size:12px;}
  .grid{display:flex;flex-wrap:wrap;gap:14px;}
  .item{display:flex;flex-direction:column;width:150px;text-decoration:none;color:inherit;background:#201d16;border-radius:8px;overflow:hidden;transition:.12s;}
  .item:hover{transform:translateY(-2px);background:#28241b;}
  .thumb{position:relative;height:190px;display:flex;align-items:center;justify-content:center;background:#0f0e0a;}
  .thumb img{max-width:100%;max-height:100%;object-fit:contain;background:#fff;}
  .tag{position:absolute;bottom:6px;right:6px;background:rgba(21,20,15,.82);color:#fbc608;font-size:9px;font-weight:700;letter-spacing:.06em;padding:2px 5px;border-radius:3px;}
  .ext{font-size:22px;font-weight:700;letter-spacing:.08em;color:#fbc608;opacity:.85;}
  .meta{padding:8px 10px;display:flex;flex-direction:column;gap:2px;}
  .fn{font-size:11px;word-break:break-all;} .sz{font-size:11px;opacity:.5;}
  details{margin:6px 30px;border-top:1px solid #2a271e;}
  summary{cursor:pointer;padding:10px 0;font-size:13px;letter-spacing:.04em;text-transform:uppercase;opacity:.85;}
  .count{opacity:.4;font-size:11px;}
  .row{display:flex;justify-content:space-between;padding:5px 0 5px 16px;text-decoration:none;color:inherit;font-size:12px;opacity:.8;}
  .row:hover{opacity:1;color:#fbc608;} .row .sz{opacity:.45;}
  footer{padding:24px 30px 40px;opacity:.4;font-size:11px;}
</style></head>
<body>
  <header><h1>Plain Dharma — dist navigator</h1>
    <p>${all.length} artifacts · regenerate with <code>pnpm build-dist-index</code> (runs in build-all)</p></header>
  ${destSections}
  <section><h2>Everything, by folder</h2><div class="note">the full tree</div></section>
  ${folderSections}
  <footer>Generated by scripts/build-dist-index.ts</footer>
</body></html>`;

  writeFileSync(INDEX, html);
  console.log(`[build-dist-index] wrote ${INDEX} (${all.length} artifacts)`);
}

main();
