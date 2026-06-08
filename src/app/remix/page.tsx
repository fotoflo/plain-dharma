import Link from "next/link";
import type { Metadata } from "next";
import { assetDownloadUrl, assetSize } from "@plain-dharma/content/assets";
import { Wash } from "@/components/Wash";
import { SuttaIllustration } from "@/components/SuttaIllustration";
import { ogBase, altLanguages } from "@/lib/og-meta";
import {
  SUTTAS,
  SUPPORTED_LOCALES,
  getMeta,
  type Locale,
  type SuttaSlug,
} from "@/content";
import { getAudioManifest, type AudioManifest } from "@/content/audio";
import {
  getIllustrationUrl,
  getIllustrationDarkUrl,
} from "@/content/illustrations";

const TITLE = "Remix & reuse";
const DESCRIPTION =
  "Every asset, free to take. Audio stems track by track, the source art, and the plain-text source — all public domain. Remix it, reuse it, no permission needed.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: altLanguages("/remix", { zh: false }),
  openGraph: {
    ...ogBase("en"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/remix",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const GITHUB_URL = "https://github.com/fotoflo/plain-dharma";
const CC0_URL = "https://creativecommons.org/publicdomain/zero/1.0/";

const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

/**
 * Size label for an offsite (CDN) asset, read from the committed version map —
 * no local file needed. Returns null when the asset hasn't been uploaded yet so
 * the caller can hide the size.
 */
function cdnSize(relPath: string): string | null {
  const bytes = assetSize(relPath);
  return bytes == null ? null : fmtBytes(bytes);
}

/** Force a save-as on an already-resolved CDN media URL (e.g. a track). */
function asDownload(url: string): string {
  return url.includes("?") ? `${url}&download` : `${url}?download`;
}

export default async function RemixPage() {
  // Pull every per-sutta audio manifest for both locales at build time.
  const audio = await Promise.all(
    SUPPORTED_LOCALES.map(async (locale) => ({
      locale,
      zipSize: cdnSize(`downloads/plain-dharma-audio-${locale}.zip`),
      suttas: (
        await Promise.all(
          SUTTAS.map(async (slug) => ({
            slug,
            title: getMeta(locale, slug).title,
            manifest: await getAudioManifest(locale, slug),
          }))
        )
      ).filter((s): s is AudioByLocaleSutta => s.manifest !== null),
    }))
  );

  const originalsArtSize = cdnSize("illustrations/originals.zip");

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-12">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          Remix &amp; reuse
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Take it and make something
        </h1>
        <p className="mt-6 font-serif text-lg leading-relaxed text-ink/80">
          Everything here is{" "}
          <a href={CC0_URL} target="_blank" rel="noopener noreferrer">
            public domain
          </a>
          . DJs, sample it. Artists, repaint it. Translators, carry it into a new
          language. Teachers, print it. No permission, no attribution, no asking
          — the stems are below.
        </p>
      </header>

      {/* Soft cross-link: this page is for taking; /contribute is for giving back. */}
      <p className="mb-14 rounded-lg border border-divider/80 bg-paper/40 px-5 py-4 font-sans text-sm leading-relaxed text-ink/75">
        You don&apos;t owe anything for any of this. But if you&apos;d rather
        your work live <em>here</em> — a sharper translation, a human-voiced
        reading — there&apos;s a way to{" "}
        <Link href="/contribute" className="text-link hover:text-accent">
          send it back
        </Link>
        .
      </p>

      {/* ───────── Audio ───────── */}
      <Section
        title="Audio, track by track"
        blurb="Narrated MP3s for every section of every teaching — clean source for a mix, a meditation app, a podcast bed. Pull a single track, or grab a whole language as one zip."
      >
        <div className="space-y-8">
          {audio.map(({ locale, zipSize, suttas }) =>
            suttas.length === 0 ? null : (
              <div key={locale}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-sans text-xs uppercase tracking-[0.18em] text-ink/55">
                    {LOCALE_LABEL[locale]}
                  </h3>
                  {zipSize && (
                    <a
                      href={assetDownloadUrl(
                        `downloads/plain-dharma-audio-${locale}.zip`
                      )}
                      className="font-sans text-sm text-link hover:text-accent"
                    >
                      Download all {LOCALE_LABEL[locale]} tracks
                      <span className="text-ink/40"> · {zipSize}</span>
                    </a>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  {suttas.map(({ slug, title, manifest }) => (
                    <SuttaTracks
                      key={`${locale}-${slug}`}
                      title={title}
                      manifest={manifest}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
        <p className="mt-6 font-sans text-sm text-ink/65">
          The full narrated audiobook (M4B, chaptered) lives on the{" "}
          <Link href="/download" className="text-link hover:text-accent">
            download page
          </Link>
          .
        </p>
      </Section>

      {/* ───────── Art ───────── */}
      <Section
        title="The art"
        blurb="One ink illustration per teaching, each with a dark-mode variant. Transparent PNGs — drop them on anything. The full-resolution Gemini originals are in the zip."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {SUTTAS.map((slug) => (
            <ArtCard key={slug} slug={slug} title={getMeta("en", slug).title} />
          ))}
        </div>
        <div className="mt-6">
          <DownloadButton href={assetDownloadUrl("illustrations/originals.zip")}>
            All source art — originals.zip
          </DownloadButton>
          {originalsArtSize && (
            <span className="ml-3 font-sans text-xs uppercase tracking-wider text-ink/45">
              {originalsArtSize}
            </span>
          )}
        </div>
      </Section>

      {/* ───────── Text ───────── */}
      <Section
        title="The text"
        blurb="The plain-English (and Mandarin) source, as Markdown. Retypeset it, fork the translation, feed it to a model, set it to music. This is the canonical source the whole site is built from."
      >
        <div className="space-y-6">
          {SUPPORTED_LOCALES.map((locale) => (
            <div key={locale}>
              <h3 className="font-sans text-xs uppercase tracking-[0.18em] text-ink/55">
                {LOCALE_LABEL[locale]}
              </h3>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {SUTTAS.map((slug) => (
                  <li key={`${locale}-${slug}`}>
                    <a
                      href={assetDownloadUrl(
                        `downloads/text/${locale}/${slug}.mdx`
                      )}
                      className="font-sans text-sm text-link hover:text-accent"
                    >
                      {getMeta(locale, slug).title}
                      <span className="text-ink/40"> .mdx</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <DownloadButton href={assetDownloadUrl("downloads/plain-dharma-text.zip")}>
            All text — plain-dharma-text.zip
          </DownloadButton>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-sm text-link hover:text-accent"
          >
            or browse the source on GitHub →
          </a>
        </div>
      </Section>

      {/* ───────── Book formats ───────── */}
      <Section
        title="Finished editions"
        blurb="Prefer something ready to read or hand out? The typeset EPUB, PDF, and the chaptered audiobook are on the download page — same free, public-domain terms."
      >
        <DownloadButton href="/download" plain>
          Go to downloads →
        </DownloadButton>
      </Section>

      {/* ───────── License ───────── */}
      <article className="prose-dharma mt-16">
        <h2>The license, plainly</h2>
        <p>
          All of it — text, audio, art — is released under{" "}
          <a href={CC0_URL} target="_blank" rel="noopener noreferrer">
            CC0 1.0
          </a>
          , the closest thing to public domain. You can copy, remix, translate,
          perform, print, and sell what you make. You don&apos;t need our
          permission and you don&apos;t need to credit us — though a link back is
          always kind. Nothing here is owned, and nothing you make from it has to
          be either.
        </p>
      </article>

      {/* ───────── Cross-link: send it back ───────── */}
      <section className="mt-12 rounded-lg border border-divider/80 p-6">
        <h2 className="font-serif text-2xl text-ink">Made something?</h2>
        <p className="mt-2 font-serif text-base leading-relaxed text-ink/80">
          We&apos;d genuinely love to see it — and if you want your work to
          become part of Plain Dharma itself, the door is open.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm">
          <Link href="/contribute" className="text-link hover:text-accent">
            Contribute it back →
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-accent"
          >
            Open a pull request on GitHub →
          </a>
        </div>
      </section>

      <div className="mt-16 text-center">
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

type AudioByLocaleSutta = {
  slug: SuttaSlug;
  title: string;
  manifest: AudioManifest;
};

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14">
      <h2 className="font-serif text-2xl text-ink sm:text-3xl">{title}</h2>
      <p className="mt-2 font-serif text-base leading-relaxed text-ink/75">
        {blurb}
      </p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function SuttaTracks({
  title,
  manifest,
}: {
  title: string;
  manifest: AudioManifest;
}) {
  return (
    <details className="group rounded-lg border border-divider/80 px-5 py-3 open:pb-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-ink marker:content-none">
        <span>{title}</span>
        <span className="font-sans text-xs uppercase tracking-wider text-ink/45">
          {manifest.sections.length} tracks
          <span className="ml-2 inline-block transition-transform group-open:rotate-90">
            ›
          </span>
        </span>
      </summary>
      <ul className="mt-3 space-y-1.5 border-t border-divider/50 pt-3">
        {manifest.sections.map((section) => (
          <li
            key={section.id}
            className="flex items-baseline justify-between gap-4"
          >
            <a
              href={asDownload(section.file)}
              className="font-sans text-sm text-link hover:text-accent"
            >
              {section.title}
            </a>
            <span className="font-sans text-xs tabular-nums text-ink/45">
              {fmtDuration(section.duration_sec)}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function ArtCard({ slug, title }: { slug: SuttaSlug; title: string }) {
  return (
    <div className="rounded-lg border border-divider/80 p-4">
      <div className="flex items-center justify-center rounded-md bg-paper/40 py-4">
        <SuttaIllustration
          slug={slug}
          alt={title}
          width={160}
          height={160}
          className="h-32 w-32 object-contain"
          sizes="128px"
        />
      </div>
      <p className="mt-3 font-serif text-base text-ink">{title}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 font-sans text-sm">
        <a
          href={getIllustrationUrl(slug)}
          download
          className="text-link hover:text-accent"
        >
          PNG
        </a>
        <a
          href={getIllustrationDarkUrl(slug)}
          download
          className="text-link hover:text-accent"
        >
          dark PNG
        </a>
      </div>
    </div>
  );
}

function DownloadButton({
  href,
  children,
  plain,
}: {
  href: string;
  children: React.ReactNode;
  plain?: boolean;
}) {
  const className = plain
    ? "inline-flex items-center font-sans text-sm text-link hover:text-accent"
    : "inline-flex items-center rounded-full bg-accent-strong px-6 py-2.5 font-sans text-sm font-medium text-white no-underline shadow-sm transition hover:no-underline hover:opacity-90";
  return (
    <a href={href} download={!plain} className={className}>
      {children}
    </a>
  );
}
