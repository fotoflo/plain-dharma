import type { Metadata } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { themeInitScript } from "@/components/ThemeToggle";
import { readingPrefsInitScript } from "@/components/ReadingControls";
import { NightSky } from "@/components/NightSky";

const garamond = localFont({
  src: [
    { path: "./fonts/GaramondLibre-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/GaramondLibre-Italic.otf", weight: "400", style: "italic" },
    { path: "./fonts/GaramondLibre-Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/GaramondLibre-BoldItalic.otf", weight: "700", style: "italic" },
  ],
  variable: "--font-garamond",
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-accessible",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Plain Dharma",
    template: "%s · Plain Dharma",
  },
  description:
    "The Buddha's foundational teachings in plain modern English. Free, CC0, for anyone.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${garamond.variable} ${GeistSans.variable} h-full antialiased`}
    >
      <head>
        {/* Theme FOUC-prevention — must run before paint */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Reading preferences FOUC-prevention — reads all three localStorage
            keys (size, contrast, font) and applies all three HTML classes in
            one synchronous pass before React hydrates. */}
        <script dangerouslySetInnerHTML={{ __html: readingPrefsInitScript }} />
      </head>
      <body className={`min-h-full flex flex-col ${atkinson.variable}`}>
        <NightSky />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
