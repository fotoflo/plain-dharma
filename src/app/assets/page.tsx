import Link from "next/link";
import type { Metadata } from "next";
import { SUTTAS, getMeta, type SuttaSlug } from "@plain-dharma/content";
import {
  assetUrl,
  assetDownloadUrl,
  assetSize,
  hasAsset,
  listAssets,
} from "@plain-dharma/content/assets";
import { getIllustrationUrl } from "@/content/illustrations";
import { Wash } from "@/components/Wash";
import { ogBase, altLanguages } from "@/lib/og-meta";

const TITLE = "Assets";
const DESCRIPTION =
  "Every Plain Dharma asset in one place — all 80 narration tracks (standard and fast), the source illustrations, and the book downloads. Public domain, playable and downloadable.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: altLanguages("/assets", { zh: false }),
  openGraph: {
    ...ogBase("en"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/assets",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

// ── data (built statically from the committed asset version map) ─────────────

type Track = { num: string; name: string; url: string };
type AudioGroup = {
  slug: string;
  title: string;
  pali?: string;
  ordinal?: number;
  standard: Track[];
  fast: Track[];
};

const FRAMING: Record<string, string> = {
  _frontmatter: "Front Matter",
  _closing: "Closing",
  _colophon: "Colophon",
};

/** "02-the-four-noble-truths.mp3" → { num: "02", name: "The Four Noble Truths" } */
function trackLabel(file: string): { num: string; name: string } {
  const base = file.replace(/\.mp3$/, "");
  const m = base.match(/^(\d+[a-z]?)-(.*)$/);
  const num = m ? m[1] : "";
  const raw = m ? m[2] : base;
  const name = raw.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { num, name };
}

function buildAudioGroups(): AudioGroup[] {
  const mp3 = listAssets("audio/en/").filter((k) => k.endsWith(".mp3"));
  const bySlug = new Map<string, { standard: Track[]; fast: Track[] }>();
  for (const key of mp3) {
    const seg = key.split("/"); // audio, en, <slug>, [fast], file
    const slug = seg[2];
    const isFast = seg[3] === "fast";
    const file = seg[seg.length - 1];
    const { num, name } = trackLabel(file);
    if (!bySlug.has(slug)) bySlug.set(slug, { standard: [], fast: [] });
    bySlug.get(slug)![isFast ? "fast" : "standard"].push({
      num,
      name,
      url: assetUrl(key),
    });
  }
  const order = ["_frontmatter", ...SUTTAS, "_closing", "_colophon"];
  const byNum = (a: Track, b: Track) =>
    a.num.localeCompare(b.num, undefined, { numeric: true });
  let ordinal = 0;
  return order
    .filter((slug) => bySlug.has(slug))
    .map((slug) => {
      const g = bySlug.get(slug)!;
      g.standard.sort(byNum);
      g.fast.sort(byNum);
      const framing = slug.startsWith("_");
      if (!framing) ordinal += 1;
      const meta = framing ? undefined : getMeta("en", slug as SuttaSlug);
      return {
        slug,
        title: framing ? FRAMING[slug] : meta!.title,
        pali: framing ? undefined : meta!.pali_name,
        ordinal: framing ? undefined : ordinal,
        standard: g.standard,
        fast: g.fast,
      };
    });
}

type Download = { title: string; note: string; href: string; size: string };

function fmtSize(path: string): string {
  const b = assetSize(path);
  if (!b) return "";
  return b >= 1_048_576
    ? `${(b / 1_048_576).toFixed(1)} MB`
    : `${Math.round(b / 1024)} KB`;
}

function buildDownloads(): Download[] {
  const items: [string, string, string][] = [
    ["downloads/plain-dharma.pdf", "PDF", "6×9 typeset, color"],
    ["downloads/plain-dharma-print-bw.pdf", "Print PDF (B&W)", "For plain printers"],
    ["downloads/plain-dharma-print-color.pdf", "Print PDF (color)", "6×9 with bleed"],
    ["downloads/plain-dharma.epub", "EPUB", "Kindle / e-reader"],
    ["downloads/plain-dharma.m4b", "Audiobook (M4B)", "Chaptered, ~38 min"],
    ["downloads/plain-dharma-text.zip", "Text bundle", "All MDX source"],
    ["downloads/plain-dharma-audio-en.zip", "Audio bundle (EN)", "All English mp3s"],
    ["downloads/plain-dharma-cover.jpg", "Front cover", "JPG"],
    ["downloads/plain-dharma-back-cover.jpg", "Back cover", "JPG"],
  ];
  return items
    .filter(([path]) => hasAsset(path))
    .map(([path, title, note]) => ({
      title,
      note,
      href: assetDownloadUrl(path),
      size: fmtSize(path),
    }));
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const groups = buildAudioGroups();
  const downloads = buildDownloads();
  const totalTracks = groups.reduce(
    (n, g) => n + g.standard.length + g.fast.length,
    0,
  );

  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-14">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          Assets
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Everything, in one place
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink/80">
          All {totalTracks} narration tracks — a <strong>standard</strong>{" "}
          (meditative pace) and a <strong>fast</strong> cut of every section —
          plus the source art and the book files. Everything is{" "}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-accent"
          >
            public domain
          </a>
          . To grab it in bundles for reuse, see the{" "}
          <Link href="/remix" className="text-link hover:text-accent">
            remix page
          </Link>
          .
        </p>
      </header>

      {/* AUDIO */}
      <section className="mb-16">
        <h2 className="mb-6 font-serif text-2xl text-ink">Audio · {totalTracks} tracks</h2>
        <div className="space-y-5">
          {groups.map((g) => (
            <div
              key={g.slug}
              className="rounded-lg border border-divider/80 p-5 sm:p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                {g.ordinal != null && (
                  <span className="flex size-8 flex-none items-center justify-center rounded-full bg-accent-strong/15 font-serif font-semibold text-accent-strong">
                    {g.ordinal}
                  </span>
                )}
                <div>
                  <h3 className="font-serif text-lg text-ink">{g.title}</h3>
                  {g.pali && (
                    <p className="font-sans text-xs italic text-ink/55">
                      {g.pali}
                    </p>
                  )}
                </div>
                <span className="ml-auto font-sans text-xs text-ink/50">
                  {g.standard.length + g.fast.length} files
                </span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <TrackColumn label="Standard" tracks={g.standard} />
                {g.fast.length > 0 && (
                  <TrackColumn label="Fast" tracks={g.fast} />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ILLUSTRATIONS */}
      <section className="mb-16">
        <h2 className="mb-6 font-serif text-2xl text-ink">
          Illustrations · {SUTTAS.length}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {SUTTAS.map((slug) => (
            <a
              key={slug}
              href={assetDownloadUrl(`illustrations/${slug}.png`)}
              download
              className="group overflow-hidden rounded-lg border border-divider/80 no-underline"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getIllustrationUrl(slug as SuttaSlug)}
                alt={getMeta("en", slug as SuttaSlug).title}
                width={512}
                height={512}
                loading="lazy"
                className="aspect-square w-full bg-paper object-contain transition group-hover:scale-[1.02]"
              />
              <p className="px-3 py-2 font-sans text-xs text-ink/70">
                {getMeta("en", slug as SuttaSlug).title}
              </p>
            </a>
          ))}
        </div>
        <p className="mt-3 font-sans text-xs text-ink/50">
          Dark-mode variants also exist per sutta. Tap any image to download the
          PNG.
        </p>
      </section>

      {/* DOWNLOADS */}
      <section className="mb-16">
        <h2 className="mb-6 font-serif text-2xl text-ink">The book · downloads</h2>
        <ul className="divide-y divide-divider/70 overflow-hidden rounded-lg border border-divider/80">
          {downloads.map((d) => (
            <li
              key={d.href}
              className="flex items-center gap-4 px-5 py-3.5"
            >
              <div className="min-w-0">
                <p className="font-serif text-base text-ink">{d.title}</p>
                <p className="font-sans text-xs text-ink/55">{d.note}</p>
              </div>
              <span className="ml-auto font-sans text-xs tabular-nums text-ink/50">
                {d.size}
              </span>
              <a
                href={d.href}
                download
                className="flex-none rounded-full border border-accent-strong px-4 py-1.5 font-sans text-xs font-medium text-accent-strong no-underline transition hover:bg-accent-strong/5"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="text-center">
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

function TrackColumn({ label, tracks }: { label: string; tracks: Track[] }) {
  return (
    <div>
      <h4 className="mb-2 border-b border-divider/70 pb-1 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink/55">
        {label}
      </h4>
      <ul className="space-y-2.5">
        {tracks.map((t) => (
          <li key={t.url}>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-sm font-semibold tabular-nums text-accent-strong">
                {t.num || "•"}
              </span>
              <span className="font-sans text-sm text-ink/85">{t.name}</span>
            </div>
            <audio
              controls
              preload="none"
              src={t.url}
              className="mt-1 h-9 w-full"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
