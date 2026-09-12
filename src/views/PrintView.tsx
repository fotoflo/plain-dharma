import Link from "next/link";
import type { ReactNode } from "react";
import { assetDownloadUrl } from "@plain-dharma/content/assets";
import type { Locale } from "@/content";
import { Wash } from "@/components/Wash";
import { PrintSpecSheet } from "@/components/PrintSpecSheet";
import { PAGE } from "@/content/print-strings";
import spec from "@/content/printshop-spec.json";

const { trimMm, interior, covers } = spec;
const TRIM = `${trimMm.w} × ${trimMm.h} mm`;

const VARS = {
  pages: interior.pages,
  sheets: interior.sheets,
  trim: TRIM,
};

function fill(body: string): string {
  return body
    .replace(/\{pages\}/g, String(VARS.pages))
    .replace(/\{sheets\}/g, String(VARS.sheets))
    .replace(/\{trim\}/g, VARS.trim);
}

/**
 * Split a string on its single `{link}` placeholder and drop the anchor in.
 * Keeps link position translatable — Chinese puts it mid-clause where English
 * puts it at the end, and neither reads right if the anchor is hard-coded.
 */
function withLink(body: string, link: ReactNode): ReactNode {
  const [before, after = ""] = body.split("{link}");
  return (
    <>
      {before}
      {link}
      {after}
    </>
  );
}

function fmtMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FileCard({
  label,
  filename,
  meta,
  note,
  bytes,
}: {
  label: string;
  filename: string;
  meta: string;
  note: string;
  bytes: number;
}) {
  return (
    <a
      href={assetDownloadUrl(`downloads/${filename}`)}
      className="group block rounded-lg border border-divider bg-paper/40 p-6 transition-colors hover:border-link"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-2xl text-ink group-hover:text-link">
          {label}
        </h2>
        <span className="shrink-0 font-sans text-xs uppercase tracking-[0.14em] text-ink/50">
          {fmtMB(bytes)}
        </span>
      </div>
      <p className="mt-2 font-sans text-sm text-ink/70">{meta}</p>
      <p className="mt-3 font-serif text-base leading-relaxed text-ink/80">
        {note}
      </p>
    </a>
  );
}

export function PrintView({ locale }: { locale: Locale }) {
  const s = PAGE[locale];

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-12">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          {s.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          {s.title}
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink/80">
          {s.intro}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <FileCard
          label={s.interiorLabel}
          filename={interior.file}
          meta={fill(s.interiorMeta)}
          note={s.interiorNote}
          bytes={interior.bytes}
        />
        {covers && (
          <FileCard
            label={s.coversLabel}
            filename={covers.file}
            meta={s.coversMeta}
            note={s.coversNote}
            bytes={covers.bytes}
          />
        )}
      </section>

      {/* Opens in the reader's own language; the toggle covers Thai too, since
          that's where most of these get printed. */}
      <PrintSpecSheet vars={VARS} defaultLang={locale} />

      <article className="prose-dharma mt-16">
        <h2>{s.notesHeading}</h2>

        <p>
          <strong>{s.noteCountLead}</strong> {fill(s.noteCountBody)}
        </p>

        <p>
          <strong>{s.noteCoversLead}</strong> {fill(s.noteCoversBody)}
        </p>

        <p>
          <strong>{s.noteSizeLead}</strong> {s.noteSizeBody}
        </p>

        {/* /download and /remix have no ZH twins (see sitemap.ts) — the Stripe
            flow and the asset hub are EN-only, so both locales link to the EN
            route rather than a path that would 404. */}
        <h2>{s.homeHeading}</h2>
        <p>
          {withLink(
            s.homeBody,
            <Link href="/download">{s.homeLink}</Link>,
          )}
        </p>

        <h2>{s.remixHeading}</h2>
        <p>
          {withLink(
            s.remixBody,
            <Link href="/remix">{s.remixLink}</Link>,
          )}
        </p>
      </article>
    </div>
  );
}
