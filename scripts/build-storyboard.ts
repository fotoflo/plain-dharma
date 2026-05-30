/**
 * Build a "tall format" picture-book storyboard of the actual Plain Dharma book.
 *
 * Renders every page of the screen PDF (dist/pdf/plain-dharma.pdf — 40 pages,
 * front cover … content … back cover) to a thumbnail and tiles them in the
 * classic storyboard grid: page 1 single (front cover), reading spreads 2–3 …
 * 38–39, page 40 single (back cover). A planning/at-a-glance map, not a reader
 * artifact, so it is NOT published — output lands in dist/storyboard/.
 *
 * Pure ImageMagick: pdftoppm rasterizes each page, magick borders + pairs them
 * into spread cells with a caption, then composites the cells onto one canvas.
 *
 * Run: pnpm build-storyboard   (run `pnpm build-pdf` first so the PDF is fresh)
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCREEN_PDF = join(ROOT, "dist", "pdf", "plain-dharma.pdf");
const OUT_DIR = join(ROOT, "dist", "storyboard");
const WORK = join(OUT_DIR, "work");
const FONT = join(ROOT, "src", "app", "fonts", "GaramondLibre-Regular.otf");
const FONT_BOLD = join(ROOT, "src", "app", "fonts", "GaramondLibre-Bold.otf");

// Thumbnail + grid geometry (px). Page is 6×9 → 2:3.
const PH = 240; // page thumb height
const PW = Math.round((PH * 6) / 9); // = 160
const LABEL_H = 34;
const SPREAD_W = PW * 2; // two pages side by side
const CELL_H = PH + LABEL_H;
const COLS = 5;
const COL_GAP = 44;
const COL_STEP = SPREAD_W + COL_GAP;
const LM = 44; // left margin
const RIGHT_M = 90; // wider right margin so the top-right cover never clips
// Top band holds the title (left) + the page-1 cover single (right). Tall enough
// for the whole cover cell so it sits clearly ABOVE the rows (no overlap).
const PAGE1_Y = 24;
const TITLE_H = PAGE1_Y + CELL_H + 30;
const ROW_STEP = CELL_H + 44;

const CANVAS_W = LM + COLS * SPREAD_W + (COLS - 1) * COL_GAP + RIGHT_M;
const CANVAS_H = TITLE_H + 4 * ROW_STEP + 60;

// Column x positions, and the right-aligned slot for the single corner pages.
const colX = Array.from({ length: COLS }, (_, c) => LM + c * COL_STEP);
const SINGLE_X = colX[COLS - 1] + PW; // recto slot of the last column

// Labels for the structurally notable pages; everything else is "L  R".
const NOTE: Record<number, string> = {
  1: "1   front cover",
  40: "40   back cover",
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function pageImg(n: number): string {
  return join(WORK, `pg-${pad(n)}.png`);
}

// A single page, black-bordered like the reference's boxes.
function borderedPage(n: number): string {
  const out = join(WORK, `b-${pad(n)}.png`);
  execFileSync("magick", [pageImg(n), "-bordercolor", "black", "-border", "1", out]);
  return out;
}

// Build one labeled cell (a spread, or a single corner page) → file path.
function buildCell(name: string, pages: number[], label: string): string {
  const imgs = pages.map(borderedPage);
  const joined = join(WORK, `cell-${name}.png`);
  if (imgs.length === 2) {
    execFileSync("magick", [imgs[0], imgs[1], "+append", joined]);
  } else {
    execFileSync("magick", [imgs[0], joined]);
  }
  const stripW = imgs.length === 2 ? SPREAD_W + 4 : PW + 2;
  const cell = join(WORK, `out-${name}.png`);
  execFileSync("magick", [
    joined,
    "(",
    "-size", `${stripW}x${LABEL_H}`,
    "-background", "white",
    "-font", FONT,
    "-pointsize", "17",
    "-fill", "#2A2520",
    "-gravity", "center",
    `caption:${label}`,
    ")",
    "-background", "white",
    "-append",
    cell,
  ]);
  return cell;
}

function main(): void {
  if (!existsSync(SCREEN_PDF)) {
    console.error(`ERROR: missing ${SCREEN_PDF} — run \`pnpm build-pdf\` first.`);
    process.exit(1);
  }
  rmSync(WORK, { recursive: true, force: true });
  mkdirSync(WORK, { recursive: true });

  // 1. Rasterize every page to a PH-tall thumbnail. Use -scale-to (scales the
  // larger dim, preserving aspect) — this poppler's -scale-to-y leaves the width
  // at the default DPI, squishing the page. Our pages are portrait 6×9, so the
  // larger dim is height → PH tall, ~160 wide.
  execFileSync("pdftoppm", ["-png", "-scale-to", String(PH), SCREEN_PDF, join(WORK, "pg")], {
    stdio: "inherit",
  });

  // 2. Build the cells: page 1 single, spreads 2–3 … 38–39, page 40 single.
  type Placed = { cell: string; x: number; y: number };
  const placed: Placed[] = [];

  // Page-1 single, top-right in its own band above the rows.
  placed.push({ cell: buildCell("p1", [1], NOTE[1]), x: SINGLE_X, y: PAGE1_Y });

  // Spreads 2–3 … 38–39 fill the 4 rows left-to-right.
  let spreadIdx = 0;
  for (let left = 2; left <= 38; left += 2) {
    const right = left + 1;
    const row = Math.floor(spreadIdx / COLS);
    const col = spreadIdx % COLS;
    const label = NOTE[left] ?? `${left}     ${right}`;
    placed.push({
      cell: buildCell(`s${left}`, [left, right], label),
      x: colX[col],
      y: TITLE_H + row * ROW_STEP,
    });
    spreadIdx++;
  }

  // Page-40 single sits in the last column of the final row (after 38–39).
  placed.push({
    cell: buildCell("p40", [40], NOTE[40]),
    x: SINGLE_X,
    y: TITLE_H + 3 * ROW_STEP,
  });

  // 3. Composite everything onto one white canvas with a title + footer.
  const out = join(OUT_DIR, "plain-dharma-storyboard.png");
  const args: string[] = ["-size", `${CANVAS_W}x${CANVAS_H}`, "xc:white"];
  for (const p of placed) {
    args.push("-draw", `image Over ${p.x},${p.y} 0,0 '${p.cell}'`);
  }
  args.push(
    "-font", FONT_BOLD,
    "-pointsize", "30",
    "-fill", "#2A2520",
    "-draw", `text ${LM},58 'Plain Dharma — 40-page storyboard'`,
    "-font", FONT,
    "-pointsize", "16",
    "-fill", "#6B5F50",
    "-draw", `text ${LM},86 'Six foundational suttas in plain modern English · front cover, reading spreads, back cover'`,
    "-draw", `text ${CANVAS_W - 200},${CANVAS_H - 22} 'plaindharma.com'`,
    out
  );
  execFileSync("magick", args, { stdio: "inherit" });

  // PDF companion (handy for printing the plan at full size).
  const pdf = join(OUT_DIR, "plain-dharma-storyboard.pdf");
  execFileSync("magick", [out, "-units", "PixelsPerInch", "-density", "150", pdf]);

  rmSync(WORK, { recursive: true, force: true });
  console.log(`[build-storyboard] wrote ${out}`);
  console.log(`[build-storyboard] wrote ${pdf}`);
}

main();
