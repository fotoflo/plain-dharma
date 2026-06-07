import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Linking } from "react-native";

import { downloadUrl, type DownloadFormat } from "./links";

const MIME: Record<DownloadFormat, string> = {
  epub: "application/epub+zip",
  pdf: "application/pdf",
  m4b: "audio/mp4",
};

// Download the book file into the cache dir, then open the OS share sheet so the
// user can save to Files / open in Apple Books, etc. (the phone equivalent of a
// browser download). Falls back to the system browser if sharing is unavailable.
// `onProgress` reports a 0–1 fraction (or null when the server omits a length)
// so callers can show a determinate bar during the larger (18 MB M4B) download.
export async function deliverBookFile(
  format: DownloadFormat,
  onProgress?: (fraction: number | null) => void,
): Promise<void> {
  const dest = new File(Paths.cache, `plain-dharma.${format}`);
  if (dest.exists) dest.delete();
  const file = await File.downloadFileAsync(downloadUrl(format), dest, {
    onProgress: ({ bytesWritten, totalBytes }) =>
      onProgress?.(totalBytes > 0 ? bytesWritten / totalBytes : null),
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: MIME[format],
      dialogTitle: "Save Plain Dharma",
    });
  } else {
    await Linking.openURL(downloadUrl(format));
  }
}
