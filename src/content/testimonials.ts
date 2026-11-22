/**
 * Reader testimonials, quoted with permission. The home page carries Romi's;
 * /assets lists them all, with the Shorts back card made from each.
 */
export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  /** Link for the role, when there is one. */
  href?: string;
  /** Bucket path of the 1080×1920 Shorts back card made from this quote. */
  card: string;
  /** Where it came from, for our own records. */
  source: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "romi",
    quote:
      "I picked up the book to have a look, and I unintentionally read the whole thing. I really enjoyed it and found it very soothing.",
    name: "Romi Grossberg",
    role: "author of Hip Hop & Hope",
    href: "https://www.romigrossberg.com/",
    card: "downloads/shorts/cards/reader-romi.png",
    source: "Message to Alex",
  },
  {
    id: "pim",
    quote:
      "Normally I’m a very rational person, not easy to convince. Reading this book, I found a calmness that comforted me in ways I never expected.",
    name: "Pim V.",
    role: "reader",
    card: "downloads/shorts/cards/reader-pim.png",
    source: "Message to Alex, 8 Oct 2026 (excerpted and lightly edited, with permission)",
  },
];
