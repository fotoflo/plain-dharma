import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { themeInitScript } from "@/components/ThemeToggle";
import { readingPrefsInitScript } from "@/components/ReadingControls";
import { NightSky } from "@/components/NightSky";
import Marginalia from "@/components/marginalia/Marginalia";
import { SITE_URL, SITE_DESCRIPTION, ogBase } from "@/lib/og-meta";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA_ENABLED = process.env.NODE_ENV === "production" && Boolean(GA_ID);

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Plain Dharma",
    template: "%s · Plain Dharma",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    ...ogBase("en"),
    type: "website",
    url: SITE_URL,
    title: "Plain Dharma",
    description: SITE_DESCRIPTION,
    // Image is supplied by src/app/opengraph-image.tsx (file-based convention).
  },
  twitter: {
    card: "summary_large_image",
    title: "Plain Dharma",
    description: SITE_DESCRIPTION,
    // X / Slack / Discord fall back to og:image when twitter:image is unset.
  },
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
      <head suppressHydrationWarning>
        {/* Theme FOUC-prevention — must run before paint */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Reading preferences FOUC-prevention — reads all three localStorage
            keys (size, contrast, font) and applies all three HTML classes in
            one synchronous pass before React hydrates. */}
        <script dangerouslySetInnerHTML={{ __html: readingPrefsInitScript }} />
      </head>
      <body suppressHydrationWarning className={`min-h-full flex flex-col ${atkinson.variable}`}>
        <NightSky />
        <Header />
        <main className="flex-1" data-mn-scope>
          {children}
        </main>
        {/* Margin Notes layer — global so highlights/notes work on every page's
            reading content (titles, preface, prose, drops). Mounted outside
            <main> so its own fixed UI sits outside the annotatable scope. */}
        <Marginalia />
        <Footer />
        {GA_ENABLED && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
