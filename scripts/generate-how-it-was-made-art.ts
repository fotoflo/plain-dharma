/**
 * One-off header illustration for /how-it-was-made, in the site's house style
 * (matches scripts/generate-illustrations.ts STYLE_PREAMBLE exactly).
 *
 * Run: node --env-file=.env.local --import tsx scripts/generate-how-it-was-made-art.ts
 * Writes public/how-it-was-made/header.png (overwrites). Then transparentize as usual.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "how-it-was-made");

const MODEL_CANDIDATES = [
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
  "gemini-3.1-flash-image-preview",
];

const STYLE_PREAMBLE = `Single gestural ink line drawing in the style of Matisse or Saul Steinberg: ONE continuous flowing black line, minimal, confident, hand-drawn quality, no shading or hatching. Behind the figure sits a generous, lush watercolor wash in warm saffron orange (#C7651C) — genuinely painterly, with soft bleeding feathered edges, gentle tonal variation and a little granulation, luminous and translucent (never a flat solid fill). The wash is prominent and enveloping, covering roughly the central third to half of the composition and softly overlapping the line, but it still leaves clean cream space at the margins. Off-white cream background (#F5EFE0). Modern editorial illustration aesthetic — like a Penguin Classics cover or New York Review of Books illustration. One simple subject, centered. Square 1:1 aspect ratio. Do NOT include any explicitly religious iconography — no Buddha figures, no monks, no robes, no halos, no temples, no lotus symbols. The image must read as universal/humanist, not Buddhist-iconographic.`;

const JOBS: Record<string, { file: string; subject: string }> = {
  header: {
    file: "header.png",
    subject: `Subject: An open book lying flat, rendered as ONE continuous flowing ink line — minimal and gestural. From its open pages a few loose flowing lines lift and drift upward, like words taking flight or breath rising. Clean and uncluttered with lots of empty space.`,
  },
  detour: {
    file: "detour.png",
    subject: `Subject: A pair of cool sunglasses, rendered as ONE continuous flowing ink line — minimal, gestural, jaunty and a little playful. Lots of empty space around it.`,
  },
  dawn: {
    file: "dawn.png",
    subject: `Subject: A slender crescent moon with one or two tiny stars, rendered as ONE continuous flowing ink line — minimal and gestural, quiet and nocturnal, the hush of three in the morning. Lots of empty space.`,
  },
  audio: {
    file: "audio.png",
    subject: `Subject: A simple pair of over-ear headphones, rendered as ONE continuous flowing ink line — minimal and gestural. Lots of empty space around them.`,
  },
  key: {
    file: "key.png",
    subject: `Subject: A single old-fashioned key, rendered as ONE continuous flowing ink line — minimal and gestural. Lots of empty space around it.`,
  },
};

async function callGemini(model: string, apiKey: string, prompt: string) {
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
  if (!res.ok) return { error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
  let json: {
    candidates?: { content?: { parts?: Array<{ inlineData?: { data?: string }; inline_data?: { data?: string } }> } }[];
    error?: { message?: string };
  };
  try {
    json = JSON.parse(text);
  } catch {
    return { error: `Non-JSON: ${text.slice(0, 200)}` };
  }
  if (json.error) return { error: json.error.message ?? "API error" };
  for (const p of json.candidates?.[0]?.content?.parts ?? []) {
    const data = p.inlineData?.data ?? p.inline_data?.data;
    if (data) return { buffer: Buffer.from(data, "base64") };
  }
  return { error: "No image part in response" };
}

async function main() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
  if (!apiKey) {
    console.error("Missing GOOGLE_GENERATIVE_AI_KEY");
    process.exit(1);
  }
  const jobName = process.argv[2] ?? "header";
  const job = JOBS[jobName];
  if (!job) {
    console.error(`Unknown job "${jobName}". Options: ${Object.keys(JOBS).join(", ")}`);
    process.exit(1);
  }
  const OUT = join(OUT_DIR, job.file);
  mkdirSync(OUT_DIR, { recursive: true });
  const prompt = `${STYLE_PREAMBLE}\n\n${job.subject}`;
  for (const model of MODEL_CANDIDATES) {
    process.stdout.write(`Trying ${model}... `);
    const out = await callGemini(model, apiKey, prompt);
    if ("buffer" in out) {
      writeFileSync(OUT, out.buffer);
      console.log(`OK → ${OUT} (${out.buffer.length} bytes)`);
      return;
    }
    console.log(`failed: ${out.error}`);
  }
  console.error("All model candidates failed.");
  process.exit(1);
}

void main();
