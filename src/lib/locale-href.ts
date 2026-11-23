import { DEFAULT_LOCALE, SUTTAS, type Locale } from "@/content";

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
  // /th is NOT a site locale — it exists only for /th/print, the URL handed to
  // Thai copy shops. It still has to be stripped here, or the header's locale
  // switcher turns /th/print into /zh/th/print, which 404s.
  if (pathname.startsWith("/th/")) return pathname.slice(3);
  if (pathname === "/th") return "/";
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
  if (targetLocale !== DEFAULT_LOCALE && !hasZhTwin(logical)) {
    return localizedHref(targetLocale, "");
  }
  return localizedHref(targetLocale, logical);
}

/**
 * The pages under src/app/zh/: a few static routes plus one page per sutta.
 * Many EN pages have no ZH twin (/download, /quotes, /remix, /buy, /author,
 * /<sutta>/source, /<sutta>/compare …). Without this check the switcher sent
 * those to /zh/<same path>, which 404s, and Google crawled the 404s.
 */
const ZH_STATIC = new Set(["read", "about", "privacy", "print", "contribute", "glossary"]);

function hasZhTwin(logicalPath: string): boolean {
  const segs = logicalPath.split("/").filter(Boolean);
  if (segs.length === 0) return true;
  if (segs.length > 1) return false;
  const [seg] = segs;
  return ZH_STATIC.has(seg) || (SUTTAS as readonly string[]).includes(seg);
}
