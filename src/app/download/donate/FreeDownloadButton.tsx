"use client";

import { useRef, useState } from "react";

function filenameFromHref(href: string): string {
  try {
    const path = new URL(href).pathname;
    return decodeURIComponent(path.split("/").pop() || "plain-dharma");
  } catch {
    return "plain-dharma";
  }
}

// The free download, made obvious and honest about what it's doing. Instead of a
// silent cross-origin <a download> (which just sits there until the file lands),
// we stream the file with fetch + a ReadableStream, show a determinate progress
// bar against Content-Length, then hand the assembled Blob to a temporary
// anchor. The Supabase CDN sends `access-control-allow-origin: *`, so the read
// is allowed. Anything unexpected (old browser, CORS hiccup) falls back to a
// plain navigation — the original behaviour, never worse.
export function FreeDownloadButton({
  href,
  label,
  fallbackBytes,
}: {
  href: string;
  label: string;
  fallbackBytes?: number | null;
}) {
  const [pct, setPct] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const startedRef = useRef(false);

  async function run() {
    if (startedRef.current) return;
    startedRef.current = true;
    setBusy(true);
    setPct(0);
    try {
      const res = await fetch(href);
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const total = Number(res.headers.get("content-length")) || fallbackBytes || 0;
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) setPct(Math.min(1, received / total));
      }
      const blob = new Blob(chunks as BlobPart[]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filenameFromHref(href);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setPct(1);
    } catch {
      // Fall back to letting the browser handle the download the old way.
      window.location.href = href;
    } finally {
      setBusy(false);
      startedRef.current = false;
      window.setTimeout(() => setPct(null), 1500);
    }
  }

  const text = busy
    ? pct != null
      ? `Downloading… ${Math.round(pct * 100)}%`
      : "Downloading…"
    : label;

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      aria-label={label}
      className="relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-ink/30 px-6 py-3 font-sans text-base font-medium text-ink transition hover:border-accent hover:text-accent disabled:cursor-wait sm:w-auto"
    >
      {pct != null && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 bg-accent/15 transition-[width] duration-150 ease-out"
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      )}
      <span className="relative flex items-center gap-2">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
        </svg>
        {text}
      </span>
    </button>
  );
}
