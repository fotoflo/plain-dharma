# Contribute — Plain Dharma

*Last updated: 2026-05-28*

Reader contact form powering `/contribute` (and `/zh/contribute`) for volunteers, translators, and voice artists to reach the project owner. The feature is the third server-side carve-out alongside `/api/subscribe` and `/api/checkout`, using Resend's REST API to send emails.

## Overview

```
/contribute (EN), /zh/contribute (ZH)
  → ContributeView (locale-aware)
    → ContactForm (client, name/email/message form)
      → POST /api/contact
        → Resend REST API
        → Email to CONTACT_TO_EMAIL with reply_to set to sender
```

## Key files

| File | Role |
|---|---|
| `src/app/contribute/page.tsx` | EN route; sets metadata + renders ContributeView |
| `src/app/zh/contribute/page.tsx` | ZH route; sets metadata + renders ContributeView |
| `src/views/ContributeView.tsx` | Page view: kicker, h1, intro prose, role bullets (copy editors / translators / voice artists), ContactForm |
| `src/components/ContactForm.tsx` | Client component: name (optional) / email (required) / message (required), form state machine, POST to /api/contact, mirrors NewsletterSignup.tsx pattern |
| `src/app/api/contact/route.ts` | Server POST handler: validates email + message length, calls Resend REST API (`https://api.resend.com/emails`), returns `{ ok: true }` or `{ error: string }` |
| `src/content/strings.ts` | `contribute` section (kicker, h1, role labels, intro/closing prose) + `contact` section (form labels, placeholders, success/error messages) for both en and zh |
| `src/components/layout/Header.tsx`, `Footer.tsx` | Locale-aware nav + footer links to `/contribute` or `/zh/contribute` |
| `src/app/sitemap.ts` | Entries for `/contribute` and `/zh/contribute` |

## Data flow

**Client side:**
1. User fills name (optional), email (required), message (required ≥ 2 chars, ≤ 5000 chars)
2. Form validates locally on submit; user sees client error if email empty or message too short
3. If valid, POST `{ name, email, message }` to `/api/contact`
4. On success (200 + `{ ok: true }`), show success message and reset form fields
5. On error (any other response or network error), show error message from API or default fallback

**Server side:**
1. `/api/contact` POST receives JSON body with `{ name?, email, message }`
2. Validates:
   - Email matches regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` and is ≤ 254 chars (RFC limit)
   - Message is 2–5000 chars
   - Name (optional) is trimmed to ≤ 200 chars
3. Reads `RESEND_API_KEY` from env (503 if missing)
4. Calls `https://api.resend.com/emails` with:
   - `from`: `CONTACT_FROM_EMAIL` env or default `"Plain Dharma <onboarding@resend.dev>"`
   - `to`: `CONTACT_TO_EMAIL` env or default `"fotoflo@gmail.com"`
   - `reply_to`: sender's email (so owner can reply directly)
   - `subject`: `"Plain Dharma — message from {name || email}"`
   - `text`: formatted as `"From: {name <email> or email}\n\n{message}"`
5. Returns `{ ok: true }` on success; logs Resend errors and returns `{ error: "..." }` on failure

## Environment variables

| Var | Required | Default | Purpose |
|---|---|---|---|
| `RESEND_API_KEY` | Yes | — | Bearer token for `https://api.resend.com/emails` |
| `CONTACT_TO_EMAIL` | No | `fotoflo@gmail.com` | Where messages land |
| `CONTACT_FROM_EMAIL` | No | `"Plain Dharma <onboarding@resend.dev>"` | Verified sender address in email header |

## Important patterns

**Third server-side carve-out.** Like `/api/subscribe` (Mailjet) and `/api/checkout` (Stripe), `/api/contact` is a necessary server-only route — the Resend API key must never reach the browser. The static-export constraint (`output: 'export'` viability) allows exactly three API routes: those three. Do not add more without equivalent justification (keys that must stay server-side, or business logic the static site can't handle).

**Resend onboarding@resend.dev limitation.** The default `CONTACT_FROM_EMAIL` uses Resend's shared onboarding domain. This domain can only deliver to the **account owner's email address** — in this case, `fotoflo@gmail.com`, so it works. If you change `CONTACT_TO_EMAIL` to a different address, you *must* set `CONTACT_FROM_EMAIL` to a verified domain (e.g., `"Plain Dharma <hello@plaindharma.com>"`) after verifying the domain in Resend's dashboard. Unverified domains will silently fail to deliver (check Resend logs for bounces).

**Raw fetch, not SDK.** Like `/api/subscribe`, this route uses raw `fetch()` to the Resend REST API, not the `resend` npm package. This keeps bundle impact low and follows the existing pattern.

**ContactForm mirrors NewsletterSignup.** Both are client components with identical state-machine patterns (idle → submitting → success/error), field masking, and error handling. Changes to error messages or field behavior should be kept in sync.

## Locale routing

Both `/contribute` and `/zh/contribute` are fully static — no dynamic params. Each page exports its own metadata with locale-aware `alternates.languages` cross-links. The `ContributeView` accepts `locale: Locale` and calls `getStrings(locale)` to render translated strings.

When more locales land, add new routes under `src/app/{locale}/contribute/page.tsx` (following `src/app/zh/contribute/page.tsx` as a template) and new locale entries in the `contribute` and `contact` sections of `src/content/strings.ts`.
