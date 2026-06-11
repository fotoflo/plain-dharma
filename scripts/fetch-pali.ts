/**
 * Fetch the source texts for the six suttas from SuttaCentral's bilara-data
 * into `packages/content/`:
 *
 *   pali/{slug}.json    — root Pāli (Mahāsaṅgīti Tipiṭaka, CC0)
 *   sujato/{slug}.json  — Bhikkhu Sujato's English translation (CC-BY 4.0)
 *
 * Both are segmented by the SAME segment ids (e.g. "sn56.11:1.1"), so the
 * parallel "/[slug]/source" pages can resolve Pāli + canonical translation +
 * our plain retelling for one aligned span at once (see packages/content/source.ts).
 *
 * These JSON files are generated artifacts — don't hand-edit; re-run to refresh:
 *
 *   node --import tsx scripts/fetch-pali.ts
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "packages/content");
const BASE = "https://raw.githubusercontent.com/suttacentral/bilara-data/published";

// slug → { dir, uid } locating the sutta within bilara-data's folder tree.
// Root Pāli and the Sujato translation share the same dir + uid; only the
// top-level path and filename suffix differ.
const SOURCES: Record<string, { dir: string; uid: string }> = {
  "first-talk": { dir: "sn/sn56", uid: "sn56.11" },
  "not-self": { dir: "sn/sn22", uid: "sn22.59" },
  "fire-sermon": { dir: "sn/sn35", uid: "sn35.28" },
  "loving-kindness": { dir: "kn/snp/vagga1", uid: "snp1.8" },
  mindfulness: { dir: "mn", uid: "mn10" },
  "how-to-decide": { dir: "an/an3", uid: "an3.65" },
};

const LAYERS = [
  {
    name: "pali",
    path: (s: { dir: string; uid: string }) =>
      `root/pli/ms/sutta/${s.dir}/${s.uid}_root-pli-ms.json`,
  },
  {
    name: "sujato",
    path: (s: { dir: string; uid: string }) =>
      `translation/en/sujato/sutta/${s.dir}/${s.uid}_translation-en-sujato.json`,
  },
];

async function main() {
  for (const layer of LAYERS) {
    const outDir = join(CONTENT, layer.name);
    await mkdir(outDir, { recursive: true });
    for (const [slug, src] of Object.entries(SOURCES)) {
      const url = `${BASE}/${layer.path(src)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${layer.name}/${slug}: HTTP ${res.status} for ${url}`);
      const data = await res.json();
      await writeFile(join(outDir, `${slug}.json`), JSON.stringify(data, null, 2) + "\n");
      console.log(`✓ ${layer.name}/${slug} (${Object.keys(data).length} segments)`);
    }
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
