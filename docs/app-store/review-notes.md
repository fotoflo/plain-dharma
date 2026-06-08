# App Store review notes

Reusable **App Review Information → Notes** + demo-account setup for App Store
Connect submissions (app id `6774981366`, bundle `com.plaindharma.app`).

These live in the `appStoreReviewDetails` resource and can be updated via the
ASC API (mint an ES256 JWT from `EXPO_ASC_*` in `.env.local`, then
`PATCH /v1/appStoreReviewDetails/{id}` with `notes` / `demoAccountName` /
`demoAccountPassword` / `demoAccountRequired`). The detail id for the current
1.0 version is `831ec4bf-a80b-4e89-aeae-158195bab01a` (re-fetch via
`GET /v1/appStoreVersions/{id}/appStoreReviewDetail` for new versions).

## Demo account

- **In-app email:** `PlainDharma+reviewer@gmail.com` (plus-alias of `PlainDharma@gmail.com`)
- **Gmail webmail login:** `PlainDharma@gmail.com` — password is **not stored in this
  public repo**; it lives in the ASC Demo Account field (source of truth) and in
  local agent memory.

## Notes text

> Sign-in is passwordless (email magic link), so the demo "password" below is the
> **Gmail webmail** password used to read the link, not an app password.

```
Plain Dharma is a free, ad-free reading & listening app for six foundational
Buddhist texts in plain modern English (and Chinese — Simplified/Traditional).
All content is public-domain (CC0). No ads, no in-app purchases.

ACCOUNT IS OPTIONAL
The entire app — reading, audio playback, offline download, and creating
highlights/notes — works fully WITHOUT signing in (data stays on-device).
Signing in only syncs highlights & private notes across devices.

SIGN-IN (passwordless email magic link)
You type an email, a one-time link is sent to it, and tapping the link signs you
in. A demo inbox is provided so you can receive the link:
1. In the app: More -> Account -> enter  PlainDharma+reviewer@gmail.com -> Send link
2. Read the link: open mail.google.com in Safari and sign in with
     Email:    PlainDharma@gmail.com   (log in WITHOUT the "+reviewer" part)
     Password: <Gmail webmail password — see ASC Demo Account field>
3. Open the newest magic-link email and tap the link — it returns to the app,
   now signed in.

ACCOUNT DELETION (Guideline 5.1.1(v))
Once signed in: More -> Account -> "Delete Account". This permanently deletes the
account and all synced highlights/notes (server-side cascade via a Supabase Edge
Function). This is the change in this build vs. the previous submission.

DONATIONS
The optional "Donate" link opens an external website (Stripe) in the browser to
support this free public-domain project. It is processed outside the app and does
not use in-app purchase or gate any content or features.

TEST ACCESS
The demo inbox above receives the magic link. If you'd rather use your own email,
any address works — the link goes to whatever you enter. If anything blocks
sign-in, contact us and we'll supply a one-time sign-in code via Resolution Center.

Contact: hello@plaindharma.com
```
