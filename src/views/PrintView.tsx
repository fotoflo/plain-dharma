import Link from "next/link";
import type { ReactNode } from "react";
import Image from "next/image";
import { assetDownloadUrl, assetUrl } from "@plain-dharma/content/assets";
import { Wash } from "@/components/Wash";
import { PrintSpecSheet } from "@/components/PrintSpecSheet";
import {
  PAGE,
  PRINT_LANGS,
  THAI_CLASS,
  type PrintLang,
} from "@/content/print-strings";
import {
  DEFAULT_EDITION,
  PRINTSHOP_EDITIONS,
  editionVars,
  type PrintshopEdition,
} from "@/content/printshop";

/** Substitute the `{placeholders}` an edition supplies. Leaves unknown ones be. */
function fill(body: string, vars: Record<string, string | number>): string {
  return body.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  );
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
  /** Null when the build had no honest measurement — show no size at all
   *  rather than "0.0 MB". See PrintshopFile in content/printshop.ts. */
  bytes: number | null;
}) {
  return (
    <a
      href={assetDownloadUrl(`downloads/${filename}`)}
      className="group block rounded-lg border border-divider bg-paper/40 p-6 transition-colors hover:border-link"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-serif text-2xl text-ink group-hover:text-link">
          {label}
        </h3>
        {bytes !== null && (
          <span className="shrink-0 font-sans text-xs uppercase tracking-[0.14em] text-ink/50">
            {fmtMB(bytes)}
          </span>
        )}
      </div>
      <p className="mt-2 font-sans text-sm text-ink/70">{meta}</p>
      <p className="mt-3 font-serif text-base leading-relaxed text-ink/80">
        {note}
      </p>
    </a>
  );
}

/** One trim: what it's for, then its two files. */
function Edition({
  edition,
  lang,
}: {
  edition: PrintshopEdition;
  lang: PrintLang;
}) {
  const s = PAGE[lang];
  const copy = s.editions[edition.key];
  const vars = editionVars(edition);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {/* A paper size reads the same in every language, so it comes from the
            spec rather than the copy — and it stays LTR-neutral next to Thai. */}
        <h2 className="font-serif text-3xl text-ink">{edition.label}</h2>
        <p className="font-sans text-xs uppercase tracking-[0.18em] text-link">
          {copy.tagline}
        </p>
        <p className="font-sans text-xs uppercase tracking-[0.14em] text-ink/40">
          {vars.trim}
        </p>
      </div>

      <p className="mt-3 max-w-2xl font-serif text-lg leading-relaxed text-ink/80">
        {copy.blurb}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FileCard
          label={s.interiorLabel}
          filename={edition.interior.file}
          meta={fill(s.interiorMeta, vars)}
          note={fill(s.interiorNote, vars)}
          bytes={edition.interior.bytes}
        />
        {edition.covers && (
          <FileCard
            label={s.coversLabel}
            filename={edition.covers.file}
            meta={fill(s.coversMeta, vars)}
            note={s.coversNote}
            bytes={edition.covers.bytes}
          />
        )}
      </div>
    </section>
  );
}

export function PrintView({ lang }: { lang: PrintLang }) {
  const s = PAGE[lang];
  // Thai isn't covered by Garamond Libre or Geist, so the whole page — not just
  // the spec card — takes the Thai face when this is /th/print.
  const thai = lang === "th";

  return (
    <div
      className={`relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20${
        thai ? ` ${THAI_CLASS}` : ""
      }`}
    >
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
            {s.eyebrow}
          </p>
          {/* Whole-page language switcher. The site nav and footer stay English
              on /th/print (Thai is this page only), so without this a Thai
              reader who lands on /print has no way across. */}
          <nav className="flex items-center gap-3 font-sans text-xs">
            {PRINT_LANGS.map(({ code, label, href }) =>
              code === lang ? (
                <span key={code} className="text-ink/40" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link
                  key={code}
                  href={href}
                  hrefLang={code === "zh" ? "zh-Hans" : code}
                  className={`text-link hover:text-accent${
                    code === "th" ? ` ${THAI_CLASS}` : ""
                  }`}
                >
                  {label}
                </Link>
              ),
            )}
          </nav>
        </div>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          {s.title}
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink/80">
          {s.intro}
        </p>
      </header>

      <div className="border-t border-divider pt-10">
        <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-ink/50">
          {s.editionsHeading}
        </h2>
        <p className="mt-3 max-w-2xl font-serif text-lg leading-relaxed text-ink/80">
          {s.editionsIntro}
        </p>
      </div>

      {/* Picked before anything else on the page: which size. The trims differ
          by more than their numbers suggest, and nobody holds a millimetre in
          their head — so show the same page at all three, to scale. The image
          carries no words, so it serves all three languages; the printable
          sheet below it is true size, with a 100mm bar to check the print by. */}
      <figure className="mt-10">
        <Image
          src={assetUrl("downloads/plain-dharma-print-sizes.jpg")}
          alt={s.sizesAlt}
          width={2000}
          height={1077}
          sizes="(min-width: 768px) 46rem, 100vw"
          className="w-full rounded-lg"
        />
        <figcaption className="mt-3 font-serif text-base text-ink/60">
          {s.sizesCaption}{" "}
          <a
            className="underline underline-offset-4 hover:text-ink"
            href={assetDownloadUrl("downloads/plain-dharma-print-sizes.pdf")}
          >
            {s.sizesSheetLink}
          </a>
        </figcaption>
      </figure>

      {PRINTSHOP_EDITIONS.map((edition) => (
        <Edition key={edition.key} edition={edition} lang={lang} />
      ))}

      {/* Opens in the reader's own language and on the size listed first; the
          toggle covers Thai too, since that's where most of these get printed. */}
      <PrintSpecSheet
        editions={PRINTSHOP_EDITIONS}
        defaultEdition={DEFAULT_EDITION.key}
        defaultLang={lang}
      />

      <article className="prose-dharma mt-16">
        <h2>{s.notesHeading}</h2>

        <p>
          <strong>{s.noteCountLead}</strong> {s.noteCountBody}
        </p>

        <p>
          <strong>{s.noteCoversLead}</strong> {s.noteCoversBody}
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
