/**
 * Generate one illustration per sutta via Gemini's image-generation REST API.
 *
 * Run with: pnpm generate-illustrations
 * (Equivalent to: node --env-file=.env.local --import tsx scripts/generate-illustrations.ts)
 *
 * Skips any slug whose .png already exists in public/illustrations/
 * so re-runs don't burn API calls.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "illustrations");

// Try a few candidate models — Google's image-preview model name has churned.
// We attempt in order until one succeeds.
const MODEL_CANDIDATES = [
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
  "gemini-3.1-flash-image-preview",
];

const STYLE_PREAMBLE = `Single gestural ink line drawing in the style of Matisse or Saul Steinberg: ONE continuous flowing black line, minimal, confident, hand-drawn quality, no shading or hatching. Behind the figure sits a generous, lush watercolor wash in warm saffron orange (#C7651C) — genuinely painterly, with soft bleeding feathered edges, gentle tonal variation and a little granulation, luminous and translucent (never a flat solid fill). The wash is prominent and enveloping, covering roughly the central third to half of the composition and softly overlapping the line, but it still leaves clean cream space at the margins. Off-white cream background (#F5EFE0). Modern editorial illustration aesthetic — like a Penguin Classics cover or New York Review of Books illustration. One simple subject, centered. Square 1:1 aspect ratio. Do NOT include any explicitly religious iconography — no Buddha figures, no monks, no robes, no halos, no temples, no lotus symbols. The image must read as universal/humanist, not Buddhist-iconographic.`;

type Job = { slug: string; subject: string };

const JOBS: Job[] = [
  {
    slug: "first-talk",
    subject:
      "Subject: A simple sun rising over a low horizon with a few radiating rays, rendered as ONE continuous flowing ink line — minimal and gestural. Optionally one or two tiny deer silhouettes barely visible below the horizon line. Clean and uncluttered with lots of empty space.",
  },
  {
    slug: "not-self",
    subject:
      "Subject: A human head-and-shoulders silhouette in profile, rendered as ONE continuous flowing ink line, partially dissolving — the outline fragmenting and lifting away like leaves on the wind, suggesting impermanence. Minimal, gestural.",
  },
  {
    slug: "fire-sermon",
    subject:
      "Subject: A single tall flame, rendered as ONE continuous flowing ink line — gestural and calligraphic, minimal. NOT filled in; just the flowing outline of the flame.",
  },
  {
    slug: "loving-kindness",
    subject:
      "Subject: A simple silhouette of a parent cradling a child, both rendered in one continuous flowing line. Tender, intimate.",
  },
  {
    slug: "mindfulness",
    subject:
      "Subject: A single open eye, clear and calm, rendered as ONE continuous flowing ink line. Minimal and gestural, with lots of empty space.",
  },
  {
    slug: "how-to-decide",
    subject:
      "Subject: A simple pair of balance scales, slightly tilted, rendered as ONE continuous flowing ink line — minimal and gestural. No hands, no faces, no extra objects. A soft saffron watercolor wash sits behind the scales. Lots of empty space around it.",
  },
];

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  // Some response variants use snake_case keys
  inline_data?: { mime_type?: string; data?: string };
};
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message?: string; status?: string };
};

async function callGemini(
  model: string,
  apiKey: string,
  prompt: string,
): Promise<Buffer | { error: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    return { error: `HTTP ${res.status}: ${text.slice(0, 400)}` };
  }

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
    if (data) {
      return Buffer.from(data, "base64");
    }
  }

  return { error: `No image part in response: ${text.slice(0, 400)}` };
}

async function generate(job: Job, apiKey: string): Promise<"saved" | "skipped" | string> {
  const outPath = join(OUT_DIR, `${job.slug}.png`);
  if (existsSync(outPath)) {
    return "skipped";
  }

  const prompt = `${STYLE_PREAMBLE}\n\n${job.subject}`;

  const errors: string[] = [];
  for (const model of MODEL_CANDIDATES) {
    const result = await callGemini(model, apiKey, prompt);
    if (Buffer.isBuffer(result)) {
      writeFileSync(outPath, result);
      console.log(`  saved ${outPath} (${result.length} bytes) via ${model}`);
      return "saved";
    }
    errors.push(`[${model}] ${result.error}`);
    // If the error is auth-related, no point trying other models
    if (/API key|UNAUTHENTICATED|PERMISSION_DENIED|401|403/i.test(result.error)) {
      break;
    }
  }
  return `failed: ${errors.join(" | ")}`;
}

async function main() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
  if (!apiKey) {
    console.error(
      "ERROR: GOOGLE_GENERATIVE_AI_KEY not set. Run with: node --env-file=.env.local ...",
    );
    process.exit(1);
  }

  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  console.log(`Generating ${JOBS.length} illustrations into ${OUT_DIR}\n`);

  const results: Record<string, string> = {};
  for (const job of JOBS) {
    console.log(`[${job.slug}]`);
    try {
      results[job.slug] = await generate(job, apiKey);
    } catch (err) {
      results[job.slug] = `threw: ${(err as Error).message}`;
    }
    console.log(`  -> ${results[job.slug]}\n`);
  }

  console.log("\n=== Summary ===");
  for (const [slug, status] of Object.entries(results)) {
    console.log(`  ${slug}: ${status}`);
  }

  const failed = Object.entries(results).filter(
    ([, v]) => v !== "saved" && v !== "skipped",
  );
  if (failed.length > 0) {
    process.exit(2);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
