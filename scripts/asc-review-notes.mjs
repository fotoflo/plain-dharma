// One-off: set App Review notes on version 1.0 (the rejection-response summary).
//   node --env-file=.env.local scripts/asc-review-notes.mjs
import fs from "node:fs";
import crypto from "node:crypto";

const VERSION_ID = "fc2b80ab-141c-48af-9677-cbadd13febcc";
const API = "https://api.appstoreconnect.apple.com";

const NOTES = `Response to the previous rejection (submission ae0c822d):

3.1.1 (Payments): The donation flow has been removed entirely from the iOS app in this build (#21). There is no way to pay, tip, or donate anywhere in the app - all content and features are completely free, with nothing gated.

2.1 (China): China mainland has been removed from the app's territory availability.

4.2 (Minimum functionality): We respectfully ask for a second look at the app's interactive features. The underlying texts are 2,500-year-old Buddhist suttas, but the app is a listening and study tool, not an ebook:
- Narrated audio with background playback: open any sutta and tap the listen control - full narration with lock-screen controls, per-section queue, and normal or slower meditative pacing.
- Offline listening: each sutta's audio can be downloaded for offline use.
- Highlights and margin notes: select any passage to highlight or attach a note; notes sync across devices after sign-in.
- Adjustable reader: text size, contrast, and font controls in the reading screen, plus light/dark/system themes.
- Study aids: cross-referenced Pali glossary (More > Glossary) and fully bilingual content (English / Simplified Chinese, More > Language).

The selection-based annotation system and audio engine are native interactive functionality a book file cannot provide. Happy to provide a demo video if helpful.`;

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
async function asc(method, path, body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${JWT}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  const j = t ? JSON.parse(t) : {};
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${JSON.stringify(j.errors ?? t)}`);
  return j;
}

// Review detail exists once any submission has happened; fetch then patch (or create).
const detail = await asc("GET", `/v1/appStoreVersions/${VERSION_ID}/appStoreReviewDetail`).catch(() => null);
if (detail?.data?.id) {
  await asc("PATCH", `/v1/appStoreReviewDetails/${detail.data.id}`, {
    data: { type: "appStoreReviewDetails", id: detail.data.id, attributes: { notes: NOTES } },
  });
  console.log("review notes updated ✓");
} else {
  await asc("POST", `/v1/appStoreReviewDetails`, {
    data: {
      type: "appStoreReviewDetails",
      attributes: { notes: NOTES },
      relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: VERSION_ID } } },
    },
  });
  console.log("review notes created ✓");
}
