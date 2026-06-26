/**
 * Fetch segment-aligned canonical text (Pāli root + Bhikkhu Sujato's English)
 * from SuttaCentral's bilara API and write it to packages/content/canonical/.
 *
 * Both sources are CC0:
 *   - Pāli root: Mahāsaṅgīti Tipiṭaka Buddhavasse 2500
 *   - English:   Bhikkhu Sujato
 *
 * Output is committed so the site stays static-export compatible (no runtime
 * fetch). Re-run manually if the upstream text changes:
 *   node --import tsx scripts/fetch-canonical.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// slug → SuttaCentral uid (from packages/content/canonical-links.ts)
const SUTTA_UIDS: Record<string, string> = {
  "first-talk": "sn56.11",
  "not-self": "sn22.59",
  "fire-sermon": "sn35.28",
  "loving-kindness": "snp1.8",
  mindfulness: "mn10",
  "how-to-decide": "an3.65",
};

const AUTHOR = "sujato";
const OUT_DIR = join(process.cwd(), "packages/content/canonical");

type BilaraResponse = {
  root_text: Record<string, string>;
  translation_text: Record<string, string>;
  keys_order: string[];
};

type CanonicalDoc = {
  uid: string;
  paliAuthor: string;
  translationAuthor: string;
  translationAuthorUid: string;
  source: string;
  /** Segment IDs in document order. */
  order: string[];
  /** segment id → Pāli root text */
  pali: Record<string, string>;
  /** segment id → Sujato English */
  translation: Record<string, string>;
};

async function fetchSutta(slug: string, uid: string): Promise<void> {
  const url = `https://suttacentral.net/api/bilarasuttas/${uid}/${AUTHOR}?lang=en`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${uid}: HTTP ${res.status}`);
  const data = (await res.json()) as BilaraResponse;

  const order = data.keys_order ?? Object.keys(data.root_text);
  const doc: CanonicalDoc = {
    uid,
    paliAuthor: "Mahāsaṅgīti Tipiṭaka Buddhavasse 2500",
    translationAuthor: "Bhikkhu Sujato",
    translationAuthorUid: AUTHOR,
    source: `https://suttacentral.net/${uid}/en/${AUTHOR}`,
    order,
    pali: data.root_text,
    translation: data.translation_text,
  };

  const file = join(OUT_DIR, `${slug}.json`);
  writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
  const segs = order.length;
  console.log(`✓ ${slug.padEnd(16)} ${uid.padEnd(9)} ${segs} segments → ${file}`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [slug, uid] of Object.entries(SUTTA_UIDS)) {
    await fetchSutta(slug, uid);
  }
  console.log("\nDone. Wrote canonical text for", Object.keys(SUTTA_UIDS).length, "suttas.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
