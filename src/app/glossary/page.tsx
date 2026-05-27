import type { Metadata } from "next";
import { GlossaryView } from "@/views/GlossaryView";

const TITLE = "Glossary";
const DESCRIPTION =
  "Key terms in plain English, with the Pali / Sanskrit where it matters.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/glossary",
    languages: { "zh-Hans": "/zh/glossary" },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/glossary",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function GlossaryPage() {
  return <GlossaryView locale="en" />;
}
