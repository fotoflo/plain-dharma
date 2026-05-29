import type { Metadata } from "next";
import { getStrings } from "@plain-dharma/content/strings";
import { AboutView } from "@/views/AboutView";
import { ogBase } from "@/lib/og-meta";

const s = getStrings("en");
const TITLE = s.about.metadataTitle;
const DESCRIPTION = s.about.metadataDescription;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/about",
    languages: { "zh-Hans": "/zh/about" },
  },
  openGraph: {
    ...ogBase("en"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/about",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function AboutPage() {
  return <AboutView locale="en" />;
}
