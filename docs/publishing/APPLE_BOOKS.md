# Apple Books publishing (EPUB, free)

Direct via **authors.apple.com → Publish → EPUB → Publishing Portal** (no aggregator).
Files: `dist/ebook/plain-dharma.epub`, `dist/ebook/plain-dharma-sample.epub`
(`pnpm build-ebook --sample`), `dist/ebook/cover-kindle.jpg`.

## One-time account setup (user must do these; they are legal/identity steps)

1. Create the **iTunes Connect account for Apple Books** (separate from App Store
   Connect; the same Apple Account can hold both). Without it the upload page says
   "your Apple ID must be associated with a content provider."
2. **Legal entity**: Business → Add a Legal Entity. Set up as an individual
   (Alex Miller), not Flexbike, Inc. — the entity shows as the seller.
3. **Free Books Agreement** must be Active. The Paid Books Agreement is only needed
   to charge money; skip it for a free book.
4. **EU Digital Services Act** declaration (Business → Complete Compliance
   Requirements) is required before submitting any *new* book. Answered "not a trader".

## Gotchas

- **No other stores in the text.** Apple rejects books that mention competing stores.
  `book-source.ts` no longer names Amazon/Audible; the sample's "Keep Reading" page
  also omits the Spotify audiobook link for the same reason.
- The upload form has no scripted file input in the built-in browser — attach the
  three files by hand.
- Contributors mirror KDP: Author `Gautama Buddha`, Translated by `Claude Opus`,
  Edited by `Alex Miller`. Publisher `Plain Dharma Press`, ISBN `978-1-891328-37-4`.
- Categories: Religion → Buddhism / Sacred Writings, Theravada, Rituals & Practice.
- Description = the KDP description minus the "every format lives free" sentence.
- Original publication date is optional; blank = release date. The first paperback
  went live 9 Jun 2026.
- "Upload Book to iTunes Connect" only uploads; price (Free) and territories are set
  afterwards in iTunes Connect → My Books.
