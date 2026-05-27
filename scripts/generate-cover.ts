/**
 * Generate a KDP-ready cover for the Plain Dharma ebook.
 *
 * Two stages:
 *   1. Call Gemini for the cover artwork — same visual family as the interior
 *      illustrations (one continuous ink line + saffron wash, cream ground),
 *      but framed and composed as a cover hero.
 *   2. Composite the artwork onto a 1600×2560 cream canvas with title,
 *      subtitle, and author typography using ImageMagick + Garamond Libre.
 *
 * KDP recommends 1600×2560 (5:8). JPEG. < 50 MB.
 *
 * Run: pnpm generate-cover
 *
 * Re-runs reuse dist/ebook/cover-artwork.png if it exists (so you don't burn
 * Gemini calls iterating on the typography). Delete that file to regenerate
 * the artwork.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = join(dirname(__filename), "..");
const OUT_DIR = join(ROOT, "dist", "ebook");
const FONT_REGULAR = join(ROOT, "src/app/fonts/GaramondLibre-Regular.otf");
const FONT_ITALIC = join(ROOT, "src/app/fonts/GaramondLibre-Italic.otf");
const FONT_BOLD = join(ROOT, "src/app/fonts/GaramondLibre-Bold.otf");

const TITLE = "Plain Dharma";
const SUBTITLE = "Six Foundational Buddhist Teachings\nin Plain Modern English";
const AUTHOR = "Alex Miller";

// Brand palette — matches the site's --color-cream / --color-ink / --color-saffron.
const CREAM = "#F5EFE0";
const INK = "#2A2520";

// KDP recommended cover dimensions: 1600×2560 (5:8).
const COVER_W = 1600;
const COVER_H = 2560;

// Gemini's image-preview endpoint name has churned — try a few in order.
const MODEL_CANDIDATES = [
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
  "gemini-3.1-flash-image-preview",
];

const COVER_ARTWORK_PROMPT = `Single gestural ink line drawing in the style of Matisse or Saul Steinberg: ONE continuous flowing black line, minimal, confident, hand-drawn quality, no shading or hatching. The subject is a simple sun rising over a low horizon, with a few soft radiating rays — minimal and emblematic, like a quiet mark of awakening. Behind and beneath the sun sits a generous, lush watercolor wash in warm saffron orange (#C7651C) — genuinely painterly, with soft bleeding feathered edges, gentle tonal variation and a little granulation, luminous and translucent (never a flat solid fill). The wash is prominent and enveloping, covering roughly the central half of the composition and softly overlapping the line. The composition is centered with generous empty space all around — at the very top and very bottom of the frame especially — so the artwork reads as a quiet emblem floating in cream space. Off-white cream background (#F5EFE0). Modern editorial illustration aesthetic — like a Penguin Classics cover or New York Review of Books illustration. Square 1:1 aspect ratio. Do NOT include any text or lettering anywhere. Do NOT include any explicitly religious iconography — no Buddha figures, no monks, no robes, no halos, no temples, no lotus symbols. The image must read as universal/humanist.`;

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  inline_data?: { mime_type?: string; data?: string };
};
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message?: string; status?: string };
};

async function callGemini(
  model: string,
  apiKey: string,
  prompt: string
): Promise<Buffer | { error: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  const text = await res.text();
  if (!res.ok) return { error: `HTTP ${res.status}: ${text.slice(0, 400)}` };

  let json: GeminiResponse;
  try {
    json = JSON.parse(text) as GeminiResponse;
  } catch {
    return { error: `Non-JSON: ${text.slice(0, 400)}` };
  }
  if (json.error) {
    return { error: json.error.message ?? JSON.stringify(json.error) };
  }
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const data = p.inlineData?.data ?? p.inline_data?.data;
    if (data) return Buffer.from(data, "base64");
  }
  return { error: `No image in response: ${text.slice(0, 400)}` };
}

async function generateArtwork(apiKey: string, outPath: string): Promise<void> {
  if (existsSync(outPath)) {
    console.log(`[generate-cover] reusing existing artwork: ${outPath}`);
    return;
  }
  const errors: string[] = [];
  for (const model of MODEL_CANDIDATES) {
    console.log(`[generate-cover] trying ${model}...`);
    const result = await callGemini(model, apiKey, COVER_ARTWORK_PROMPT);
    if (Buffer.isBuffer(result)) {
      writeFileSync(outPath, result);
      console.log(`[generate-cover] saved artwork: ${outPath} (${result.length} bytes)`);
      return;
    }
    errors.push(`[${model}] ${result.error}`);
    if (/API key|UNAUTHENTICATED|PERMISSION_DENIED|401|403/i.test(result.error)) break;
  }
  throw new Error(`Gemini failed:\n  ${errors.join("\n  ")}`);
}

// Compose the cover with ImageMagick:
//   - blank 1600×2560 cream canvas
//   - artwork resized to fit a 1200×1200 box in the middle, centered
//   - title (large, top), subtitle (italic, below title), author (bottom)
function composeCover(artworkPath: string, outPath: string): void {
  const args = [
    "-size", `${COVER_W}x${COVER_H}`, `xc:${CREAM}`,
    // Artwork layer: drop Gemini's near-white background so the wash floats
    // on the canvas cream instead of being visibly framed by its own off-white
    // rectangle. Fuzz 12% catches the ~#FCFCFC / #FAF7EE range Gemini returns.
    "(", artworkPath, "-fuzz", "12%", "-transparent", "white", "-resize", "1200x1200", ")",
    "-gravity", "center", "-composite",
    // Title (top).
    "-fill", INK,
    "-font", FONT_BOLD,
    "-pointsize", "150",
    "-gravity", "north",
    "-annotate", "+0+260", TITLE,
    // Subtitle (italic, below title; two lines via \n).
    "-font", FONT_ITALIC,
    "-pointsize", "55",
    "-interline-spacing", "12",
    "-annotate", "+0+470", SUBTITLE,
    // Author (bottom).
    "-font", FONT_REGULAR,
    "-pointsize", "75",
    "-gravity", "south",
    "-annotate", "+0+300", AUTHOR,
    // Small wordmark beneath author.
    "-font", FONT_ITALIC,
    "-pointsize", "38",
    "-annotate", "+0+200", "plaindharma.com",
    // JPEG output for KDP.
    "-quality", "92",
    outPath,
  ];

  execFileSync("magick", args, { stdio: "inherit" });
}

async function main(): Promise<void> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
  if (!apiKey) {
    console.error(
      "ERROR: GOOGLE_GENERATIVE_AI_KEY not set. Run with: pnpm generate-cover"
    );
    process.exit(1);
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const artwork = join(OUT_DIR, "cover-artwork.png");
  const cover = join(OUT_DIR, "cover.jpg");

  await generateArtwork(apiKey, artwork);
  composeCover(artwork, cover);
  console.log(`\n[generate-cover] wrote ${cover} (${COVER_W}×${COVER_H})`);
  console.log(`[generate-cover] now run \`pnpm build-ebook\` to attach it.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
