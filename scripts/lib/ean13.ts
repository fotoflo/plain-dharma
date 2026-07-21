/**
 * EAN-13 (Bookland) barcode → standalone TikZ, for the back-cover template.
 *
 * The back cover is XeLaTeX-with-TikZ already (scripts/templates/back-cover.tex),
 * and there's no barcode package in the BasicTeX install, so rather than pull in
 * a dependency we encode the symbol ourselves and emit it as TikZ rectangles.
 * Output is pure vector, renders through the existing pdftoppm → magick raster
 * step, and needs no `$`/math mode (so it survives the template's __TOKEN__
 * string substitution untouched).
 *
 * A book ISBN-13 is its own EAN-13: the 13 digits ARE the barcode. The leading
 * digit isn't drawn as bars — it selects the odd/even parity pattern of the six
 * left-hand digits and is printed in the left quiet zone.
 */

// 7-module glyphs, indexed by digit. L = odd parity, G = even parity (left
// half); R = right half (complement of L). 1 = black module, 0 = white.
const L = ["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"];
const G = ["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"];
const R = ["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"];
// Which of L/G each of the six left digits uses, selected by the first digit.
const PARITY = ["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"];

/** Strip hyphens/spaces; assert 13 digits with a valid ISBN-13/EAN-13 check digit. */
function normalize(code: string): number[] {
  const digits = code.replace(/[^0-9]/g, "").split("").map(Number);
  if (digits.length !== 13) {
    throw new Error(`EAN-13 needs 13 digits, got ${digits.length} from "${code}"`);
  }
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  if (sum % 10 !== 0) {
    throw new Error(`Invalid EAN-13 check digit for "${code}" (weighted sum ${sum} not divisible by 10)`);
  }
  return digits;
}

/** The 95-module black/white pattern: start guard, 6 left, center guard, 6 right, end guard. */
function encode(digits: number[]): string {
  const parity = PARITY[digits[0]];
  let bars = "101"; // start guard
  for (let i = 0; i < 6; i++) {
    const table = parity[i] === "L" ? L : G;
    bars += table[digits[1 + i]];
  }
  bars += "01010"; // center guard
  for (let i = 0; i < 6; i++) bars += R[digits[7 + i]];
  bars += "101"; // end guard
  return bars; // length 95
}

// Guard bars (start / center / end) run full height; data bars are shortened so
// the human-readable digits sit beneath them.
function isGuardModule(k: number): boolean {
  return k <= 2 || (k >= 45 && k <= 49) || k >= 92;
}

export type Ean13Options = {
  /** Width of one module, as a LaTeX length string. Default keeps the symbol ~0.9in wide. */
  moduleWidth?: string;
  /** Bar (full) height as a LaTeX length string. */
  barHeight?: string;
  /** TikZ color name for the bars + digits. */
  color?: string;
  /** Point size for the human-readable digit row. */
  fontPt?: number;
};

/**
 * Return a self-contained `tikzpicture` drawing the EAN-13 symbol for `code`,
 * with the human-readable digit row (first digit in the left quiet zone).
 */
