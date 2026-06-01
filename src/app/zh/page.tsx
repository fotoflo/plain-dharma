import type { Metadata } from "next";
import { HomeView } from "@/views/HomeView";
import { getStrings } from "@plain-dharma/content/strings";
import { ogBase, altLanguages, SITE_NAME } from "@/lib/og-meta";

const s = getStrings("zh");

export const metadata: Metadata = {
  description: s.home.heroSubtitle,
  alternates: altLanguages("/", { current: "zh" }),
  openGraph: {
    ...ogBase("zh"),
    type: "website",
    url: "/zh",
    title: SITE_NAME,
    description: s.home.heroSubtitle,
  },
};

export default function ZhHomePage() {
  return <HomeView locale="zh" />;
}
