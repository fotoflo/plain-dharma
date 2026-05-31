# Store listing — Plain Dharma mobile

Copy-paste-ready metadata for the Apple App Store and Google Play listings, plus
the submission walkthroughs. Keep this in sync when the app's features change.

- **Bundle ID / package:** `com.plaindharma.app`
- **Version:** `1.0.0`
- **EAS project:** `f54b73b7-d4de-4feb-8d1a-0c050a76499f` (`@fotoflo/plain-dharma`)
- **ASC App ID (iOS):** `6774981366`
- **Website:** https://plaindharma.com
- **Privacy Policy:** https://plaindharma.com/privacy *(must be deployed live before either store will accept the listing)*
- **Support:** https://plaindharma.com/contribute

Character counts below are verified against each store's caps.

---

## Apple App Store

### App information (set once)

| Field | Value |
|---|---|
| **Name** | `Plain Dharma` |
| **Subtitle** (≤30 → 25) | `Old wisdom, plain English` |
| **Bundle ID** | `com.plaindharma.app` |
| **Primary category** | Books |
| **Secondary category** | Lifestyle |
| **Age rating** | 4+ (all questionnaire answers "None") |
| **Copyright** | `Public domain — CC0 1.0 Universal` |

### URLs

| Field | Value |
|---|---|
| **Privacy Policy URL** (required) | `https://plaindharma.com/privacy` |
| **Support URL** (required) | `https://plaindharma.com/contribute` |
| **Marketing URL** (optional) | `https://plaindharma.com` |

### Promotional Text (≤170 → 161; editable anytime without review)

```
Six foundational Buddhist teachings in plain modern English. Free to read, listen, and keep offline — no ads, no account, no cost. Released to the public domain.
```

### Keywords (≤100 → 98; comma-separated, no spaces)

```
buddhism,buddhist,sutta,sutra,dharma,meditation,mindfulness,pali,theravada,scripture,audiobook,zen
```

### Description (≤4000)

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

### What's New (version 1.0.0)

```
The first release of Plain Dharma.

Six foundational Buddhist teachings in plain modern English — read or listen, online or offline. Light and dark themes, adjustable type, and narrated audio for every talk. Free, public domain, no account required.
```

### App Privacy questionnaire (the "nutrition label")

- **Data used to track you:** None.
- **Data linked to you:** **Email Address** — *only* if the user uses the in-app
  newsletter signup or contact form. Purpose: **App Functionality** (sending the
  emails they asked for). Not used for tracking or advertising.
- **Data not linked to you:** None.
- No analytics SDK, no ads, no location, no identifiers.
- Donations go through Stripe in an external browser (not in-app), so they aren't
  part of the app's data collection — but the privacy page discloses Stripe anyway.

### Screenshots — Apple size requirements (App Store Connect, 2024+)

- **iPhone 6.9"** (1320 × 2868) or **6.7"** (1290 × 2796) — **required**; one set
  covers all modern iPhones.
- **iPad 13"** (2064 × 2752) — required **only if** the app is marked
  iPad-compatible. `app.json` leaves `ios.supportsTablet` unset (iPhone-only,
  scaled on iPad), so iPad screenshots can be **skipped**. To list it as a true
  iPad app, set `supportsTablet: true` and rebuild.
- 1–10 images per size; PNG/JPG; no alpha/transparency; no rounded corners or
  status-bar overlays.

---

## Google Play

### Store listing copy

| Field | Value |
|---|---|
| **App name** | `Plain Dharma` |
| **Short description** (≤80) | `The Buddha's foundational teachings in plain modern English. Free, CC0.` |
| **Full description** (≤4000) | *Reuse the iOS Description above.* |
| **Category** | Books & Reference |
| **Content rating** | Everyone |

### Required Play graphics (differ from iOS)

- **App icon** — 512 × 512 PNG.
- **Feature graphic** — 1024 × 500 (Play **requires** this; iOS doesn't).
- **Phone screenshots** — minimum 2 (16:9 or 9:16, 320–3840 px per side).

### Data safety form

Mirror the iOS privacy answers:
- Collects **Email** — *optional*, purpose **App functionality**, not shared, not
  for tracking.
- No other data collected.
- Data encrypted in transit.
- Privacy policy URL: `https://plaindharma.com/privacy`.

### Play Console app-creation walkthrough

1. **Create the app** → https://play.google.com/console/ → **Create app**
   - Name `Plain Dharma`; default language English (US); type **App**; **Free**.
   - Accept the Developer Program Policies + US export declarations → **Create app**.
2. **Package name** (`com.plaindharma.app`) is read from the first uploaded
   `.aab` and then locked — no manual entry.
3. **"Set up your app" dashboard tasks** (all must be green to publish):
   - App access → "All functionality available without special access."
   - Ads → "No, my app does not contain ads."
   - Content rating → questionnaire → "Everyone."
   - Target audience → 13+ (avoids triggering Families policy).
   - Data safety → as above.
   - Government / Financial / Health → No.
   - Privacy policy → `https://plaindharma.com/privacy`.
4. **Store listing** → short + full description, icon, feature graphic, screenshots.
5. **First release must be uploaded by hand.** For a brand-new Play app, the first
   `.aab` goes up via the Console (Internal testing track is simplest) before
   `eas submit` can use the API. After that, wire `eas.json` +
   a Play service-account JSON key for one-command submits.

---

## Build & submit commands

OTA-only JS changes (no native rebuild needed):

```bash
pnpm eas update --channel production --environment production -m "<changes>"
```

Native production build + submit:

```bash
# iOS — build + auto-submit to App Store Connect (ASC API key already wired)
pnpm eas build --profile production --platform ios --auto-submit --non-interactive

# Android — build the .aab (first Play upload is manual; see above)
pnpm eas build --profile production --platform android --non-interactive
```

> Note: `eas submit` only **uploads** the binary (TestFlight / Play internal). To
> publish to the public store you still attach the build to a version and submit
> for review in App Store Connect / Play Console.

### `.easignore` gotcha (learned the hard way)

`.easignore` excludes the heavy `public/` media from the build upload, **but** the
per-sutta audio manifests (`public/audio/**/manifest.json`) are inline-imported by
`src/audio/bundled-manifests.ts` and must be uploaded, or the native build fails at
the *Bundle JavaScript* phase. The blanket `public/` exclusion was replaced with
targeted excludes (`public/illustrations/`, `public/downloads/`, `public/logo/`,
`public/audio/**/*.mp3`) so the manifests survive. The OTA path masks this because
`expo export` runs locally where `public/` exists.
