"use client";

import { useState } from "react";
import { downloadZip } from "client-zip";

/**
 * Bundle an arbitrary set of CDN assets into a zip in the browser.
 *
 * Why client-side: the site is a static export with no server, and pre-building
 * a zip per group would roughly double what the bucket stores (mp3s don't
 * compress) for files most visitors never take. The bucket serves
 * `access-control-allow-origin: *`, so the browser can fetch the objects and
 * `client-zip` streams them into a zip with no compression pass.
 *
 * Large sets stream straight to disk via the File System Access API when the
 * browser has it; otherwise the zip is buffered as a Blob, which is fine for the
 * per-group sets and merely memory-hungry for a whole book.
 */
export type ZipFile = { url: string; name: string };

export function ZipDownload({
  files,
  filename,
  bytes,
  label = "Download all",
}: {
  files: ZipFile[];
  filename: string;
  bytes: number;
  label?: string;
}) {
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = done !== null;

  const size =
    bytes >= 1_048_576
      ? `${(bytes / 1_048_576).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`;

  async function run() {
    setError(null);
    setDone(0);
    try {
      // Ask for the destination BEFORE any fetching — the picker needs to be
      // inside the user-gesture task or Safari/Chrome reject it.
      let handle: FileSystemFileHandle | undefined;
      const picker = (
        window as unknown as {
          showSaveFilePicker?: (o: unknown) => Promise<FileSystemFileHandle>;
        }
      ).showSaveFilePicker;
      if (picker) {
        try {
          handle = await picker({
            suggestedName: filename,
            types: [
              { description: "Zip archive", accept: { "application/zip": [".zip"] } },
            ],
          });
        } catch {
          setDone(null); // user cancelled the save dialog
          return;
        }
      }

      let n = 0;
      async function* entries() {
        for (const f of files) {
          const res = await fetch(f.url);
          if (!res.ok) throw new Error(`${f.name}: ${res.status}`);
          yield { name: f.name, input: res, lastModified: new Date(0) };
          setDone(++n);
        }
      }

      const zipped = downloadZip(entries());

      if (handle) {
        await zipped.body!.pipeTo(await handle.createWritable());
      } else {
        const blob = await zipped.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDone(null);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded-full border border-accent-strong px-3 py-1 font-sans text-xs font-medium text-accent-strong transition hover:bg-accent-strong/5 disabled:opacity-60"
      >
        {busy
          ? `Zipping ${done}/${files.length}…`
          : `${label} (${files.length} files, ${size})`}
      </button>
      {error && (
        <span className="font-sans text-xs text-ink/55" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
