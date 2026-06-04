// Finalize the editable App Store version into a "ready to submit" draft:
//   1. attach the latest VALID build to the version
//   2. upload the framed 6.7" screenshots to the en-US localization (in order)
//
// Does NOT submit for review — that stays a human click in App Store Connect.
//
//   node --env-file=.env.local scripts/asc-finalize-draft.mjs [--dry]
//
// Idempotent: re-running attaches the same build and skips screenshot upload if
// the set already has the same number of images.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const APP_ID = "6774981366";
const API = "https://api.appstoreconnect.apple.com";
const LOCALE = "en-US";
const DISPLAY_TYPE = "APP_IPHONE_67"; // 1290x2796
const SHOTS_DIR = path.resolve(import.meta.dirname, "../packages/store-assets/framed");
const DRY = process.argv.includes("--dry");

let JWT = mintToken();
function mintToken() {
  const keyId = process.env.EXPO_ASC_KEY_ID;
  const iss = process.env.EXPO_ASC_ISSUER_ID;
  const key = process.env.EXPO_ASC_API_KEY_P8
    ? process.env.EXPO_ASC_API_KEY_P8.replace(/\\n/g, "\n")
    : fs.readFileSync(process.env.EXPO_ASC_API_KEY_PATH, "utf8");
  const b64u = (b) =>
    Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
  const pay = b64u(JSON.stringify({ iss, iat: now - 30, exp: now + 600, aud: "appstoreconnect-v1" }));
  const si = `${head}.${pay}`;
  const sig = crypto
    .sign("sha256", Buffer.from(si), { key, dsaEncoding: "ieee-p1363" })
    .toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${si}.${sig}`;
}

async function asc(method, p, body) {
  const r = await fetch(p.startsWith("http") ? p : `${API}${p}`, {
    method,
    headers: { Authorization: `Bearer ${JWT}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  const j = t ? JSON.parse(t) : {};
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status} ${JSON.stringify(j.errors?.[0] ?? t)}`);
  return j;
}

// ---- locate the editable version ----
const vers = await asc(
  "GET",
  `/v1/apps/${APP_ID}/appStoreVersions?limit=10&fields[appStoreVersions]=versionString,appStoreState`,
);
const version = vers.data.find((v) => v.attributes.appStoreState === "PREPARE_FOR_SUBMISSION");
if (!version) throw new Error("No version in PREPARE_FOR_SUBMISSION");
console.log(`Version ${version.attributes.versionString} (${version.id})`);

// ---- 1. attach latest VALID build ----
const builds = await asc(
  "GET",
  `/v1/builds?filter[app]=${APP_ID}&sort=-uploadedDate&limit=10&fields[builds]=version,processingState,expired`,
);
const valid = builds.data.find((b) => b.attributes.processingState === "VALID" && !b.attributes.expired);
if (!valid) throw new Error("No non-expired VALID build available");
console.log(`Latest VALID build: #${valid.attributes.version} (${valid.id})`);

const curBuild = await asc("GET", `/v1/appStoreVersions/${version.id}/build`).catch(() => ({ data: null }));
if (curBuild.data?.id === valid.id) {
  console.log("  build already attached ✓");
} else if (DRY) {
  console.log("  [dry] would attach this build");
} else {
  await asc("PATCH", `/v1/appStoreVersions/${version.id}/relationships/build`, {
    data: { type: "builds", id: valid.id },
  });
  console.log("  build attached ✓");
}

// ---- 2. screenshots ----
const locs = await asc("GET", `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=20`);
const loc = locs.data.find((l) => l.attributes.locale === LOCALE);
if (!loc) throw new Error(`No ${LOCALE} localization`);

// find or create the 6.7" set
const sets = await asc("GET", `/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets?limit=20`);
let set = sets.data.find((s) => s.attributes.screenshotDisplayType === DISPLAY_TYPE);
const files = fs
  .readdirSync(SHOTS_DIR)
  .filter((f) => f.startsWith("ios-6.7-en-") && f.endsWith(".png"))
  .sort();
console.log(`\nScreenshots (${DISPLAY_TYPE}): ${files.length} files`);

const existing = set
  ? (await asc("GET", `/v1/appScreenshotSets/${set.id}/appScreenshots?limit=20`)).data
  : [];
if (set && existing.length === files.length) {
  console.log(`  set already has ${existing.length} screenshots — skipping upload ✓`);
} else if (DRY) {
  console.log(`  [dry] would upload ${files.length} screenshots${set ? "" : " (creating set)"}`);
} else {
  if (!set) {
    set = (
      await asc("POST", "/v1/appScreenshotSets", {
        data: {
          type: "appScreenshotSets",
          attributes: { screenshotDisplayType: DISPLAY_TYPE },
          relationships: { appStoreVersionLocalization: { data: { type: "appStoreVersionLocalizations", id: loc.id } } },
        },
      })
    ).data;
    console.log("  created screenshot set");
  } else if (existing.length) {
    for (const s of existing) await asc("DELETE", `/v1/appScreenshots/${s.id}`);
    console.log(`  cleared ${existing.length} stale screenshot(s)`);
  }

  const uploadedIds = [];
  for (const f of files) {
    const bytes = fs.readFileSync(path.join(SHOTS_DIR, f));
    const md5 = crypto.createHash("md5").update(bytes).digest("hex");
    // reserve
    const res = (
      await asc("POST", "/v1/appScreenshots", {
        data: {
          type: "appScreenshots",
          attributes: { fileName: f, fileSize: bytes.length },
          relationships: { appScreenshotSet: { data: { type: "appScreenshotSets", id: set.id } } },
        },
      })
    ).data;
    // upload bytes per operation
    for (const op of res.attributes.uploadOperations) {
      const headers = Object.fromEntries((op.requestHeaders || []).map((h) => [h.name, h.value]));
      const chunk = bytes.subarray(op.offset, op.offset + op.length);
      const r = await fetch(op.url, { method: op.method, headers, body: chunk });
      if (!r.ok) throw new Error(`upload ${f} → ${r.status} ${await r.text()}`);
    }
    // commit
    await asc("PATCH", `/v1/appScreenshots/${res.id}`, {
      data: { type: "appScreenshots", id: res.id, attributes: { uploaded: true, sourceFileChecksum: md5 } },
    });
    uploadedIds.push(res.id);
    console.log(`  ↑ ${f}`);
  }
  // enforce display order to match filename order
  await asc("PATCH", `/v1/appScreenshotSets/${set.id}/relationships/appScreenshots`, {
    data: uploadedIds.map((id) => ({ type: "appScreenshots", id })),
  });
  console.log(`  order set (${uploadedIds.length}) ✓`);
}

console.log("\nDone. Draft is ready — review & click 'Add for Review' / 'Submit for Review' in App Store Connect.");
