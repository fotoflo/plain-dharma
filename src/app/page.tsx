import type { Metadata } from "next";
import { HomeView } from "@/views/HomeView";
import {
  ogBase,
  altLanguages,
  SITE_NAME,
  SITE_DESCRIPTION,
} from "@/lib/og-meta";

export const metadata: Metadata = {
  alternates: altLanguages("/"),
  openGraph: {
    ...ogBase("en"),
    type: "website",
    url: "/",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default function HomePage() {
  return <HomeView locale="en" />;
}
