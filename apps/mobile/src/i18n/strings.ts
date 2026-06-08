/**
 * Locale + script aware UI strings. `getStrings(locale)` from the content
 * package returns the canonical (Simplified, for zh) copy; this hook renders it
 * in the reader's chosen script so app chrome matches the 繁體 reading toggle.
 *
 * Deep-converts every string in the table when the reader is in zh + 繁體;
 * otherwise returns the canonical object as-is (no allocation, no conversion).
 * Use this instead of getStrings(locale) anywhere chrome text is shown.
 */

import { getStrings } from "@plain-dharma/content/strings";
import { useMemo } from "react";

import { useZhConvert } from "./LocaleContext";
import { useLocale } from "./LocaleContext";

function deepConvert<T>(value: T, convert: (s: string) => string): T {
  if (typeof value === "string") return convert(value) as T;
  if (Array.isArray(value))
    return value.map((v) => deepConvert(v, convert)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key in value as Record<string, unknown>) {
      out[key] = deepConvert((value as Record<string, unknown>)[key], convert);
    }
    return out as T;
  }
  return value;
}

/** The UI string table for the active locale, in the active script. */
export function useStrings(): ReturnType<typeof getStrings> {
  const { locale } = useLocale();
  const { isHant, toDisplay } = useZhConvert();
  return useMemo(
    () => (isHant ? deepConvert(getStrings(locale), toDisplay) : getStrings(locale)),
    [locale, isHant, toDisplay],
  );
}
