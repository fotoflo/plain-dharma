import * as WebBrowser from "expo-web-browser";
import { assetUrl } from "@plain-dharma/content/assets";

import { getClientId } from "./analytics";
import { SITE_ORIGIN } from "./site";

// Opens the web donate page ("pay what feels right") in an in-app browser — used
// for the general Support CTA (no file attached). Android/web only: App Review
// 3.1.1 requires iOS tips to go through IAP, so every iOS entry point to this
// is hidden or redirected. When `ref` is given we hide the site nav (so it
// reads as an embedded sheet) and tag the referrer; `cid` is the anonymous GA
// install id so the web funnel stitches to the same identity without any PII.
// The file download + "listen free" funnel uses the native /download/donate screen.
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

export type DownloadFormat = "pdf" | "m4b";

// Mirrors the web /download cards (title / size / blurb) so the native picker
// reads the same. The EPUB is intentionally NOT a free download — it's the
// Kindle edition (see AMAZON_KINDLE_URL below); only the PDF + audiobook are
// given away here.
export const DOWNLOADS: {
  format: DownloadFormat;
  title: string;
  size: string;
  description: string;
}[] = [
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

/** Coerce a route param to a valid format, defaulting to pdf. */
export function asDownloadFormat(raw: string | undefined | null): DownloadFormat {
  return raw === "m4b" ? "m4b" : "pdf";
}

// The EPUB is the Kindle edition, sold on Amazon. We don't sell it — Amazon
// does, and it sets its own price; the full book stays free here (CC0). Paste
// the real product URL once the KDP listing is live. An empty string hides the
// "available on Kindle" note in the download screen, so this is safe to ship
// before launch. Opening Amazon in the in-app browser keeps it an informational
// pointer, not an in-app purchase, so it stays App-Store-safe.
export const AMAZON_KINDLE_URL = ""; // e.g. "https://www.amazon.com/dp/B0XXXXXXXX"

export function openKindleStore(): Promise<unknown> {
  return WebBrowser.openBrowserAsync(AMAZON_KINDLE_URL);
}
