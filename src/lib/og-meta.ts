import type { Locale } from "@/content";

export const SITE_NAME = "Plain Dharma";
export const SITE_URL = "https://plaindharma.com";
export const SITE_DESCRIPTION =
  "The Buddha's foundational teachings in plain modern English. Free, CC0, for anyone.";

const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  zh: "zh_CN",
};

/**
 * Open Graph fields shared by every page. Next.js shallow-merges the
 * `openGraph` object, so a page that declares its own block REPLACES the root
 * layout's entirely — `siteName`/`locale` are silently dropped unless each page
 * re-declares them. Spread `ogBase(locale)` into a page's `openGraph` to keep
 * the emitted OG set complete and consistent across locales.
 */
export function ogBase(locale: Locale): { siteName: string; locale: string } {
  return { siteName: SITE_NAME, locale: OG_LOCALE[locale] };
}
