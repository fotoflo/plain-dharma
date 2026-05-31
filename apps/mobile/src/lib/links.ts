import * as WebBrowser from "expo-web-browser";

import { SITE_ORIGIN } from "./site";

// General "Support" donation (no file attached) opens the web Stripe Checkout in
// an in-app browser — content is CC0/free, so this stays App-Store-compliant
// (no in-app purchase). The file-download donate flow lives in app/download/.
export function openDonate(): Promise<unknown> {
  return WebBrowser.openBrowserAsync(`${SITE_ORIGIN}/download/donate`);
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
  return `${SITE_ORIGIN}/downloads/plain-dharma.${format}`;
}

/** Coerce a route param to a valid format, defaulting to epub. */
export function asDownloadFormat(raw: string | undefined | null): DownloadFormat {
  return raw === "pdf" || raw === "m4b" ? raw : "epub";
}
