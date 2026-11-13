# Changelog

What changed in each release. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Weft writes this file as cards ship; a version bump moves Unreleased under the new version.

## [Unreleased]

### Added

- **A /buy page for the paperback, Kindle and Audible editions.** plaindharma.com/buy is a short link for emails, posts and print: the cover, buttons to the paperback and Kindle on Amazon and the audiobook on Audible, a link to leave a review, and pointers to the free formats. It is a real page, not a redirect, so tagged Amazon links never sit in an email. Main files: `src/app/buy/page.tsx`, `src/views/BuyView.tsx`, `src/lib/book-links.ts`.
