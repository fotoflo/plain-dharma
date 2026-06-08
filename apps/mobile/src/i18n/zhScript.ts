/**
 * Simplified ⇄ Traditional (繁體) conversion for the zh reading surface.
 *
 * The zh content/strings/manifests are authored in Simplified Chinese (简体) —
 * that's the canonical form, kept byte-compatible with the web + the Supabase
 * `marginalia` table. A reader can switch the *display* to Traditional (繁體);
 * we convert at render time with OpenCC rather than maintaining a second copy
 * of every sutta.
 *
 * Variant: `s2tw` (cn → Taiwan standard 正體). Character forms only, no phrase
 * localization — Taiwan is the bulk of the Traditional-reading Buddhist
 * audience, and keeping the wording identical matters for scripture. OpenCC's
 * s2tw is length-preserving (one char → one char) and round-trips losslessly,
 * which is what lets margin-note offsets/quotes stay aligned across scripts.
 *
 * OpenCC ships its dictionaries bundled (no network) so this works offline.
 * Converters are built lazily on first use — the dict is a few MB to parse, so
 * we don't pay for it unless a reader actually turns 繁體 on.
 */

import { Converter } from "opencc-js";

export type ChineseScript = "hans" | "hant";
export const CHINESE_SCRIPTS: ChineseScript[] = ["hans", "hant"];
export const DEFAULT_SCRIPT: ChineseScript = "hans";

type Convert = (text: string) => string;

let _toTrad: Convert | null = null;
let _toSimp: Convert | null = null;

/** Simplified → Traditional (Taiwan). */
function toTrad(text: string): string {
  _toTrad ??= Converter({ from: "cn", to: "tw" });
  return _toTrad(text);
}

/** Traditional → Simplified (back to the canonical form for storage). */
function toSimp(text: string): string {
  _toSimp ??= Converter({ from: "tw", to: "cn" });
  return _toSimp(text);
}

/**
 * Display form: convert to Traditional only when the reader is in zh + 繁體.
 * Non-Chinese text (en quotes, latin) passes through unchanged — OpenCC leaves
 * non-Han characters alone, so callers don't need to special-case locale.
 */
export function toDisplayScript(text: string, isHant: boolean): string {
  return isHant && text ? toTrad(text) : text;
}

/**
 * Canonical form: fold a Traditional selection back to Simplified before it's
 * stored/synced, so the marginalia store stays one script (web-compatible).
 */
export function toCanonicalScript(text: string, isHant: boolean): string {
  return isHant && text ? toSimp(text) : text;
}
