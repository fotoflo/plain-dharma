import type { Metadata } from "next";
import { getStrings } from "@plain-dharma/content/strings";
import { ReadView } from "@/views/ReadView";
import { ogBase } from "@/lib/og-meta";

const s = getStrings("en");
const TITLE = s.read.metadataTitle;
const DESCRIPTION = s.read.metadataDescription;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/read",
    languages: { "zh-Hans": "/zh/read" },
  },
  openGraph: {
    ...ogBase("en"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/read",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function ReadPage() {
  return <ReadView locale="en" />;
}
