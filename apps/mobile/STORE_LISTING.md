# Store listing — Plain Dharma mobile

Exhaustive, field-by-field submission reference for the Apple App Store and
Google Play. Every field either has our value, a verified copy block, or a
`[DECIDE]` marker where it's your call. Character counts are verified against
each store's caps.

## Quick reference / IDs

| Thing | Value |
|---|---|
| App name | `Plain Dharma` |
| Bundle ID / package | `com.plaindharma.app` |
| Version / build | `1.0.0` / iOS build #5, Android versionCode 2 |
| Apple ID (ASC) | `6774981366` |
| EAS project | `f54b73b7-d4de-4feb-8d1a-0c050a76499f` (`@fotoflo/plain-dharma`) |
| Apple Team | `H78XB55WG8` — Flexbike, Inc. |
| Website | https://plaindharma.com |
| Privacy Policy | https://plaindharma.com/privacy *(live)* |
| Support page | https://plaindharma.com/contribute |
| Developer/support email | `fotoflo@gmail.com` `[CONFIRM]` |
| Copyright | `Public domain — CC0 1.0 Universal` |

`[DECIDE]` items you must supply yourself: SKU, App Review contact phone, release
timing, country availability, iPhone-only vs iPad.

> ## ⏸️ MOBILE SUBMISSION ON HOLD
> Shipped build #5 collects **only optional email** (newsletter/contact) — it has
> **no analytics, no account, no notes**. We're adding **Google Analytics** and
> **email magic-link login + synced highlights/notes** to the app (in progress on
> a feature branch). Do **not** finalize the store privacy labels or submit for
> public review until those land. The privacy sections below give **two** answer
> sets: **(A) build #5 as-shipped** and **(B) the full product** once the features
> are live — use (B) when you submit. iOS binary stays in TestFlight, Android in
> Internal testing until then.

---

# 🍎 Apple — App Store Connect

## 0. Prerequisites (Agreements, Tax, and Banking)

- **Free Apps agreement** must show **Active** (Business → Agreements). A free app
  needs *only* this — the **Paid Apps** agreement, tax forms, and banking are **not
  required** for a free CC0 app. `[VERIFY it's active]`

## 1. App Information  (App-level — set once, applies to all versions)

