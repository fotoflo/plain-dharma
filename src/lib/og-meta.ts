import type { Locale } from "@/content";

export const SITE_NAME = "Plain Dharma";
export const SITE_URL = "https://plaindharma.com";
export const SITE_DESCRIPTION =
  "The Buddha's foundational teachings in modern English — free to read, hear, and keep. Ebook, audiobook, and a free app. Yours to copy, share, and reprint, no permission needed.";

/** CC0 1.0 / public domain — the project's license, surfaced to crawlers. */
export const LICENSE_URL =
  "https://creativecommons.org/publicdomain/zero/1.0/";

/**
 * Builds a page's `alternates` block (canonical + hreflang) from the EN path,
 * so every page advertises its language pair plus an `x-default` (→ EN) without
 * hand-writing the map each time.
 *
 * - `current` flips the canonical to that language's URL.
 * - `zh: false` for EN-only routes (e.g. /download — the Stripe carve-out).
 * - `th: true` for /print, the one route with a Thai twin. Thai isn't a site
 *   locale, so it's opt-in per route rather than on by default.
 */
export function altLanguages(
  enPath: string,
  opts: { zh?: boolean; th?: boolean; current?: Locale | "th" } = {},
): { canonical: string; languages: Record<string, string> } {
  const { zh = true, th = false, current = "en" } = opts;
  const enUrl = enPath;
  const zhUrl = enPath === "/" ? "/zh" : `/zh${enPath}`;
  const thUrl = enPath === "/" ? "/th" : `/th${enPath}`;
  const languages: Record<string, string> = { en: enUrl, "x-default": enUrl };
  if (zh) languages["zh-Hans"] = zhUrl;
  if (th) languages["th"] = thUrl;
  const canonical = current === "zh" ? zhUrl : current === "th" ? thUrl : enUrl;
  return { canonical, languages };
}

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
