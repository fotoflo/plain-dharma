#!/usr/bin/env node
/**
 * Push docs/marketing-channels.csv into the launch-plan Google Sheet's channels tab.
 *
 *   node scripts/push-channels-to-sheet.mjs           # dry run: print the plan, change nothing
 *   node scripts/push-channels-to-sheet.mjs --push    # actually write
 *
 * Requires an authorized `gog` (Homebrew). If the token has expired:
 *   gog login fotoflo@gmail.com
 *
 * The CSV is the source of truth. This script only touches the block of press/podcast
 * rows it knows about — it verifies the sheet still matches before writing, and refuses
 * to write if the sheet has drifted.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SPREADSHEET_ID = '1-0GNaSZqwxYIn0a0N32VRNVAwlY9Hv2PlBC2adP-esw';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = join(ROOT, 'docs/marketing-channels.csv');

// First data row of the block we manage, and the channel names we expect to find
// in column A *before* the two new rows are inserted.
const BLOCK_START_ROW = 22;
const EXPECT_BEFORE = [
  "Tricycle", "Lion's Roar", "Buddhadharma",
  "10% Happier (Dan Harris)", "Waking Up / Making Sense (Sam Harris)",
  "Secular Buddhism (Noah Rasheta)", "Deconstructing Yourself (Michael Taft)",
  "Guru Viking", "Buddhist Geeks",
];
const INSERT_AT_ROW = 25;   // Buddhistdoor + Negru go after Buddhadharma (row 24)
const INSERT_COUNT = 2;

const push = process.argv.includes('--push');
const gog = (...args) =>
  execFileSync('gog', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

function parseCsv(text) {
  const rows = []; let field = '', row = [], quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || r[0] !== '');
}

/** Walk the metadata JSON for {title, sheetId} pairs, whatever gog wraps them in. */
function findTabs(node, out = []) {
  if (Array.isArray(node)) node.forEach(n => findTabs(n, out));
  else if (node && typeof node === 'object') {
    if (typeof node.title === 'string' && node.sheetId !== undefined)
      out.push({ title: node.title, sheetId: node.sheetId });
    Object.values(node).forEach(v => findTabs(v, out));
  }
  return out;
}

const rows = parseCsv(readFileSync(CSV, 'utf8'));
const header = rows[0];
const block = rows.slice(BLOCK_START_ROW - 1, BLOCK_START_ROW - 1 + EXPECT_BEFORE.length + INSERT_COUNT);
if (block.length !== EXPECT_BEFORE.length + INSERT_COUNT)
  throw new Error(`CSV block is ${block.length} rows, expected ${EXPECT_BEFORE.length + INSERT_COUNT}`);

console.log(`CSV: ${rows.length - 1} data rows, ${header.length} columns`);
console.log(`Block to push: CSV lines ${BLOCK_START_ROW}–${BLOCK_START_ROW + block.length - 1}`);
block.forEach((r, i) => console.log(`  ${BLOCK_START_ROW + i}  ${r[0]}`));

// --- resolve the channels tab -------------------------------------------------
const meta = JSON.parse(gog('sheets', 'metadata', SPREADSHEET_ID, '-j'));
const tabs = findTabs(meta);
if (!tabs.length) throw new Error('No tabs found in metadata — check the gog JSON shape');
console.log(`\nTabs: ${tabs.map(t => `${t.title} (gid ${t.sheetId})`).join(', ')}`);

let tab = null;
for (const t of tabs) {
  const q = t.title.includes(' ') ? `'${t.title}'` : t.title;
  let head = '';
  try { head = gog('sheets', 'get', SPREADSHEET_ID, `${q}!A1:L1`, '-p'); } catch { continue; }
  if (head.includes('Link / contact')) { tab = t; break; }
}
if (!tab) throw new Error('Could not find a tab whose row 1 contains "Link / contact"');
const Q = tab.title.includes(' ') ? `'${tab.title}'` : tab.title;
console.log(`Channels tab: ${tab.title} (gid ${tab.sheetId})`);

// --- guard: has the sheet drifted? -------------------------------------------
const endRow = BLOCK_START_ROW + EXPECT_BEFORE.length - 1;
const colA = gog('sheets', 'get', SPREADSHEET_ID, `${Q}!A${BLOCK_START_ROW}:A${endRow}`, '-p')
  .split('\n').map(s => s.trim()).filter(Boolean);
const mismatch = EXPECT_BEFORE.filter((want, i) => colA[i] !== want);
if (mismatch.length) {
  console.error('\nSHEET HAS DRIFTED — refusing to write.');
  EXPECT_BEFORE.forEach((want, i) => {
    if (colA[i] !== want) console.error(`  row ${BLOCK_START_ROW + i}: sheet has "${colA[i]}", expected "${want}"`);
  });
  process.exit(1);
}
console.log(`Guard passed: rows ${BLOCK_START_ROW}–${endRow} match the expected channels.`);

if (!push) {
  console.log(`\nDry run. Would:`);
  console.log(`  1. insert ${INSERT_COUNT} rows before row ${INSERT_AT_ROW}`);
  console.log(`  2. write ${block.length}x${header.length} into ${Q}!A${BLOCK_START_ROW}:L${BLOCK_START_ROW + block.length - 1}`);
  console.log(`\nRe-run with --push to apply.`);
  process.exit(0);
}

gog('sheets', 'insert', SPREADSHEET_ID, tab.title, 'ROWS', String(INSERT_AT_ROW),
    '--count', String(INSERT_COUNT), '-y');
console.log(`Inserted ${INSERT_COUNT} rows at ${INSERT_AT_ROW}.`);

// gog's row index could be 0- or 1-based; confirm the gap landed where we think
// before writing over anything.
const after = gog('sheets', 'get', SPREADSHEET_ID,
  `${Q}!A${INSERT_AT_ROW}:A${INSERT_AT_ROW + INSERT_COUNT}`, '-p').split('\n');
const blanks = after.slice(0, INSERT_COUNT).every(s => s.trim() === '');
const next = (after[INSERT_COUNT] || '').trim();
if (!blanks || next !== EXPECT_BEFORE[3]) {
  console.error(`\nInsert landed wrong — rows ${INSERT_AT_ROW}–${INSERT_AT_ROW + INSERT_COUNT - 1} ` +
    `should be blank and row ${INSERT_AT_ROW + INSERT_COUNT} should be "${EXPECT_BEFORE[3]}", got "${next}".`);
  console.error('NOTHING WAS WRITTEN. Undo the inserted rows in the sheet, then fix INSERT_AT_ROW.');
  process.exit(1);
}
console.log(`Verified: rows ${INSERT_AT_ROW}–${INSERT_AT_ROW + INSERT_COUNT - 1} are blank.`);

const range = `${Q}!A${BLOCK_START_ROW}:L${BLOCK_START_ROW + block.length - 1}`;
gog('sheets', 'update', SPREADSHEET_ID, range,
    '--values-json', JSON.stringify(block), '--input', 'RAW', '-y');
console.log(`Wrote ${range}.`);
