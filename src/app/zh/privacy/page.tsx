import type { Metadata } from "next";
import { getStrings } from "@plain-dharma/content/strings";
import { PrivacyView } from "@/views/PrivacyView";
import { ogBase } from "@/lib/og-meta";

const s = getStrings("zh");
const TITLE = s.privacy.metadataTitle;
const DESCRIPTION = s.privacy.metadataDescription;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/privacy",
    languages: { en: "/privacy" },
  },
  openGraph: {
    ...ogBase("zh"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/privacy",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function ZhPrivacyPage() {
  return <PrivacyView locale="zh" />;
}
