# Todos — Plain Dharma Launch Plan

*Last updated: 2026-05-25*

Ordered, structured launch plan. Phases run roughly sequentially but Phases 3–5 can overlap once the digital home is live.

---

## Phase 1 — Foundation (Week 1)

- [x] **Trim to 6 teachings** — the canonical set is locked: First Talk, Not-Self, Fire Sermon, Mettā, Satipaṭṭhāna, Kālāma.
- [x] **Pick name + domain** — Plain Dharma / plaindharma.com selected.
- [ ] **Purchase plaindharma.com**
  - Register through any reputable registrar (Cloudflare or Porkbun recommended for low markup).
  - Lock the domain, enable WHOIS privacy, set auto-renew.
- [ ] **Write "About this version" page content**
  - Who made this and why.
  - What "plain modern English" means here (and what it doesn't mean — not a scholarly translation).
  - Sources consulted.
  - License (CC0) and the dharma-gift framing.
  - How to contribute corrections / translations.
- [ ] **Apply CC0 license**
  - Add `LICENSE.md` at repo root with full CC0 1.0 Universal text.
  - Add a one-line license footer to every page.
  - Mention CC0 explicitly on `/about` and `/download`.

---

## Phase 2 — Digital Home (Week 2–3)

- [ ] **Build Next.js site** *(in progress — separate build agent)*
  - See `architecture.md` for the stack and conventions.
  - See `sitemap.md` for the route structure.
- [ ] **Generate PDF + ePub from source markdown**
  - Use `pandoc` against `combined-suttas.md` (or the regenerated combined file if the MDX-per-teaching option wins).
  - Three artifacts: screen-reading PDF, ePub, print-ready PDF (5×8" or 5.5×8.5" trim, with bleed and trim marks).
  - Store in `public/downloads/`.
  - Automate via a build script so re-generation is one command.
- [ ] **Set up QR landing flow for physical books**
  - QR on the back cover → `plaindharma.com/download` (or a vanity path like `/book`).
  - Track via URL only (no tracking pixel — see analytics note in architecture).
- [ ] **Deploy to Vercel**
  - Connect repo, configure custom domain, verify SSL.
  - Confirm Lighthouse scores and Core Web Vitals before announcing.

---

## Phase 3 — Online Launch (Week 3–5)

- [ ] **Friends-preview soft launch**
  - 5–10 readers, mixed (Buddhist + secular curious).
  - Collect: typos, awkward phrasings, places where the plain English drifted into jargon.
  - Two-week feedback window before public launch.
- [ ] **Coordinated launch day** — HN + r/Buddhism + r/streamentry
  - Post on the same morning, US Pacific time (best HN slot).
  - HN title: lead with the project ("Plain Dharma — the Buddha's foundational teachings in plain modern English").
  - r/Buddhism: lead with the gift framing and CC0 license.
  - r/streamentry: lead with the practitioner angle (Satipaṭṭhāna + Kālāma + First Talk are all directly useful for practice).
- [ ] **Podcast / newsletter pitches**
  - Targets: Sam Harris (Making Sense / Waking Up), Dan Harris (10% Happier), Tricycle, Lion's Roar, Buddhadharma.
  - Pitch angle: free, CC0, plain English, dharma-gift — story is the *project*, not the person.

---

## Phase 4 — Amazon (Week 4–6)

- [ ] **Cover design + listing metadata**
  - Cover: typographic, no Buddha imagery (avoid kitsch), title + tagline, calm palette.
  - Title: *Plain Dharma: The Buddha's Foundational Teachings in Plain Modern English*.
  - Subtitle / keyword density on first 60 chars matters for KDP search.
- [ ] **Keywords + categories**
  - Primary categories: Religion & Spirituality > Buddhism > Theravada; Religion & Spirituality > Buddhism > Rituals & Practice.
  - Keywords: "buddhist sutras modern english", "fire sermon", "kalama sutta", "satipatthana", "metta sutta", "plain english buddhism", "secular buddhism".
- [ ] **Kindle live at $2.99** *(KDP Select enrolled)*
  - **Why $2.99 not $0.99**: KDP Select pays 70% royalty on $2.99–$9.99, only 35% below. $2.99 = ~$2.05/sale; $0.99 = ~$0.35/sale. The Buddhist book buyer is not price-sensitive at this range — $2.99 still reads as "basically free" while funding the physical print runs.
  - KDP Select enrollment enables Kindle Unlimited (free reads still pay per-page-read) and Countdown Deals.
- [ ] **KDP Print paperback live ($5–8)**
  - Pricing: cover printing cost + minimum royalty. $5.99 is a comfortable target.
  - Same interior file as the print-ready PDF from Phase 2.
- [ ] **Solicit reviews from early readers**
  - Target 50+ reviews in the first 60 days — this is the threshold where Amazon's algorithm starts surfacing the book organically.
  - Email the friends-preview list on launch day with the direct review link.
  - Never offer anything in exchange for reviews (TOS violation).

---

## Phase 5 — Chiang Mai Physical Distribution ★ highest leverage

This is the highest-leverage phase. Spiritual-tourism density in Chiang Mai is extraordinary, the cost-per-booklet at local print shops is ~$0.30–0.60, and the dharma-gift culture is already established — temples *expect* free books to be available.

- [ ] **Print 200–500 booklets** at a Chiang Mai print shop
  - Saddle-stitched, 5×8" or 5.5×8.5", matte cover.
  - QR code on back → `/download`.
  - Recommend starting at 300 to test demand before scaling.
- [ ] **Write abbot one-pager** (Thai + English)
  - Permission request to leave booklets at the temple's English-language section.
  - Frame: free, dharma-gift, CC0, six foundational teachings, modern English for visitors.
  - Brief, respectful, one page.
- [ ] **Temple drops**
  - Wat Suan Dok (monk chats with foreigners — high tourist density)
  - Wat Ram Poeng (Tapotaram) (meditation retreats — captive practitioner audience)
  - Wat Umong (forest temple, English-speaking visitors)
  - Wat Pha Lat (Doi Suthep trail — high foot traffic)
  - Doi Suthep main temple (highest tourist density in Chiang Mai)
- [ ] **Cafe + hostel + yoga drops**
  - Free Bird Cafe (vegan / spiritual crossover crowd)
  - Pun Pun (Wat Suan Dok adjacent)
  - Khun Churn (popular vegetarian)
  - Wild Rose (yoga + cafe)
  - Yoga Tree
  - Old City hostels (Lub d, Stamps, Green Sleep — high backpacker density)
- [ ] **Pai day trip**
  - Higher spiritual-tourism density per capita than Chiang Mai. Half the audience is already on a retreat or in a yoga teacher training.
  - Drop at: cafes around the walking street, the Sunday market, the yoga studios.

---

## Phase 6 — Second Wave (Week 6+)

- [ ] **ACX audiobook recording**
  - Length is short (under 3 hours total for all six) — easy first audiobook.
  - Record self or hire narrator on ACX royalty-share.
  - Distribute via Audible + iTunes; also host MP3s on `/audio` (reserved URL).
- [ ] **Translation outreach** — coordinate with i18n routing
  - Initial targets per the user's locale list: `cn/th/vt` (Chinese, Thai, Vietnamese).
  - Recommend revisiting to standard ISO codes (`zh/th/vi`) before lock-in.
  - Outreach: post in r/Buddhism, r/translator, Buddhist Discord servers, Thai dhamma communities.
  - Coordinate with locale routing (`app/[locale]/...`) — each translation drops into `src/content/{locale}/`.
  - Reserve `/translations` landing page when there are 2+ live translations.
- [ ] **Reserved-for-later URL pages** — build out when content is ready:
  - `/audio` (after ACX)
  - `/print` (printing & distribution guide for people who want to print their own booklets — empower the dharma-gift chain)
  - `/translations` (landing page listing live languages)

---

## Cross-cutting reminders

- **Every artifact is CC0.** PDF, ePub, audiobook, translations — all of it. No exceptions, no "all rights reserved" defaults sneaking in.
- **The website is the canonical home.** Amazon, physical books, and audio all point back to `plaindharma.com`.
- **The Chiang Mai drop is the highest-leverage activity** of the entire project. Every other phase exists partly to support it (QR codes need a website, the website needs translations, etc.).
