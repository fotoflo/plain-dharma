# Changelog

What changed in each release. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Weft writes this file as cards ship; a version bump moves Unreleased under the new version.

## [Unreleased]

### Added

- **A /buy page for the paperback, Kindle and Audible editions.** plaindharma.com/buy is a short link for emails, posts and print: the cover, buttons to the paperback and Kindle on Amazon and the audiobook on Audible, a link to leave a review, and pointers to the free formats. It is a real page, not a redirect, so tagged Amazon links never sit in an email. Main files: `src/app/buy/page.tsx`, `src/views/BuyView.tsx`, `src/lib/book-links.ts`.
- **Quote Shorts and reader testimonials on /assets.** The asset page now lists all 18 vertical quote videos (playable, each with its teaching, length and an MP4 download, plus a zip of all of them) and the reader testimonials from Romi Grossberg and Pim V., each with its Shorts card. Each Short carries VideoObject markup with its transcript, and /assets is now in the sitemap. `src/app/assets/page.tsx`, `src/content/testimonials.ts`, `src/content/shorts.json`.

### Changed

- **💬 /buy now sells the book.** A new headline, a reader's quote, the six teachings listed with a line each, three reasons to pick it up, and the buy buttons repeated at the end. A link goes to the reviews on Amazon; the review ask and the "every format is free" line sit at the bottom. `src/views/BuyView.tsx`

### Fixed

- **Kalama Sutra narration no longer switches voices mid-track.** The "Opening" of How to Decide What to Believe drifted into a different-sounding voice for about 20 seconds (the Buddha's reply). That section is re-voiced on the site (both speeds), in the M4B audiobook, the audio zip and the doubt Short. Every other English track checked clean. `public/audio/en/how-to-decide/manifest.json`, `scripts/master-english-audio.ts`.
