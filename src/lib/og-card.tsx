import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Shared Open Graph card renderer. Mirrors site palette (parchment + saffron)
// and ships Garamond Libre to Satori so the cards read in the same typeface
// as the site. Designed for impact at thumbnail size: minimal copy, very
// large type — three text zones (eyebrow / headline / brand) plus one art
// column.

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

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

export async function publicImageDataUrl(publicPath: string): Promise<string> {
  const abs = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  const buf = await readFile(abs);
  const ext = path.extname(publicPath).slice(1).toLowerCase();
  const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  return `data:${mime};base64,${buf.toString("base64")}`;
}

type OgCardOpts = {
  eyebrow: string;                 // top-left label (uppercase)
  title: string;                   // huge headline; \n forces a line break
  tagline?: string;                // optional second-tier line below title (italic)
  illustrationDataUrl: string;     // required art column on the right
};

export async function renderOgCard(opts: OgCardOpts) {
  const fonts = await loadFonts();
  const TEXT_MAX = 640; // keeps headline from running into the art column

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: PAPER,
          fontFamily: "Garamond Libre, serif",
          color: INK,
          position: "relative",
        }}
      >
        {/* Saffron rule along the top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: ACCENT,
          }}
        />

        {/* Text column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "space-between",
            padding: "64px 40px 56px 80px",
          }}
        >
          <div
            style={{
              display: "flex",
              color: ACCENT_STRONG,
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              maxWidth: TEXT_MAX,
            }}
          >
            {opts.eyebrow}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                color: INK,
                fontSize: 92,
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: "-0.02em",
                maxWidth: TEXT_MAX,
                whiteSpace: "pre-line",
              }}
            >
              {opts.title}
            </div>
            {opts.tagline && (
              <div
                style={{
                  display: "flex",
                  color: INK,
                  opacity: 0.78,
                  fontSize: 44,
                  fontStyle: "italic",
                  lineHeight: 1.3,
                  marginTop: 28,
                  maxWidth: TEXT_MAX,
                }}
              >
                {opts.tagline}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderTop: `1px solid ${DIVIDER}`,
              paddingTop: 22,
            }}
          >
            <div
              style={{
                color: INK,
                opacity: 0.6,
                fontSize: 32,
              }}
            >
              plaindharma.com
            </div>
          </div>
        </div>

        {/* Art column */}
        <div
          style={{
            display: "flex",
            width: 470,
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 60px 60px 0",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={opts.illustrationDataUrl}
            alt=""
            width={410}
            height={410}
            style={{ width: 410, height: 410, objectFit: "contain" }}
          />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts,
    },
  );
}
