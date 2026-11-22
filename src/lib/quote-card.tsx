import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getMeta } from "@plain-dharma/content";
import { publicImageDataUrl } from "@/lib/og-card";
import type { Quote } from "@/content/quotes";

// The quote graphic: one quote on parchment, in Garamond, with the teaching
// it comes from and its illustration. Two shapes from one layout:
//   square — 1080×1080, to post in groups, Instagram, Threads
//   og     — 1200×630, the link preview of plaindharma.com/quotes/<id>
// Same palette as og-card.tsx so every card the site makes looks like one set.

export const QUOTE_SQUARE = { width: 1080, height: 1080 } as const;
export const QUOTE_OG = { width: 1200, height: 630 } as const;

const PAPER = "#f5efe0";
const INK = "#1f1812";
const ACCENT = "#c7651c";
const ACCENT_STRONG = "#8b3a0f";
const DIVIDER = "#e0d4b8";

let fontsPromise: Promise<
  { name: string; data: Buffer; weight: 400 | 700; style: "normal" | "italic" }[]
> | null = null;

function loadFonts() {
  if (!fontsPromise) {
    const dir = path.join(process.cwd(), "src/app/fonts");
    fontsPromise = Promise.all([
      readFile(path.join(dir, "GaramondLibre-Regular.otf")),
      readFile(path.join(dir, "GaramondLibre-Italic.otf")),
      readFile(path.join(dir, "GaramondLibre-Bold.otf")),
    ]).then(([regular, italic, bold]) => [
      { name: "Garamond Libre", data: regular, weight: 400 as const, style: "normal" as const },
      { name: "Garamond Libre", data: italic, weight: 400 as const, style: "italic" as const },
      { name: "Garamond Libre", data: bold, weight: 700 as const, style: "normal" as const },
    ]);
  }
  return fontsPromise;
}

/** Type size that fits the quote's length in the text box of each shape. */
function quoteSize(text: string, shape: "square" | "og") {
  const n = text.length;
  if (shape === "square") {
    if (n <= 45) return 88;
    if (n <= 80) return 74;
    if (n <= 130) return 62;
    if (n <= 180) return 54;
    return 46;
  }
  if (n <= 45) return 66;
  if (n <= 80) return 54;
  if (n <= 130) return 44;
  if (n <= 180) return 38;
  return 33;
}

/** Typographer's apostrophes: Garamond's straight ' reads as a prime mark. */
const curly = (s: string) => s.replace(/(\w)'(\w)/g, "$1’$2").replace(/'/g, "’");

