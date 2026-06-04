// Read-only App Store Connect status probe for the editable 1.0 version.
//   node --env-file=.env.local scripts/asc-status.mjs
import fs from "node:fs";
import crypto from "node:crypto";

const APP_ID = "6774981366";
const VERSION_ID = "fc2b80ab-141c-48af-9677-cbadd13febcc";
const API = "https://api.appstoreconnect.apple.com";

function token() {
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
const JWT = token();
async function asc(path) {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${JWT}` } });
  const t = await r.text();
  const j = t ? JSON.parse(t) : {};
  if (!r.ok) throw new Error(`${path} → ${r.status} ${JSON.stringify(j.errors?.[0] ?? t)}`);
  return j;
}

// Build attached to this version?
const buildRel = await asc(`/v1/appStoreVersions/${VERSION_ID}/build`).catch((e) => ({ error: String(e) }));
console.log("BUILD attached to 1.0:", buildRel.data
  ? `#${buildRel.data.id} (need version#)`
  : buildRel.error || "NONE");

// Localization content
const locs = await asc(`/v1/appStoreVersions/${VERSION_ID}/appStoreVersionLocalizations?limit=10`);
for (const l of locs.data) {
  const a = l.attributes;
  console.log(`\nLOCALE ${a.locale} (id=${l.id})`);
  console.log("  description:", a.description ? `${a.description.length} chars` : "— EMPTY");
  console.log("  keywords   :", a.keywords || "— EMPTY");
  console.log("  promoText  :", a.promotionalText ? `${a.promotionalText.length} chars` : "— empty");
  console.log("  whatsNew   :", a.whatsNew || "— (n/a for first release)");
  console.log("  marketing  :", a.marketingUrl || "—", "| support:", a.supportUrl || "—");
}

// Version-level required relationships
const v = await asc(
  `/v1/appStoreVersions/${VERSION_ID}?fields[appStoreVersions]=versionString,appStoreState,copyright,releaseType`,
);
console.log("\nVERSION:", v.data.attributes.versionString, "state=", v.data.attributes.appStoreState,
  "copyright=", v.data.attributes.copyright || "—", "releaseType=", v.data.attributes.releaseType);
