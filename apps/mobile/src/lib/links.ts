import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

import { SITE_ORIGIN } from "./site";

// Donations open the web Stripe Checkout in an in-app browser — content is
// CC0/free, so this stays App-Store-compliant (no in-app purchase).
export function openDonate(): Promise<unknown> {
  return WebBrowser.openBrowserAsync(`${SITE_ORIGIN}/download/donate`);
}

export type DownloadFormat = "epub" | "pdf" | "m4b";

export const DOWNLOADS: { format: DownloadFormat; label: string }[] = [
  { format: "epub", label: "eBook (EPUB)" },
  { format: "pdf", label: "PDF" },
  { format: "m4b", label: "Audiobook (M4B)" },
];

export function downloadUrl(format: DownloadFormat): string {
  return `${SITE_ORIGIN}/downloads/plain-dharma.${format}`;
}

// Open the file URL in the system browser so the OS handles download/preview
// (simpler + more reliable than a file-system fetch; the files are public).
export function openDownload(format: DownloadFormat): Promise<unknown> {
  return Linking.openURL(downloadUrl(format));
}