| Field | Value |
|---|---|
| **Name** (≤30 → 12) | `Plain Dharma` |
| **Subtitle** (≤30 → 25) | `Old wisdom, plain English` |
| **Bundle ID** | `com.plaindharma.app` |
| **SKU** (internal, not shown) | `plaindharma-ios` `[DECIDE — any unique string]` |
| **Apple ID** | `6774981366` (auto) |
| **Primary Language** | English (U.S.) |
| **Primary Category** | Books |
| **Secondary Category** | Lifestyle (optional) |
| **Content Rights** | "This app does not contain, show, or access third-party content." (The translations are the project's own, released CC0.) |
| **Age Rating** | 4+ — see questionnaire below |
| **License Agreement** | Apple's standard EULA (default) |

### Age Rating questionnaire (→ 4+)
Answer **None / No** to every category: Cartoon/Fantasy/Realistic Violence,
Sexual Content/Nudity, Profanity, Alcohol/Tobacco/Drugs, Horror, Gambling,
Contests, Medical/Treatment info, Unrestricted Web Access → **No**, Made for
Kids → **No**. Result: **4+**.

## 2. Pricing and Availability

| Field | Value |
|---|---|
| **Price** | Free (Tier 0) |
| **Availability** | All countries & regions `[DECIDE if you want to limit]` |
| **Pre-Orders** | Off |
| **Distribution** | Public — App Store |

## 3. App Privacy  (App-level)

| Field | Value |
|---|---|
| **Privacy Policy URL** | `https://plaindharma.com/privacy` |
| **Privacy Choices URL** | *(leave blank)* |

### Data collection questionnaire ("nutrition label")

**(A) Build #5 as-shipped** — collects only optional email:
- Collect data? → **Yes**. **Contact Info → Email Address** only (newsletter/contact form), linked to identity, **not** used for tracking, purpose **App Functionality**. Everything else → Not Collected. No tracking, no ATT prompt.

**(B) Full product** (use this once GA + magic-link notes ship in the app):
- **Contact Info → Email Address** — newsletter/contact **and** the magic-link account. Linked. Purpose: App Functionality. Tracking: No.
- **Identifiers** — Google Analytics client ID / device identifier. Linked: your call (No if anonymous client_id). **Purpose: Analytics.** Tracking: **No** (unless you combine with data from other apps for ads — you don't).
- **Usage Data → Product Interaction** — GA screen/page views. Purpose: Analytics. Tracking: No.
- **User Content → Other User Content** — the highlights and notes a signed-in user saves. Linked. Purpose: App Functionality. Tracking: No.
- **Diagnostics** — only if you later add crash/performance reporting (none today).
- Still **no** Location, Financial Info (donations are external Stripe/web), Health, Contacts, Photos. No ATT prompt needed (no cross-app tracking).

## 4. Version 1.0.0 — "App Store" tab  (Version-level)

| Field | Value |
|---|---|
| **Promotional Text** (≤170 → 161; editable without review) | *(block below)* |
| **Description** (≤4000) | *(block below)* |
| **Keywords** (≤100 → 98) | *(block below)* |
| **Support URL** | `https://plaindharma.com/contribute` |
| **Marketing URL** (optional) | `https://plaindharma.com` |
| **Version** | `1.0.0` |
| **Copyright** | `Public domain — CC0 1.0 Universal` |
| **Routing App Coverage File** | *(none)* |
| **App Previews** (video, optional) | *(none for v1)* |
| **Screenshots** | see §8 |

**Promotional Text**
```
Six foundational Buddhist teachings in plain modern English. Free to read, listen, and keep offline — no ads, no account, no cost. Released to the public domain.
```

**Keywords**
```
buddhism,buddhist,sutta,sutra,dharma,meditation,mindfulness,pali,theravada,scripture,audiobook,zen
```

**Description**
```
Plain Dharma is the Buddha's foundational teachings, rendered in plain modern English — for a first-time reader who'd rather understand than wade through footnotes.

Six short sutras sit at the root of the whole tradition. Here they are, side by side, in clear contemporary language:

• The First Teaching — the four noble truths and the middle way
• Not-Self — what we are, and what we are not
• The Fire Sermon — how craving burns, and how it cools
• Loving-Kindness — goodwill as a practice, not a feeling
• Mindfulness — the four foundations of awareness
• How to Decide — the Buddha's own test for what to trust

Read them. Listen to them — every talk is narrated, with a calm, unhurried pace, and you can download the whole collection for offline listening on a plane or away from signal. Switch between light and dark, adjust the type size and contrast, and read in a serif or a high-legibility face.

Everything here is free. No ads. No account. No tracking. The entire text and narration are released under CC0 — the public domain — so you're free to read, copy, print, share, and reuse any of it, for any purpose, forever.

A gift, freely given.

plaindharma.com
```

**What's New in This Version** (release notes, ≤4000)
```
The first release of Plain Dharma.

Six foundational Buddhist teachings in plain modern English — read or listen, online or offline. Light and dark themes, adjustable type, and narrated audio for every talk. Free, public domain, no account required.
```

## 5. Build & Export Compliance

| Field | Value |
|---|---|
| **Build** | Attach iOS build **#5** (1.0.0) — already uploaded via `eas submit`. |
| **Export Compliance** | App uses only standard HTTPS → **exempt**. Set `ios.config.usesNonExemptEncryption = false` in `app.json` to suppress the per-submit prompt (see §commands). If prompted: "Does your app use encryption?" → "Only standard/exempt encryption (HTTPS)." |
| **App Icon (1024×1024)** | Shipped inside the build (no alpha/transparency). No separate upload. |
| **Content Rights confirmation** | You hold the rights (CC0 original content). |
| **IDFA / advertising identifier** | Not used. |

## 6. App Review Information

| Field | Value |
|---|---|
| **Sign-in required?** | **No** — all content works without an account. *(Full product: keep "No" — the magic-link account is optional, only for syncing notes.)* |
| **Demo account** | N/A. *(Full product: magic-link is passwordless, so there's no username/password to give. In Notes, tell the reviewer the account is optional and explain how to test it — e.g. enter any email, then provide a pre-clicked/test session or a temporary OTP — see Supabase test users.)* |
| **Contact First/Last name** | `Alex Miller` `[CONFIRM]` |
| **Contact Phone** | `[DECIDE — your number]` |
| **Contact Email** | `fotoflo@gmail.com` `[CONFIRM]` |
| **Attachment** | *(none)* |
| **Notes** | *(block below — important: pre-empts the donation/IAP question)* |

**Reviewer Notes** — paste this:
```
Plain Dharma is a free, public-domain (CC0) reading and listening app. All
content — six Buddhist suttas in plain English plus narrated audio — is fully
available with no account, no login, and no in-app purchases. Text and audio
stream from our website, plaindharma.com.

The "Donate" and newsletter actions are optional. "Donate" opens our website in
Safari to support the nonprofit project; it does NOT unlock any app content or
functionality (everything is already free), so it is not an in-app purchase. The
newsletter signup is an optional email field. No tracking or analytics are used.
```
> For the **full product** submission, amend the note: the app uses Google
> Analytics for aggregate usage stats (no cross-app tracking), and offers an
> *optional* passwordless email magic-link sign-in solely to sync a reader's own
> highlights and notes across devices — it gates no content. Add reviewer test
> steps for the magic-link flow.
>
> ⚠️ **Donation note:** because Donate links out to an external Stripe page, a
> reviewer *may* flag it under Guideline 3.1.1. The note above frames it
> correctly (donations don't unlock content). If rejected, the fallback is to
> hide the Donate button on iOS or route it through Apple's approved nonprofit
> donation flow.

## 7. Version Release

| Field | Value |
|---|---|
| **Release option** | `[DECIDE]` — *Automatically release after approval* (recommended) / *Manually release* / *Scheduled* |
| **Phased Release for automatic updates** | Optional (off for first release) |
| **Reset iOS summary rating** | N/A (first release) |

## 8. Screenshots & icon — Apple specs

- **iPhone 6.9"** (1320 × 2868) **or 6.7"** (1290 × 2796) — **required**; one set
  covers all modern iPhones. 1–10 images.
- **iPad 13"** (2064 × 2752) — required **only if** the app is iPad-compatible.
  `app.json` leaves `ios.supportsTablet` unset (iPhone-only, scaled on iPad), so
  iPad screenshots can be **skipped**. `[DECIDE — iPhone-only vs full iPad]`
- Format: PNG/JPG, **no alpha/transparency**, no rounded corners or fake
  status-bar overlays.
- **Marketing app icon:** 1024×1024 (from the build).

---

# 🤖 Google — Play Console

## 1. Create app

| Field | Value |
|---|---|
| **App name** | `Plain Dharma` |
| **Default language** | English (United States) – en-US |
| **App or game** | App |
| **Free or paid** | **Free** (⚠ free→paid is irreversible) |
| **Declarations** | ✔ Developer Program Policies · ✔ US export laws |

Package name `com.plaindharma.app` is read from the first uploaded `.aab` and then
locked.

## 2. "Set up your app" — App content declarations (ALL must be complete)

| Section | Answer |
|---|---|
| **Privacy policy** | `https://plaindharma.com/privacy` |
| **App access** | (A) "All functionality available without special access." (B) Still the same — the magic-link account is optional and gates no content; if Play asks, note it's optional. |
| **Ads** | "No, my app does not contain ads" |
| **Content rating** | Run questionnaire → "Everyone" (details §6) |
| **Target audience & content** | Target age `13+` `[DECIDE]`; "Does your app appeal to children?" → No |
| **News app** | No |
| **COVID-19 contact tracing/status** | No |
| **Data safety** | See §5 |
| **Government apps** | No |
| **Financial features** | "My app doesn't provide any financial features" |
| **Health apps** | Not a health app |
| **Advertising ID** | App does **not** use an advertising ID |

## 3. Main store listing

| Field | Value |
|---|---|
| **App name** (≤30) | `Plain Dharma` |
| **Short description** (≤80 → 70) | `The Buddha's foundational teachings in plain modern English. Free, CC0.` |
| **Full description** (≤4000) | *Reuse the iOS Description block above.* |
| **App icon** | 512 × 512 PNG (32-bit, ≤1 MB) |
| **Feature graphic** | 1024 × 500 PNG/JPG — **required by Play** |
| **Phone screenshots** | 2–8; 16:9 or 9:16; 320–3840 px/side |
| **7" tablet screenshots** | optional |
| **10" tablet screenshots** | optional |
| **Promo video** (YouTube URL) | optional |

## 4. Store settings

| Field | Value |
|---|---|
| **App category** | Books & Reference |
| **Tags** | choose up to 5 (e.g. Buddhism, Meditation, Reading) |
| **Store listing contact — email** | `fotoflo@gmail.com` `[CONFIRM]` (required, shown publicly) |
| **Contact — phone / website** | website `https://plaindharma.com`; phone optional |
| **External marketing** | `[DECIDE]` opt-in/out |

## 5. Data safety form (detailed)

Collects/shares user data? → **Yes**. Encrypted in transit? → **Yes**. Data
deletion method? → **Yes**, via `https://plaindharma.com/contribute`.

**(A) Build #5 as-shipped:**
- **Personal info → Email address** — collected, not shared, optional, purpose **App functionality**. Nothing else.

**(B) Full product** (GA + magic-link notes live in the app):
- **Personal info → Email address** — collected (newsletter/contact + account), not shared, optional, **App functionality** + **Account management**.
- **App activity → App interactions** — collected (Google Analytics), not shared, purpose **Analytics**.
- **Device or other IDs** — collected (GA client/instance ID), not shared, purpose **Analytics**.
- **App info & performance → Other** *(only if you add crash reporting — none today).*
- **Highlights/notes** are the user's own content synced to their account → declare under **Personal info → "Other"** (or "User content" if Play lists it), collected, not shared, optional, **App functionality**.
- Still **not** collected: Location, Financial info, Contacts, Photos, Health.

## 6. Content rating questionnaire (→ Everyone)

- **Email address** for the rating certificate: `fotoflo@gmail.com` `[CONFIRM]`.
- **Category:** "Reference, News, or Educational."
- All content questions (violence, sexuality, language, controlled substances,
  gambling, user interaction, shares location, digital purchases) → **No**.
- Result: IARC **Everyone / PEGI 3**.

## 7. Production release

| Field | Value |
|---|---|
| **Track** | First upload: **Internal testing** (required for a brand-new app before API submits work), then promote to **Production**. |
| **App signing** | **Play App Signing** (enroll on first upload; EAS holds the upload key). |
| **Release name** | `1.0.0 (2)` (auto from the `.aab`) |
| **Release notes** | wrap per language: `<en-US> … </en-US>` — reuse the iOS "What's New". |
| **Countries / regions** | All `[DECIDE]` |
| **Rollout** | 100% (or staged) `[DECIDE]` |

## 8. Graphics specs (recap)

| Asset | Size | Notes |
|---|---|---|
| App icon | 512×512 PNG | 32-bit, ≤1 MB |
| Feature graphic | 1024×500 | **required** |
| Phone screenshots | ≥2 | 9:16 portrait recommended |
| (tablet) | optional | |

---

# Build & submit commands

OTA-only JS changes (no native rebuild):
```bash
pnpm eas update --channel production --environment production -m "<changes>"
```

Native production build + submit:
```bash
# iOS — build + auto-submit to App Store Connect (ASC API key already wired)
pnpm eas build --profile production --platform ios --auto-submit --non-interactive

# Android — build the .aab (first Play upload is manual; see §7)
pnpm eas build --profile production --platform android --non-interactive
```

Suppress the iOS export-compliance prompt (recommended) by adding to `app.json`:
```jsonc
"ios": { "config": { "usesNonExemptEncryption": false } }
```

> `eas submit` only **uploads** the binary (TestFlight / Play internal). To publish
> to the public store you still attach the build to a version and submit for
> review in App Store Connect / Play Console.

### `.easignore` gotcha (learned the hard way)

`.easignore` excludes the heavy `public/` media from the build upload, **but** the
per-sutta audio manifests (`public/audio/**/manifest.json`) are inline-imported by
`src/audio/bundled-manifests.ts` and must be uploaded, or the native build fails at
the *Bundle JavaScript* phase. The blanket `public/` exclusion was replaced with
targeted excludes (`public/illustrations/`, `public/downloads/`, `public/logo/`,
`public/audio/**/*.mp3`) so the manifests survive. The OTA path masks this because
`expo export` runs locally where `public/` exists.
