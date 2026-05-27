import type { Metadata } from "next";
import { HomeView } from "@/views/HomeView";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: { "zh-Hans": "/zh" },
  },
  openGraph: { url: "/" },
};

export default function HomePage() {
  return <HomeView locale="en" />;
}
