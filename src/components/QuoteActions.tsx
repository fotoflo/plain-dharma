"use client";

import { useState } from "react";

const CHIP =
  "inline-flex items-center rounded-full border border-divider px-3 py-1.5 font-sans text-xs text-ink/80 no-underline hover:border-accent hover:text-ink hover:no-underline";

/**
 * Copy / image / video buttons under a quote. Copy puts the quote, its source
 * and its link on the clipboard, ready to paste into a post.
 */
export function QuoteActions({
  id,
  text,
  source,
  videoUrl,
}: {
  id: string;
  text: string;
  source: string;
  videoUrl?: string;
}) {
  const [copied, setCopied] = useState<"text" | "link" | null>(null);
  const url = `https://plaindharma.com/quotes/${id}`;

  async function copy(kind: "text" | "link") {
    const value =
      kind === "text" ? `“${text}”\n— The Buddha, ${source}\n${url}` : url;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      window.prompt("Copy this:", value);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => copy("text")} className={CHIP}>
        {copied === "text" ? "Copied ✓" : "Copy quote"}
      </button>
      <button type="button" onClick={() => copy("link")} className={CHIP}>
        {copied === "link" ? "Copied ✓" : "Copy link"}
      </button>
      <a href={`/quotes/${id}/buddha-quote.png`} download={`buddha-quote-${id}.png`} className={CHIP}>
        Image
      </a>
      <a href={`/quotes/${id}/buddha-quote-photo.png`} download={`buddha-quote-${id}-photo.png`} className={CHIP}>
        Photo image
      </a>
      {videoUrl && (
        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className={CHIP}>
          Video
        </a>
      )}
    </div>
  );
}
