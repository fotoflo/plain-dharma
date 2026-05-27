import type { Metadata } from "next";
import { getStrings } from "@/content/strings";
import { GlossaryView } from "@/views/GlossaryView";

const s = getStrings("zh");
const TITLE = s.nav.glossary;
// NOTE: There is no localized glossary description in strings.ts yet.
// We reuse the EN description until a `glossary` section is added.
const DESCRIPTION =
  "Key terms in plain English, with the Pali / Sanskrit where it matters.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/glossary",
    languages: { en: "/glossary" },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/glossary",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function ZhGlossaryPage() {
  return <GlossaryView locale="zh" />;
}
