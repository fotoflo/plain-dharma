// The editor's public profiles — shared by the /author page and its Person
// JSON-LD (`sameAs`), so the two never drift.
export const AUTHOR_NAME = "Alex Miller";

export const AUTHOR_LINKS = [
  { label: "aimhuge.com", url: "https://aimhuge.com", note: "" },
  { label: "LinkedIn", url: "https://www.linkedin.com/in/aimiller/", note: "" },
  { label: "X", url: "https://x.com/fotoflo", note: " — @fotoflo" },
  {
    label: "Instagram",
    url: "https://www.instagram.com/fotofloster/",
    note: " — @fotofloster",
  },
] as const;
