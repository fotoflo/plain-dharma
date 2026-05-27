import type { Metadata } from "next";
import { getStrings } from "@/content/strings";
import { AboutView } from "@/views/AboutView";

const s = getStrings("zh");
const TITLE = s.about.metadataTitle;
const DESCRIPTION = s.about.metadataDescription;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/about",
    languages: { en: "/about" },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/about",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function ZhAboutPage() {
  return <AboutView locale="zh" />;
}
