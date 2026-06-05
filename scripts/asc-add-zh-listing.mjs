// Add a Simplified Chinese (zh-Hans) App Store listing to the editable version.
//
//   node --env-file=.env.local scripts/asc-add-zh-listing.mjs [--dry]
//
// Apple LOCKS metadata once a version is WAITING_FOR_REVIEW / IN_REVIEW, so this
// only works when a version is editable (PREPARE_FOR_SUBMISSION) — i.e. BEFORE
// you submit, or on a NEW version created after the current one is approved.
// To add Chinese to a LIVE app: create a new version (or use the auto-created
// editable version), then run this.
//
// Idempotent: if a zh-Hans localization already exists it is PATCHed, else created.
import fs from "node:fs";
import crypto from "node:crypto";

const APP_ID = "6774981366";
const API = "https://api.appstoreconnect.apple.com";
const DRY = process.argv.includes("--dry");

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
async function asc(method, p, body) {
  const r = await fetch(`${API}${p}`, {
    method,
    headers: { Authorization: `Bearer ${JWT}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  const j = t ? JSON.parse(t) : {};
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status} ${JSON.stringify(j.errors?.[0] ?? t)}`);
  return j;
}

// ---- the translated Simplified Chinese store copy ----
const ATTRS = {
  locale: "zh-Hans",
  promotionalText:
    "佛陀的六部根本经典，以平实的现代中文呈现。免费、无广告，献予公共领域。可阅读，亦可聆听。",
  keywords: "佛教,佛经,佛陀,佛法,经文,正念,冥想,禅修,禅,打坐,修行,巴利,上座部,智慧,平静,有声书,法",
  description: `《平实佛法》以平实的现代中文，呈现佛陀的六部根本经典——免费，并献予公共领域。

这六部经典是整个传统的根源：鹿野苑的初转法轮、无我的教导、燃烧的譬喻（火喻经）、慈心（慈经）、念住的根本（念处经），以及如何抉择该相信什么（卡拉玛经）。它们为初次接触的读者而译——与其在脚注中艰难跋涉，不如直接读懂：保留经文的结构、重复与关键意象，只褪去古奥艰涩的文字。

• 约一小时即可读完全部六部
• 聆听完整的有声书朗读
• 标注段落、记录私人笔记——并可选择登录，在你的多台设备间同步
• 同时提供英文版
• 无广告、无追踪、无需购买

这里的一切——文字、音频与插画——皆为 CC0／公共领域。你可以自由复制、打印、翻译、再创作、分享。一份小小的礼物，以佛法的精神奉上。`,
  supportUrl: "https://plaindharma.com",
  marketingUrl: "https://plaindharma.com",
};

// ---- find an editable version ----
const vers = await asc(
  "GET",
  `/v1/apps/${APP_ID}/appStoreVersions?limit=10&fields[appStoreVersions]=versionString,appStoreState`,
);
const editable = vers.data.find((v) =>
  ["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED"].includes(
    v.attributes.appStoreState,
  ),
);
if (!editable) {
  const states = vers.data.map((v) => `${v.attributes.versionString}=${v.attributes.appStoreState}`).join(", ");
  throw new Error(
    `No editable version (need PREPARE_FOR_SUBMISSION). Current: ${states}. ` +
      `Create a new version (or wait until the in-review one is approved) first.`,
  );
}
console.log(`Editable version ${editable.attributes.versionString} (${editable.id}) state=${editable.attributes.appStoreState}`);

// ---- create or update the zh-Hans localization ----
const locs = await asc("GET", `/v1/appStoreVersions/${editable.id}/appStoreVersionLocalizations?limit=20`);
const existing = locs.data.find((l) => l.attributes.locale === "zh-Hans");
console.log(
  `char counts → promo:${ATTRS.promotionalText.length} keywords:${ATTRS.keywords.length} description:${ATTRS.description.length}`,
);

if (DRY) {
  console.log(existing ? "[dry] would PATCH existing zh-Hans" : "[dry] would CREATE zh-Hans");
} else if (existing) {
  const { locale, ...editAttrs } = ATTRS;
  await asc("PATCH", `/v1/appStoreVersionLocalizations/${existing.id}`, {
    data: { type: "appStoreVersionLocalizations", id: existing.id, attributes: editAttrs },
  });
  console.log("zh-Hans localization UPDATED ✓", existing.id);
} else {
  const res = await asc("POST", `/v1/appStoreVersionLocalizations`, {
    data: {
      type: "appStoreVersionLocalizations",
      attributes: ATTRS,
      relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: editable.id } } },
    },
  });
  console.log("zh-Hans localization CREATED ✓", res.data.id);
}
console.log("Note: no zh screenshots uploaded — Apple falls back to the en-US set.");
