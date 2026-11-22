# Changelog

What changed in each release. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Weft writes this file as cards ship; a version bump moves Unreleased under the new version.

## [Unreleased]

### Added

- **A /buy page for the paperback, Kindle and Audible editions.** plaindharma.com/buy is a short link for emails, posts and print: the cover, buttons to the paperback and Kindle on Amazon and the audiobook on Audible, a link to leave a review, and pointers to the free formats. It is a real page, not a redirect, so tagged Amazon links never sit in an email. Main files: `src/app/buy/page.tsx`, `src/views/BuyView.tsx`, `src/lib/book-links.ts`.
- **Quote Shorts and reader testimonials on /assets.** The asset page now lists all 18 vertical quote videos (playable, each with its teaching, length and an MP4 download, plus a zip of all of them) and the reader testimonials from Romi Grossberg and Pim V., each with its Shorts card. Each Short carries VideoObject markup with its transcript, and /assets is now in the sitemap. `src/app/assets/page.tsx`, `src/content/testimonials.ts`, `src/content/shorts.json`.
- **A /quotes page of real Buddha quotes, each with two shareable graphics.** plaindharma.com/quotes lists 23 lines from the six teachings, each word for word from the book (checked by `pnpm check-quotes`) and labelled with its Pāli Canon reference (SN 56.11, MN 10, AN 3.65…). Each quote has its own page, plaindharma.com/quotes/&lt;id&gt;, titled for search ("Buddha Quote on Letting Go: …"). Its link preview is the quote card, and it has two free 1080×1080 images: the parchment-and-illustration card, and a photo version with one of Alex's own Buddha photos behind the words. The posting skill alternates the two as an A/B test. The index adds a by-topic list, a "Popular quotes the Buddha never said" section pairing common fakes with real lines, and a short FAQ. For search engines: Quotation, ImageObject (licence data for Google Images' "Licensable" badge) and breadcrumb markup, all 46 images in the sitemap, and a "Quotes from this teaching" list on each sutta page. Main files: `src/content/quotes.ts`, `src/lib/quote-card.tsx`, `src/app/quotes/`, `src/views/QuotesView.tsx`.

### Changed

- **💬 /buy now sells the book.** A new headline, a reader's quote, the six teachings listed with a line each, three reasons to pick it up, and the buy buttons repeated at the end. A link goes to the reviews on Amazon; the review ask and the "every format is free" line sit at the bottom. `src/views/BuyView.tsx`

### Fixed

- **Kalama Sutra narration no longer switches voices mid-track.** The "Opening" of How to Decide What to Believe drifted into a different-sounding voice for about 20 seconds (the Buddha's reply). That section is re-voiced on the site (both speeds), in the M4B audiobook, the audio zip and the doubt Short. Every other English track checked clean. `public/audio/en/how-to-decide/manifest.json`, `scripts/master-english-audio.ts`.
