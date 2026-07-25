// Cut an App Store release for the version in apps/mobile/app.json:
//   1. find (or create) the App Store version, e.g. 1.0.1
//   2. set the en-US "What's New" text
//   3. attach the latest VALID build
//   4. optionally submit it for App Review (--submit)
//
// Usage (from repo root):
//   node --env-file=.env.local scripts/asc-release.mjs --whatsnew "…" [--submit] [--dry]
//
// Without --submit this leaves a ready-to-submit draft, mirroring
// asc-finalize-draft.mjs — submitting stays an explicit choice. TestFlight
// distribution is a separate step: scripts/asc-distribute.mjs.
//
// Idempotent: re-running updates the same version in place.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const APP_ID = "6774981366";
const API = "https://api.appstoreconnect.apple.com";
const LOCALE = "en-US";
const DRY = process.argv.includes("--dry");
const SUBMIT = process.argv.includes("--submit");

const whatsNewIdx = process.argv.indexOf("--whatsnew");
const WHATS_NEW = whatsNewIdx > -1 ? process.argv[whatsNewIdx + 1] : null;

const appJson = JSON.parse(
  fs.readFileSync(
    path.resolve(import.meta.dirname, "../apps/mobile/app.json"),
    "utf8"
  )
);
const VERSION_STRING = appJson.expo.version;

function token() {
  const keyId = process.env.EXPO_ASC_KEY_ID;
  const iss = process.env.EXPO_ASC_ISSUER_ID;
  const key = process.env.EXPO_ASC_API_KEY_P8
    ? process.env.EXPO_ASC_API_KEY_P8.replace(/\\n/g, "\n")
    : fs.readFileSync(process.env.EXPO_ASC_API_KEY_PATH, "utf8");
  const b64u = (b) =>
    Buffer.from(b)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
  const pay = b64u(
    JSON.stringify({ iss, iat: now - 30, exp: now + 600, aud: "appstoreconnect-v1" })
  );
  const si = `${head}.${pay}`;
  const sig = crypto
    .sign("sha256", Buffer.from(si), { key, dsaEncoding: "ieee-p1363" })
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${si}.${sig}`;
}
const JWT = token();

async function asc(method, p, body) {
  // A dry run never creates anything, so follow-up reads about the would-be
  // resource have nothing to fetch — report empty instead of 404ing.
  if (DRY && p.includes("dry-run")) return { data: [] };
  if (DRY && method !== "GET") {
    console.log(`  [dry] ${method} ${p} ${body ? JSON.stringify(body) : ""}`);
    return { data: { id: "dry-run" } };
  }
  const r = await fetch(`${API}${p}`, {
    method,
    headers: { Authorization: `Bearer ${JWT}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  const j = t ? JSON.parse(t) : {};
  if (!r.ok)
    throw new Error(`${method} ${p} → ${r.status} ${JSON.stringify(j.errors ?? t)}`);
  return j;
}

// ---- 1. find or create the version ----
const vers = await asc(
  "GET",
  `/v1/apps/${APP_ID}/appStoreVersions?limit=20&fields[appStoreVersions]=versionString,appStoreState,copyright`
);
const live = vers.data.find((v) => v.attributes.appStoreState === "READY_FOR_SALE");
let version = vers.data.find((v) => v.attributes.versionString === VERSION_STRING);

if (version) {
  console.log(
    `version ${VERSION_STRING} exists (${version.attributes.appStoreState}) id=${version.id}`
  );
} else {
  console.log(`creating version ${VERSION_STRING}…`);
  const created = await asc("POST", "/v1/appStoreVersions", {
    data: {
      type: "appStoreVersions",
      attributes: {
        platform: "IOS",
        versionString: VERSION_STRING,
        releaseType: "AFTER_APPROVAL",
        // Carry the live version's copyright forward so the new one isn't blank.
        copyright: live?.attributes.copyright ?? undefined,
      },
      relationships: { app: { data: { type: "apps", id: APP_ID } } },
    },
  });
  version = { id: created.data.id, attributes: { versionString: VERSION_STRING } };
  console.log(`  created id=${version.id}`);
}

