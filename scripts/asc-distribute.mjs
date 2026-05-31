// TestFlight distribution via the App Store Connect API.
//
// Usage (from repo root):
//   node --env-file=.env.local scripts/asc-distribute.mjs [build#|latest] [options]
//
// Options:
//   --whatsnew "text"     "What to Test" notes for this build (en-US)
//   --no-internal         skip creating/using the internal group
//   --no-external         skip the external "friends and fam" group + Beta Review
//   --expire-old          expire all other (non-selected) VALID builds
//
// Env (already in .env.local): EXPO_ASC_KEY_ID, EXPO_ASC_ISSUER_ID, EXPO_ASC_API_KEY_PATH
//
// What it does: waits for the target build to finish Apple processing (VALID),
// sets the "What to Test" notes, adds it to the internal group (instant, no
// review) and the external group, and submits the build for Beta App Review
// (required for external testers). Idempotent: safe to re-run.

import fs from "node:fs";
import crypto from "node:crypto";

const APP_ID = "6774981366";
const EXTERNAL_GROUP_NAME = "friends and fam";
const INTERNAL_GROUP_NAME = "Internal Testers";
const API = "https://api.appstoreconnect.apple.com";

const args = process.argv.slice(2);
const buildArg = args.find((a) => !a.startsWith("--")) ?? "latest";
const opt = (name) => args.includes(`--${name}`);
const valArg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const whatsNew = valArg("whatsnew") ?? "Latest build — bug fixes and improvements.";

function token() {
  const keyId = process.env.EXPO_ASC_KEY_ID;
  const iss = process.env.EXPO_ASC_ISSUER_ID;
  const key = fs.readFileSync(process.env.EXPO_ASC_API_KEY_PATH, "utf8");
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

let JWT = token();
async function asc(method, path, body) {
  const r = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${JWT}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  const json = text ? JSON.parse(text) : {};
  if (!r.ok) {
    const err = json.errors?.[0];
    throw new Error(`${method} ${path} → ${r.status} ${err ? `${err.title}: ${err.detail}` : text}`);
  }
  return json;
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function findBuild() {
  const filter =
    buildArg === "latest"
      ? `filter[app]=${APP_ID}&sort=-version&limit=1`
      : `filter[app]=${APP_ID}&filter[version]=${buildArg}&limit=1`;
  const j = await asc("GET", `/v1/builds?${filter}`);
  if (!j.data?.length) throw new Error(`No build found for ${buildArg}`);
  return j.data[0];
}

async function waitValid(build) {
  let b = build;
  for (let i = 0; i < 40; i++) {
    if (b.attributes.processingState === "VALID") return b;
    if (b.attributes.processingState === "FAILED" || b.attributes.processingState === "INVALID")
      throw new Error(`Build #${b.attributes.version} processing ${b.attributes.processingState}`);
    console.log(`  build #${b.attributes.version} is ${b.attributes.processingState} — waiting…`);
    await sleep(30000);
    JWT = token();
    b = (await asc("GET", `/v1/builds/${b.id}`)).data;
  }
  throw new Error("Timed out waiting for build to become VALID");
}

async function findOrCreateGroup(name, isInternal) {
  const j = await asc("GET", `/v1/betaGroups?filter[app]=${APP_ID}&limit=100`);
  const found = j.data?.find((g) => g.attributes.name === name);
  if (found) return found;
  console.log(`  creating ${isInternal ? "internal" : "external"} group "${name}"…`);
  const created = await asc("POST", "/v1/betaGroups", {
    data: {
      type: "betaGroups",
      attributes: { name, ...(isInternal ? { isInternalGroup: true } : { isInternalGroup: false }) },
      relationships: { app: { data: { type: "apps", id: APP_ID } } },
    },
  });
  return created.data;
}

async function setWhatsNew(buildId) {
  const locs = await asc("GET", `/v1/builds/${buildId}/betaBuildLocalizations`);
  const enUS = locs.data?.find((l) => l.attributes.locale === "en-US");
  if (enUS) {
    await asc("PATCH", `/v1/betaBuildLocalizations/${enUS.id}`, {
      data: { type: "betaBuildLocalizations", id: enUS.id, attributes: { whatsNew } },
    });
  } else {
    await asc("POST", "/v1/betaBuildLocalizations", {
      data: {
        type: "betaBuildLocalizations",
        attributes: { locale: "en-US", whatsNew },
        relationships: { build: { data: { type: "builds", id: buildId } } },
      },
    });
  }
}

async function addToGroup(buildId, groupId) {
  try {
    await asc("POST", `/v1/betaGroups/${groupId}/relationships/builds`, {
      data: [{ type: "builds", id: buildId }],
    });
  } catch (e) {
    if (!/already/i.test(e.message)) throw e; // tolerate already-linked
  }
}

async function submitForReview(buildId) {
  try {
    await asc("POST", "/v1/betaAppReviewSubmissions", {
      data: { type: "betaAppReviewSubmissions", relationships: { build: { data: { type: "builds", id: buildId } } } },
    });
    console.log("  submitted for Beta App Review");
  } catch (e) {
    if (/already|state/i.test(e.message)) console.log(`  beta review: ${e.message} (skipping)`);
    else throw e;
  }
}

async function expireOthers(keepId) {
  const j = await asc("GET", `/v1/builds?filter[app]=${APP_ID}&limit=50`);
  for (const b of j.data ?? []) {
    if (b.id !== keepId && !b.attributes.expired && b.attributes.processingState === "VALID") {
      await asc("PATCH", `/v1/builds/${b.id}`, {
        data: { type: "builds", id: b.id, attributes: { expired: true } },
      });
      console.log(`  expired build #${b.attributes.version}`);
    }
  }
}

(async () => {
  console.log(`Resolving build (${buildArg})…`);
  const build = await waitValid(await findBuild());
  const n = build.attributes.version;
  console.log(`Build #${n} is VALID. Distributing…`);

  await setWhatsNew(build.id);
  console.log(`  set "What to Test"`);

  if (!opt("no-internal")) {
    const g = await findOrCreateGroup(INTERNAL_GROUP_NAME, true);
    await addToGroup(build.id, g.id);
    console.log(`  added to INTERNAL "${g.attributes.name}" (instant, no review)`);
  }
  if (!opt("no-external")) {
    const g = await findOrCreateGroup(EXTERNAL_GROUP_NAME, false);
    await addToGroup(build.id, g.id);
    console.log(`  added to EXTERNAL "${g.attributes.name}"`);
    await submitForReview(build.id);
  }
  if (opt("expire-old")) await expireOthers(build.id);

  console.log(`\nDone. Build #${n} distributed.`);
  console.log("Internal testers (ASC users added to the internal group) get it now;");
  console.log("external 'friends and fam' testers get it once Beta App Review approves.");
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
