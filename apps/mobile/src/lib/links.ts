import * as WebBrowser from "expo-web-browser";
import { assetUrl } from "@plain-dharma/content/assets";

import { getClientId } from "./analytics";
import { SITE_ORIGIN } from "./site";

// Opens the web donate page ("pay what feels right") in an in-app browser — used
// for the general Support CTA (no file attached). Content is CC0/free, so this
// stays App-Store-compliant (no in-app purchase; any payment happens off-app on
// the website). When `ref` is given we hide the site nav (so it reads as an
// embedded sheet) and tag the referrer; `cid` is the anonymous GA install id so
// the web funnel stitches to the same identity without any PII. The file
// download + "listen free" funnel uses the native /download/donate screen.
export async function openDonate(opts: { ref?: string } = {}): Promise<unknown> {
  const parts: string[] = [];
  if (opts.ref) {
    parts.push(`ref=app_${encodeURIComponent(opts.ref)}`);
    parts.push("hide_nav=true");
  }
  try {
    parts.push(`cid=${encodeURIComponent(await getClientId())}`);
  } catch {
    // No id available — proceed without stitching.
  }
  const qs = parts.length ? `?${parts.join("&")}` : "";
  return WebBrowser.openBrowserAsync(`${SITE_ORIGIN}/download/donate${qs}`);
}

// "Contribute" opens the web contribute page (copy editors / translators / voice
// artists + the contact form) in an in-app browser — the form lives server-side
// (Resend), so we link out rather than re-implement it natively.
export function openContribute(): Promise<unknown> {
  return WebBrowser.openBrowserAsync(`${SITE_ORIGIN}/contribute`);
}

export type DownloadFormat = "epub" | "pdf" | "m4b";

// Mirrors the web /download cards (title / size / blurb) so the native picker
// reads the same.
export const DOWNLOADS: {
  format: DownloadFormat;
  title: string;
  size: string;
  description: string;
}[] = [
  {
    format: "epub",
    title: "EPUB",
    size: "451 KB",
    description: "For Kindle, Apple Books, Kobo, and other e-readers.",
  },
  {
    format: "pdf",
    title: "PDF",
    size: "725 KB",
    description: "For tablet or laptop reading, 6×9 typeset.",
  },
  {
    format: "m4b",
    title: "Audiobook",
    size: "18 MB",
    description:
      "Narrated edition with chapter markers. ~38 minutes. M4B opens in Apple Books, VLC, or any audiobook player.",
  },
];

export function downloadUrl(format: DownloadFormat): string {
  return assetUrl(`downloads/plain-dharma.${format}`);
}

/** Coerce a route param to a valid format, defaulting to epub. */
export function asDownloadFormat(raw: string | undefined | null): DownloadFormat {
  return raw === "pdf" || raw === "m4b" ? raw : "epub";
}
