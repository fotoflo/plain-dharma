import type { Metadata } from "next";
import { HomeView } from "@/views/HomeView";

export const metadata: Metadata = {
  alternates: {
    canonical: "/zh",
    languages: { en: "/" },
  },
  openGraph: { url: "/zh" },
};

export default function ZhHomePage() {
  return <HomeView locale="zh" />;
}
