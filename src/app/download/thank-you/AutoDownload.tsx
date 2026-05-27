"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const FILE_LABELS: Record<string, { label: string; href: string }> = {
  epub: { label: "EPUB",      href: "/downloads/plain-dharma.epub" },
  pdf:  { label: "PDF",       href: "/downloads/plain-dharma.pdf" },
  m4b:  { label: "Audiobook", href: "/downloads/plain-dharma.m4b" },
};

export function AutoDownload() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("file");
  const file = slug && FILE_LABELS[slug] ? FILE_LABELS[slug] : null;

  useEffect(() => {
    if (!file) return;
    // Auto-trigger the download after a brief delay so the user sees the
    // thank-you message first. Browser's own download manager handles the rest.
    const timer = setTimeout(() => {
      window.location.href = file.href;
    }, 1200);
    return () => clearTimeout(timer);
  }, [file]);

  if (!file) {
    return (
      <div className="text-center">
        <p className="font-serif text-base text-ink/80">
          Pick which edition you&rsquo;d like:
        </p>
        <div className="mt-6 flex justify-center gap-4">
          {Object.entries(FILE_LABELS).map(([key, info]) => (
            <a
              key={key}
              href={info.href}
              download
              className="inline-flex items-center rounded-full bg-accent-strong px-5 py-2.5 font-sans text-sm font-medium text-white no-underline shadow-sm transition hover:no-underline hover:opacity-90"
            >
              Download {info.label}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <p className="font-serif text-base text-ink/80">
        Your <strong>{file.label}</strong> download should start in a moment.
      </p>
      <div>
        <a
          href={file.href}
          download
          className="inline-flex items-center rounded-full bg-accent-strong px-6 py-3 font-sans text-base font-medium text-white no-underline shadow-sm transition hover:no-underline hover:opacity-90"
        >
          Download {file.label} now
        </a>
      </div>
      <p className="font-serif text-sm text-ink/60">
        Didn&rsquo;t start?{" "}
        <a
          href={file.href}
          download
          className="text-link underline-offset-4 hover:underline"
        >
          Click here
        </a>
        .
      </p>
      <div className="pt-6">
        <Link
          href="/read"
          className="font-sans text-sm text-link hover:text-accent"
        >
          Read on the web →
        </Link>
      </div>
    </div>
  );
}
