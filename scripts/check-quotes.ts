// Checks every /quotes entry appears word for word in its sutta's English MDX.
// Run: node --import tsx scripts/check-quotes.ts
import { readFileSync } from "node:fs";
import { QUOTES } from "../src/content/quotes";

const norm = (s: string) =>
  s
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/[*_>#"“”]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

let bad = 0;
for (const q of QUOTES) {
  const mdx = norm(readFileSync(`packages/content/en/${q.sutta}.mdx`, "utf8"));
  if (!mdx.includes(norm(q.text))) {
    bad++;
    console.log(`✗ ${q.id} (${q.sutta}): not found verbatim`);
  }
}
const ids = new Set(QUOTES.map((q) => q.id));
if (ids.size !== QUOTES.length) { bad++; console.log("✗ duplicate ids"); }
console.log(bad ? `${bad} problem(s)` : `✓ all ${QUOTES.length} quotes found verbatim`);
process.exit(bad ? 1 : 0);