export async function renderQuoteCard(quote: Quote, shape: "square" | "og") {
  const [fonts, art] = await Promise.all([
    loadFonts(),
    publicImageDataUrl(`/illustrations/${quote.sutta}.png`),
  ]);
  const meta = getMeta("en", quote.sutta);
  const size = shape === "square" ? QUOTE_SQUARE : QUOTE_OG;
  const fontSize = quoteSize(quote.text, shape);
  const pad = shape === "square" ? 96 : 72;
  const artSize = shape === "square" ? 240 : 170;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: PAPER,
          fontFamily: "Garamond Libre, serif",
          color: INK,
          position: "relative",
          padding: pad,
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: ACCENT }} />

        {/* The teaching's illustration, quiet in the corner. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art}
          alt=""
          width={artSize}
          height={artSize}
          style={{
            position: "absolute",
            right: shape === "square" ? 60 : 48,
            top: shape === "square" ? 50 : 36,
            width: artSize,
            height: artSize,
            objectFit: "contain",
            opacity: 0.4,
          }}
        />

        <div
          style={{
            display: "flex",
            color: ACCENT,
            fontSize: shape === "square" ? 200 : 150,
            lineHeight: 0.8,
            height: shape === "square" ? 110 : 80,
          }}
        >
          “
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            fontSize,
            lineHeight: 1.22,
            letterSpacing: "-0.01em",
            maxWidth: shape === "square" ? 880 : 960,
          }}
        >
          {curly(quote.text)}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderTop: `1px solid ${DIVIDER}`,
            paddingTop: shape === "square" ? 28 : 18,
            marginTop: 24,
          }}
        >
          <div style={{ display: "flex", fontSize: shape === "square" ? 40 : 30, fontWeight: 700, color: ACCENT_STRONG }}>
            — The Buddha
          </div>
          <div style={{ display: "flex", fontSize: shape === "square" ? 32 : 24, fontStyle: "italic", opacity: 0.78, marginTop: 6 }}>
            {curly(meta.title)} · {meta.pali_name}
          </div>
          <div style={{ display: "flex", fontSize: shape === "square" ? 28 : 22, opacity: 0.55, marginTop: 14 }}>
            plaindharma.com · free to share
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

/**
 * Buddha photos for the photo variant: Alex's own, from temples in Thailand,
 * China and Golden Gate Park. 1080² crops in the bucket under
 * downloads/quote-photos/ (pnpm upload-assets publishes them).
 */
export const QUOTE_PHOTOS = [
  "sukhothai-white",
  "golden-gate-park",
  "tree-roots",
  "bronze-head",
  "gold-seated",
  "stone-head-garden",
  "walking-buddha",
  "cave-buddha",
  "reclining-gold",
  "stone-garden",
] as const;

/** Each quote keeps the same photo: picked by its place in the list. */
export function quotePhoto(quote: Quote, index: number) {
  return quote.photo ?? QUOTE_PHOTOS[index % QUOTE_PHOTOS.length];
}

/**
 * The photo variant: one of the Buddha photos full-bleed, darkened toward the
 * bottom, with the quote in cream over it — the look most "Buddha quotes"
 * image results share. A/B partner of renderQuoteCard's illustration card.
 */
export async function renderQuotePhotoCard(
  quote: Quote,
  photo: string,
  shape: "square" | "og",
) {
  const [fonts, img] = await Promise.all([
    loadFonts(),
    publicImageDataUrl(`/downloads/quote-photos/${photo}.jpg`),
  ]);
  const meta = getMeta("en", quote.sutta);
  const size = shape === "square" ? QUOTE_SQUARE : QUOTE_OG;
  const fontSize = Math.round(quoteSize(quote.text, shape) * 0.86);
  const pad = shape === "square" ? 80 : 60;
  const CREAM = "#f5efe0";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          fontFamily: "Garamond Libre, serif",
          background: "#14100c",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt=""
          width={size.width}
          height={size.width}
          style={{
            position: "absolute",
            left: 0,
            top: shape === "square" ? 0 : -225,
            width: size.width,
            height: size.width,
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size.width,
            height: size.height,
            display: "flex",
            backgroundImage:
              shape === "square"
                ? "linear-gradient(to bottom, rgba(20,16,12,0) 0%, rgba(20,16,12,0.05) 30%, rgba(20,16,12,0.82) 55%, rgba(20,16,12,0.96) 100%)"
                : "linear-gradient(to right, rgba(20,16,12,0.15) 0%, rgba(20,16,12,0.8) 45%, rgba(20,16,12,0.94) 100%)",
          }}
        />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: ACCENT }} />
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            left: shape === "square" ? pad : 470,
            right: pad,
            top: shape === "square" ? 380 : pad,
            bottom: pad,
            color: CREAM,
          }}
        >
          <div style={{ display: "flex", fontSize, lineHeight: 1.22, letterSpacing: "-0.01em", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
            “{curly(quote.text)}”
          </div>
          <div style={{ display: "flex", marginTop: shape === "square" ? 34 : 22, fontSize: shape === "square" ? 38 : 28, fontWeight: 700, color: "#e9a35f" }}>
            — The Buddha
          </div>
          <div style={{ display: "flex", fontSize: shape === "square" ? 28 : 21, fontStyle: "italic", opacity: 0.85, marginTop: 4 }}>
            {curly(meta.title)} · {meta.pali_name}
          </div>
          <div style={{ display: "flex", fontSize: shape === "square" ? 25 : 19, opacity: 0.65, marginTop: 12 }}>
            plaindharma.com · free to share
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
