import { DEFAULT_LOCALE, type Locale } from "@/content";

/**
 * Build a locale-aware URL path. EN routes live at the root (no prefix);
 * non-EN locales live under `/<locale>/...`. Pass `path` without leading
 * slash (e.g. "first-talk", "read", "about") OR with a leading slash
 * (we normalize). Pass "" for the locale's home page.
 */
export function localizedHref(locale: Locale, path: string = ""): string {
  const clean = path.replace(/^\/+/, "");
  if (locale === DEFAULT_LOCALE) {
    return clean === "" ? "/" : `/${clean}`;
  }
  return clean === "" ? `/${locale}` : `/${locale}/${clean}`;
}

/**
 * Derive the locale from a pathname like "/zh/first-talk" or "/first-talk".
 * Returns DEFAULT_LOCALE when no recognized locale prefix is present.
 */
export function getLocaleFromPathname(pathname: string): Locale {
  const seg = pathname.split("/").filter(Boolean)[0];
  if (seg === "zh") return "zh";
  return DEFAULT_LOCALE;
}

/**
 * Strip the locale prefix from a pathname, returning the "logical" path
 * shared across locales. "/zh/first-talk" → "/first-talk", "/about" → "/about".
 * Useful for the locale switcher.
 */
export function stripLocalePrefix(pathname: string): string {
  if (pathname.startsWith("/zh/")) return pathname.slice(3);
  if (pathname === "/zh") return "/";
  return pathname;
}

/**
 * Given the current pathname and a target locale, return the equivalent
 * path in the target locale. Used by the LocaleSwitcher.
 *
 * Example: switchLocalePath("/zh/first-talk", "en") → "/first-talk"
 * Example: switchLocalePath("/first-talk", "zh") → "/zh/first-talk"
 */
export function switchLocalePath(
  pathname: string,
  targetLocale: Locale,
): string {
  const logical = stripLocalePrefix(pathname);
  return localizedHref(targetLocale, logical);
}
