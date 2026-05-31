import type { Metadata } from "next";
import { getStrings } from "@plain-dharma/content/strings";
import { PrivacyView } from "@/views/PrivacyView";
import { ogBase } from "@/lib/og-meta";

const s = getStrings("en");
const TITLE = s.privacy.metadataTitle;
const DESCRIPTION = s.privacy.metadataDescription;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/privacy",
    languages: { "zh-Hans": "/zh/privacy" },
  },
  openGraph: {
    ...ogBase("en"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/privacy",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function PrivacyPage() {
  return <PrivacyView locale="en" />;
}