// ---- 2. What's New ----
if (WHATS_NEW) {
  const locs = await asc(
    "GET",
    `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=20&fields[appStoreVersionLocalizations]=locale,whatsNew`
  );
  const loc = locs.data?.find((l) => l.attributes.locale === LOCALE);
  if (loc) {
    console.log(`setting whatsNew on ${LOCALE}…`);
    await asc("PATCH", `/v1/appStoreVersionLocalizations/${loc.id}`, {
      data: {
        type: "appStoreVersionLocalizations",
        id: loc.id,
        attributes: { whatsNew: WHATS_NEW },
      },
    });
  } else {
    console.log(`creating ${LOCALE} localization with whatsNew…`);
    await asc("POST", "/v1/appStoreVersionLocalizations", {
      data: {
        type: "appStoreVersionLocalizations",
        attributes: { locale: LOCALE, whatsNew: WHATS_NEW },
        relationships: {
          appStoreVersion: { data: { type: "appStoreVersions", id: version.id } },
        },
      },
    });
  }
} else {
  console.log("no --whatsnew given; leaving release notes untouched");
}

// ---- 3. attach the latest VALID build ----
const builds = await asc(
  "GET",
  `/v1/builds?filter[app]=${APP_ID}&limit=10&sort=-version&fields[builds]=version,processingState,expired`
);
const valid = builds.data.find(
  (b) => b.attributes.processingState === "VALID" && !b.attributes.expired
);
if (!valid) {
  console.log("no VALID build yet — attach it once Apple finishes processing");
} else {
  const cur = await asc("GET", `/v1/appStoreVersions/${version.id}/build`).catch(
    () => ({ data: null })
  );
  if (cur.data?.id === valid.id) {
    console.log(`build #${valid.attributes.version} already attached`);
  } else {
    console.log(`attaching build #${valid.attributes.version}…`);
    await asc("PATCH", `/v1/appStoreVersions/${version.id}/relationships/build`, {
      data: { type: "builds", id: valid.id },
    });
  }
}

// ---- 4. submit for review (opt-in) ----
if (!SUBMIT) {
  console.log(
    `\ndraft ready: https://appstoreconnect.apple.com/apps/${APP_ID}/appstore/ios/version/${version.id}`
  );
  console.log("re-run with --submit to send it to App Review");
  process.exit(0);
}

const subs = await asc(
  "GET",
  `/v1/reviewSubmissions?filter[app]=${APP_ID}&filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW,IN_REVIEW&limit=10`
).catch(() => ({ data: [] }));
let submission = subs.data?.find((s) => s.attributes.state === "READY_FOR_REVIEW");
if (submission) {
  console.log(`reusing open review submission id=${submission.id}`);
} else if (subs.data?.length) {
  console.log(
    `a submission is already ${subs.data[0].attributes.state} — nothing to do`
  );
  process.exit(0);
} else {
  console.log("creating review submission…");
  const created = await asc("POST", "/v1/reviewSubmissions", {
    data: {
      type: "reviewSubmissions",
      attributes: { platform: "IOS" },
      relationships: { app: { data: { type: "apps", id: APP_ID } } },
    },
  });
  submission = { id: created.data.id };
}

console.log("adding the version to the submission…");
await asc("POST", "/v1/reviewSubmissionItems", {
  data: {
    type: "reviewSubmissionItems",
    relationships: {
      reviewSubmission: { data: { type: "reviewSubmissions", id: submission.id } },
      appStoreVersion: { data: { type: "appStoreVersions", id: version.id } },
    },
  },
}).catch((e) => {
  // Already attached is fine; anything else is a real failure.
  if (!/already/i.test(String(e))) throw e;
  console.log("  (already attached)");
});

console.log("submitting for App Review…");
await asc("PATCH", `/v1/reviewSubmissions/${submission.id}`, {
  data: {
    type: "reviewSubmissions",
    id: submission.id,
    attributes: { submitted: true },
  },
});
console.log(`\nsubmitted ${VERSION_STRING} for App Review.`);
console.log(
  `https://appstoreconnect.apple.com/apps/${APP_ID}/appstore/ios/version/${version.id}`
);
