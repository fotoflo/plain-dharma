import { statSync } from "node:fs";
import { join } from "node:path";
import type { Locale, SuttaSlug } from "@/content";

/**
 * Real last-modified date for a sutta, taken from its MDX source mtime, so the
 * sitemap and Article structured data both report genuine change dates from a
 * single source of truth.
 *
 * Server/build-only (uses `fs`). The MDX lives in the content workspace package
 * (`packages/content/<locale>/<slug>.mdx`) — not `src/content`, which is a
 * loader shim. Falls back to "now" if the file can't be stat'd.
 */
export function suttaMtime(slug: SuttaSlug, locale: Locale): Date {
  try {
    return statSync(
      join(process.cwd(), "packages", "content", locale, `${slug}.mdx`),
    ).mtime;
  } catch {
    return new Date();
  }
}
