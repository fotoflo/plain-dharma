/**
 * Server-only publishing fill-sheet for the KDP + Bowker forms.
 *
 * This module is imported ONLY by the PIN-gated `/api/private` route — it is
 * never bundled into the client. The values are the settled, copy-paste-ready
 * inputs reconciled in `docs/publishing/KDP_PUBLISHING.md` and
 * `docs/publishing/BOWKER_REVIEW.md`. Keep the two in sync: those docs are the
 * source of truth, this is the operator-facing rendering of them.
 */

export type Field = {
  label: string;
  /** Copy-paste value. Empty string renders as a non-copyable note via `note`. */
  value?: string;
  /** Explanatory aside shown under the value, not copied. */
  note?: string;
  /** Render the value in a multi-line block (e.g. the Description). */
  multiline?: boolean;
};

export type Section = {
  heading: string;
  intro?: string;
  fields: Field[];
};

const DESCRIPTION = `Six of the Buddha's foundational teachings, rendered in plain modern English — clear enough to read in an afternoon, faithful enough to take seriously.

This is not a scholarly translation bristling with Pali and footnotes. It is a plain reading: the same teachings working scholars have translated for decades, set down in everyday language so a first-time reader can actually follow them — without watering down the substance.

Inside:

1. The Buddha's First Talk (Dhammacakkappavattana) — the middle path, the four noble truths, and the eightfold way to live.
2. The Buddha's Second Talk: Not-Self (Anattalakkhana) — why the body, feelings, perceptions, and even awareness aren't you.
3. The Fire Sermon (Adittapariyaya) — everything is on fire; what is burning, and how to cool down.
4. On Loving-Kindness (Metta) — hold the wish that every living thing, without exception, be at ease.
5. The Foundations of Mindfulness (Satipatthana) — watch the body, feelings, mind, and experience clearly.
6. How to Decide What to Believe (Kalama) — don't take anything on authority; test it for yourself.

Each teaching opens with a one-line distillation and a simple illustration, and the book closes with a Sources & Further Reading appendix pointing to the rigorous scholarly translations (SuttaCentral, Access to Insight, Bhikkhu Bodhi) behind every plain-English rendering.

Released into the public domain under CC0 1.0. Copy it, print it, translate it, give it away — no permission needed, no attribution required, in keeping with the Buddhist tradition of free dharma distribution. Every format lives free at plaindharma.com.

A note on how it was made: the plain-English rendering was drafted with AI from the original Pāli, then refined by hand — argued out line by line, word by word, against the 2,600-year-old text. The full story is at plaindharma.com/how-it-was-made.`;

