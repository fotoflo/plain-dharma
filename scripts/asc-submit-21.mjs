// One-off: attach build 21 to version 1.0 and resubmit for App Review.
//   node --env-file=.env.local scripts/asc-submit-21.mjs [--dry-run]
import fs from "node:fs";
import crypto from "node:crypto";

const APP_ID = "6774981366";
const VERSION_ID = "fc2b80ab-141c-48af-9677-cbadd13febcc";
const API = "https://api.appstoreconnect.apple.com";
const DRY = process.argv.includes("--dry-run");

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

// 1) Find build 21 and report its processing state.
const builds = await asc(
  "GET",
  `/v1/builds?filter[app]=${APP_ID}&filter[version]=21&limit=1`
);
const b21 = builds.data?.[0];
if (!b21) throw new Error("Build 21 not visible in ASC yet — Apple still ingesting. Retry in a few minutes.");
console.log(`build 21: id=${b21.id} processingState=${b21.attributes.processingState} expired=${b21.attributes.expired}`);

// 2) Existing review submissions and their states.
const subs = await asc("GET", `/v1/reviewSubmissions?filter[app]=${APP_ID}&limit=10`);
for (const s of subs.data ?? []) {
  console.log(`reviewSubmission ${s.id}: state=${s.attributes.state} platform=${s.attributes.platform}`);
}

if (b21.attributes.processingState !== "VALID") {
  console.log("Build 21 not VALID yet — stopping before any writes.");
  process.exit(0);
}
if (DRY) {
  console.log("--dry-run: stopping before writes.");
  process.exit(0);
}

// 3) Attach build 21 to version 1.0.
await asc("PATCH", `/v1/appStoreVersions/${VERSION_ID}/relationships/build`, {
  data: { type: "builds", id: b21.id },
});
console.log("attached build 21 to version 1.0 ✓");

// 4) Resubmit: reuse an open (unresolved/rejected) submission if present, else create one.
let sub = (subs.data ?? []).find((s) =>
  ["UNRESOLVED_ISSUES", "READY_FOR_REVIEW"].includes(s.attributes.state)
);
if (!sub) {
  const created = await asc("POST", `/v1/reviewSubmissions`, {
    data: {
      type: "reviewSubmissions",
      attributes: { platform: "IOS" },
      relationships: { app: { data: { type: "apps", id: APP_ID } } },
    },
  });
  sub = created.data;
  console.log(`created reviewSubmission ${sub.id}`);
  await asc("POST", `/v1/reviewSubmissionItems`, {
    data: {
      type: "reviewSubmissionItems",
      relationships: {
        reviewSubmission: { data: { type: "reviewSubmissions", id: sub.id } },
        appStoreVersion: { data: { type: "appStoreVersions", id: VERSION_ID } },
      },
    },
  });
  console.log("added version 1.0 to the submission ✓");
} else {
  console.log(`reusing open reviewSubmission ${sub.id} (state=${sub.attributes.state})`);
}

await asc("PATCH", `/v1/reviewSubmissions/${sub.id}`, {
  data: { type: "reviewSubmissions", id: sub.id, attributes: { submitted: true } },
});
console.log("submitted for App Review ✓");
