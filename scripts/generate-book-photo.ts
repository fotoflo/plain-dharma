/**
 * Generate a photorealistic product photo of the printed Plain Dharma book.
 *
 * Image-to-image: feeds Gemini the REAL designed cover (downloads/plain-dharma-cover.jpg,
 * pulled from the CDN) so the rendered book keeps the exact title, artwork, and
 * palette instead of inventing a new cover.
 *
 * Run with: node --env-file=.env.local --import tsx scripts/generate-book-photo.ts
 *
 * Writes public/downloads/plain-dharma-book-photo.png. Re-runs overwrite (no skip)
 * so you can iterate on the prompt. After it looks right:
 *   pnpm upload-assets   # publishes to the CDN so the live site picks it up
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Raw render goes to a tmp dir (a flat-gray-background shot we then chroma-key).
// Keep it OUT of public/downloads — the upload script publishes that whole tree.
const OUT_DIR = "/tmp/pd-book";
const OUT_PATH = join(OUT_DIR, "book-raw.png");

const COVER_URL =
  "https://ffoiltrarbdbibmymlqm.supabase.co/storage/v1/object/public/assets/downloads/plain-dharma-cover.jpg";

// Google's image-preview model name churns — try a few in order.
const MODEL_CANDIDATES = [
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-3.1-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
];

const PROMPT = `Using the attached image as the EXACT front cover, render a photorealistic studio product photograph of this as a real printed book — a SLIM paperback, only about 100–120 pages thick (a thin, light book, NOT a chunky hardcover).

The book stands upright, turned just a few degrees so the front cover faces the camera and only a NARROW sliver of the spine is visible on the left edge. Keep the spine thin and in proportion to a slim book. Keep the cover artwork, title "Plain Dharma", subtitle, the two credit lines ("Translated by Claude Opus" and "Edited by Alex Miller"), the footer, and the cream/saffron palette EXACTLY as in the attached image — do not redesign, recolor, retypeset, crop, or alter any text.

SPINE: leave the spine a clean, plain saffron-yellow band with NO text on it at all. Do not attempt to letter the spine (spine text renders garbled).

Lighting: soft, warm, natural studio light from the upper left, modeling the book's form (gentle highlight and shading on the cover and spine).

BACKGROUND: a deep, DARK near-black studio backdrop (like a night sky) so the bright cream book is cleanly separable. A soft contact shadow beneath the book is fine — the cut-out step removes the whole dark backdrop by luma (see scripts/cutout-book.ts), so the exact darkness/gradient doesn't matter as long as it stays clearly darker than the cream cover. Nothing else in frame. Generous breathing room around the book. Photorealistic, high detail, no illustration, no flat mockup look. Portrait orientation.`;

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  inline_data?: { mime_type?: string; data?: string };
};
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message?: string; status?: string };
};

async function loadCoverBase64(): Promise<string> {
  const res = await fetch(COVER_URL);
  if (!res.ok) throw new Error(`Failed to fetch cover: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString("base64");
}

async function callGemini(
  model: string,
  apiKey: string,
  coverB64: string,
): Promise<Buffer | { error: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: "image/jpeg", data: coverB64 } },
            { text: PROMPT },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  });

  const text = await res.text();
  if (!res.ok) return { error: `HTTP ${res.status}: ${text.slice(0, 400)}` };

  let json: GeminiResponse;
  try {
    json = JSON.parse(text) as GeminiResponse;
  } catch {
    return { error: `Non-JSON response: ${text.slice(0, 400)}` };
  }
  if (json.error) {
    return { error: `API error: ${json.error.message ?? JSON.stringify(json.error)}` };
  }

  const parts = json.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const data = p.inlineData?.data ?? p.inline_data?.data;
    if (data) return Buffer.from(data, "base64");
  }
  return { error: `No image part in response: ${text.slice(0, 400)}` };
}

async function main() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
  if (!apiKey) {
    console.error("ERROR: GOOGLE_GENERATIVE_AI_KEY not set. Run with: node --env-file=.env.local ...");
    process.exit(1);
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  console.log("Fetching the real cover…");
  const coverB64 = await loadCoverBase64();

  const errors: string[] = [];
  for (const model of MODEL_CANDIDATES) {
    console.log(`Trying ${model}…`);
    const result = await callGemini(model, apiKey, coverB64);
    if (Buffer.isBuffer(result)) {
      writeFileSync(OUT_PATH, result);
      console.log(`\n✓ saved ${OUT_PATH} (${result.length} bytes) via ${model}`);
      console.log("  Review it, then run `pnpm upload-assets` to publish.");
      return;
    }
    errors.push(`[${model}] ${result.error}`);
    if (/API key|UNAUTHENTICATED|PERMISSION_DENIED|401|403/i.test(result.error)) break;
  }
  console.error(`\n✗ failed:\n  ${errors.join("\n  ")}`);
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