export const SECTIONS: Section[] = [
  {
    heading: "KDP — Kindle eBook · Details",
    intro:
      "kdp.amazon.com → + Create → Kindle eBook. Fields in form order.",
    fields: [
      { label: "Language", value: "English" },
      { label: "Book Title", value: "Plain Dharma" },
      {
        label: "Subtitle",
        value: "The Buddha's Foundational Teachings in Modern English",
      },
      { label: "Series", value: "", note: "Leave blank." },
      { label: "Edition number", value: "1" },
      { label: "Primary Author or Contributor — First", value: "Gautama" },
      {
        label: "Primary Author or Contributor — Last",
        value: "Buddha",
        note: "The KDP primary field is 'Author OR Contributor' — you are NOT forced to call yourself the author. Put the source attribution here (catalog convention for translated scripture). The teachings are the Buddha's (public domain); your English rendering is your copyright — which is exactly the 'I own the copyright' rights answer. Bonus: 'Gautama Buddha' is a real Amazon author entity (discoverability).",
      },
      {
        label: "Contributor — Role",
        value: "Translator",
        note: "Use the Contributors role dropdown. Optionally Add Another as 'Editor' to mirror Bowker — or keep just Translator for a cleaner 'Gautama Buddha · Translated by Alex Miller' byline.",
      },
      { label: "Contributor — First", value: "Alex" },
      { label: "Contributor — Last", value: "Miller" },
      { label: "Description", value: DESCRIPTION, multiline: true },
      {
        label: "Categories (pick 3)",
        value:
          "Religion & Spirituality › Buddhism › Sacred Writings\nReligion & Spirituality › Buddhism › Theravada\nReligion & Spirituality › Buddhism › Rituals & Practice",
        multiline: true,
      },
      { label: "Keyword 1", value: "buddhist suttas plain english" },
      { label: "Keyword 2", value: "pali canon teachings" },
      { label: "Keyword 3", value: "buddhism for beginners" },
      { label: "Keyword 4", value: "four noble truths" },
      { label: "Keyword 5", value: "mindfulness satipatthana" },
      { label: "Keyword 6", value: "loving kindness metta" },
      { label: "Keyword 7", value: "public domain dharma" },
      {
        label: "Pre-order",
        value: "Release my book for sale now",
      },
    ],
  },
  {
    heading: "KDP — Kindle eBook · Content & Pricing",
    fields: [
      {
        label: "Manuscript file",
        value: "dist/ebook/plain-dharma.epub",
      },
      {
        label: "Cover file",
        value: "dist/ebook/cover-kindle.jpg",
        note: "1600×2560 — Kindle's ideal 1.6:1, cream-padded, with the 'translated by Alex Miller' byline. (The 6×9 cover.jpg feeds the PDF cover page, EPUB interior, and audiobook art.)",
      },
      {
        label: "Publishing rights",
        value: "I own the copyright and I hold the necessary publishing rights",
        note: "Rights-holder statement, not an authorship credit. 'Public domain work' triggers price caps + duplicate-content rejection.",
      },
      {
        label: "AI disclosure — Images",
        value: "Yes — AI-generated images (Gemini)",
        note: "Interior illustrations + cover artwork. Note the image count.",
      },
      {
        label: "AI disclosure — Text / Translation",
        value: "Yes — AI-generated text/translation, human-edited",
        note: "Drafted with AI from the Pāli, then refined by hand — which /how-it-was-made already says publicly. Disclosure is never shown to buyers; under-disclosing risks account action.",
      },
      {
        label: "Kindle eBook ISBN",
        value: "",
        note: "Leave blank — not required for Kindle.",
      },
      {
        label: "KDP Select",
        value: "No / unchecked",
        note: "Exclusivity conflicts with the free EPUB on plaindharma.com.",
      },
      { label: "Territories", value: "All territories (worldwide)" },
      { label: "Royalty plan", value: "70%" },
      { label: "List price (USD)", value: "4.99" },
      { label: "Book Lending", value: "Allow (checked)" },
    ],
  },
  {
    heading: "KDP — Paperback",
    intro:
      "Open the eBook on your Bookshelf → 'Create Paperback' so the editions auto-link. Details mirror the Kindle screen (same title, subtitle, Author caveat, description, categories, keywords, rights choice).",
    fields: [
      {
        label: "ISBN",
        value: "978-1-891328-38-1",
        note: "Your own Bowker ISBN for the paperback (distinct from ebook …-37-4). Choose 'I have my own ISBN' — do NOT take a free KDP ISBN.",
      },
      {
        label: "Publication date",
        value: "",
        note: "Leave blank — uses approval date.",
      },
      {
        label: "Ink & Paper",
        value:
          "Color → Premium color, white paper · B&W → Black & white, cream paper",
      },
      { label: "Trim size", value: "5 x 8 in" },
      {
        label: "Bleed",
        value: "Bleed (PDF has bleed)",
        note: "Interiors are 5.25 × 8.25 in.",
      },
      { label: "Cover finish", value: "Matte" },
      {
        label: "Interior file (color)",
        value: "dist/kdp/plain-dharma-kdp-interior-color.pdf",
        note: "Or -bw.pdf to match the paper choice. Cover-free, as KDP requires.",
      },
      {
        label: "Wraparound cover file (color)",
        value: "dist/kdp/plain-dharma-kdp-cover-color.pdf",
        note: "Use -bw.pdf for the B&W interior (spine sized for cream caliper). Skip KDP Cover Creator — upload this PDF directly.",
      },
      {
        label: "List price (USD)",
        value: "",
        note: "Set to the minimum KDP displays (color print on 48pp sets a ~$4–6 floor). Paperbacks can't be free.",
      },
    ],
  },
  {
    heading: "Bowker — EPUB ISBN record (978-1-891328-37-4)",
    intro:
      "myidentifiers.com. The settled ONIX values. Enter as-is.",
    fields: [
      { label: "Title", value: "Plain Dharma" },
      {
        label: "Subtitle",
        value: "The Buddha's Foundational Teachings in Modern English",
      },
      {
        label: "Language",
        value: "English only",
        note: "Leave Mandarin unchecked — it's a separate edition needing its own ISBN.",
      },
      { label: "Copyright year", value: "2026" },
      {
        label: "Alex Miller — functions",
        value:
          "Translated with commentary by · Compiled by · Editor · Cover Design by",
        note: "Do NOT check 'Author' — it overstates the relationship to 2,500-year-old source material.",
      },
      { label: "Ellen — function", value: "Cover Design by (only)" },
      {
        label: "Publisher",
        value: "Visual Language LLC dba Alphagram Learning Materials",
      },
      { label: "Imprint", value: "Plain Dharma Press" },
      { label: "Medium", value: "E-Book" },
      {
        label: "Format",
        value: "Electronic book text",
        note: "Not 'Digital online' (that means online-only access).",
      },
      { label: "eBook File Type", value: "EPUB" },
      { label: "eBook File Size", value: "802 KB" },
      { label: "First Genre", value: "BUDDHISM" },
      { label: "Second Genre", value: "DEVOTIONAL LITERATURE" },
      {
        label: "Target Audience",
        value: "Trade",
        note: "Not 'Adult Education' (implies classroom/curriculum).",
      },
      { label: "Title Status", value: "Active Record" },
      {
        label: "Currency / Price / Type",
        value: "US Dollars / 4.99 / Retail Price",
      },
      { label: "Price Availability", value: "Available" },
      { label: "Sales Rights", value: "World rights / World territory" },
    ],
  },
];