export function ean13Tikz(code: string, opts: Ean13Options = {}): string {
  const digits = normalize(code);
  const bars = encode(digits);

  const mw = opts.moduleWidth ?? "0.0083in";
  const H = opts.barHeight ?? "0.32in";
  const color = opts.color ?? "black";
  const fontPt = opts.fontPt ?? 5;

  // The y axis is 1in per unit, so these are inch coordinates. TOP is set from
  // `barHeight` so the caller's height drives the geometry; the bottoms are
  // fractions of an inch chosen to leave room for the digit row.
  const TOP = parseFloat(H);          // bar top, in inches
  const GUARD_BOT = 0.0;              // guard bars reach the baseline of the digit row
  const DATA_BOT = Math.min(0.055, TOP * 0.18); // data bars stop short to clear the digits
  const BASE = 0.0;                   // digit baseline

  const lines: string[] = [];
  lines.push(`\\begin{tikzpicture}[x=${mw}, y=1in, inner sep=0pt, outer sep=0pt]`);

  // Bars.
  for (let k = 0; k < bars.length; k++) {
    if (bars[k] !== "1") continue;
    const bot = isGuardModule(k) ? GUARD_BOT : DATA_BOT;
    lines.push(`\\fill[${color}] (${k}, ${bot}) rectangle (${k + 1}, ${TOP});`);
  }

  // Human-readable digits.
  const digit = (x: number, d: number) =>
    `\\node[font=\\fontsize{${fontPt}}{${fontPt}}\\selectfont, text=${color}, anchor=base] at (${x}, ${BASE}) {${d}};`;
  // First digit, in the left quiet zone.
  lines.push(digit(-4, digits[0]));
  // Left group: 6 digits, each centered in its 7-module cell (cells start at module 3).
  for (let i = 0; i < 6; i++) lines.push(digit(3 + 7 * i + 3.5, digits[1 + i]));
  // Right group: cells start at module 50.
  for (let i = 0; i < 6; i++) lines.push(digit(50 + 7 * i + 3.5, digits[7 + i]));

  lines.push("\\end{tikzpicture}");
  return lines.join("\n");
}

export type Ean13SvgOptions = {
  /** Width of one module in px. */
  moduleWidth?: number;
  /** Guard-bar (full) height in px. */
  barHeight?: number;
  /** Bar + digit color. */
  color?: string;
  /** Human-readable digit font size in px. */
  fontPx?: number;
  /** Quiet-zone / background fill. */
  bg?: string;
};

/**
 * Return a self-contained `<svg>` string for the EAN-13 symbol — the SAME 95-
 * module pattern as `ean13Tikz` (both call `encode`), emitted as SVG rects so
 * the HTML covers can carry a scannable barcode without LaTeX.
 */
export function ean13Svg(code: string, opts: Ean13SvgOptions = {}): string {
  const digits = normalize(code);
  const bars = encode(digits); // 95 modules
  const mw = opts.moduleWidth ?? 2.2;
  const H = opts.barHeight ?? 80;
  const color = opts.color ?? "#1F1812";
  const fontPx = opts.fontPx ?? 15;
  const bg = opts.bg ?? "#ffffff";

  const QL = 11; // left quiet zone (modules) — room for the first digit
  const QR = 7; // right quiet zone (modules)
  const digitGap = fontPx * 1.05; // data bars stop short to clear the digit row
  const dataH = H - digitGap;
  const W = (QL + 95 + QR) * mw;
  const svgH = H + 3;
  const baseY = H - 1; // digit baseline

  const px = (n: number) => n.toFixed(2);
  const rects: string[] = [];
  for (let k = 0; k < bars.length; k++) {
    if (bars[k] !== "1") continue;
    const h = isGuardModule(k) ? H : dataH;
    rects.push(`<rect x="${px((QL + k) * mw)}" y="0" width="${px(mw)}" height="${px(h)}" fill="${color}"/>`);
  }

  const digit = (moduleCenter: number, d: number) =>
    `<text x="${px((QL + moduleCenter) * mw)}" y="${px(baseY)}" font-family="Helvetica,Arial,sans-serif" font-size="${fontPx}" fill="${color}" text-anchor="middle">${d}</text>`;
  const texts: string[] = [
    `<text x="${px((QL - 6) * mw)}" y="${px(baseY)}" font-family="Helvetica,Arial,sans-serif" font-size="${fontPx}" fill="${color}" text-anchor="middle">${digits[0]}</text>`,
  ];
  for (let i = 0; i < 6; i++) texts.push(digit(3 + 7 * i + 3.5, digits[1 + i]));
  for (let i = 0; i < 6; i++) texts.push(digit(50 + 7 * i + 3.5, digits[7 + i]));

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px(W)}" height="${px(svgH)}" viewBox="0 0 ${px(W)} ${px(svgH)}">`,
    `<rect x="0" y="0" width="${px(W)}" height="${px(svgH)}" fill="${bg}"/>`,
    ...rects,
    ...texts,
    `</svg>`,
  ].join("");
}
