import Link from "next/link";
import type { Metadata } from "next";
import {
  SUTTAS,
  getMeta,
  type SuttaSlug,
  type Locale,
} from "@plain-dharma/content";
import {
  assetUrl,
  assetDownloadUrl,
  assetSize,
  hasAsset,
  listAssets,
} from "@plain-dharma/content/assets";
import {
  getArchiveGroups,
  archiveTotals,
  formatDuration,
  type ArchiveGroup,
} from "@plain-dharma/content/archive";
import { getIllustrationUrl } from "@/content/illustrations";
import { ZipDownload, type ZipFile } from "@/components/ZipDownload";
import { Wash } from "@/components/Wash";
import { ogBase, altLanguages } from "@/lib/og-meta";

const TITLE = "Assets";
const DESCRIPTION =
  "Every Plain Dharma asset in one place, grouped by what it is — the English book and the Mandarin book, each with its downloads, its narration, and every earlier take that was replaced along the way. Plus the source illustrations. All public domain, playable and downloadable.";

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

// ── shapes ───────────────────────────────────────────────────────────────────

type Track = { num: string; name: string; url: string };
type Column = { label: string; tracks: Track[] };
/** One sutta's worth of tracks — the unit both live and archived audio render as. */
type SuttaCard = {
  slug: string;
  title: string;
  pali?: string;
  ordinal?: number;
  columns: Column[];
};
type Download = { title: string; note: string; href: string; size: string };

const FRAMING: Record<string, string> = {
  _frontmatter: "Front Matter",
  _closing: "Closing",
  _colophon: "Colophon",
};

const VARIANT_LABEL: Record<string, string> = {
  standard: "Standard",
  fast: "Fast",
  master: "Un-stretched master",
  takes: "Takes",
};

const CANONICAL_ORDER = ["_frontmatter", ...SUTTAS, "_closing", "_colophon"];

function fmtBytes(b: number): string {
  return b >= 1_048_576
    ? `${(b / 1_048_576).toFixed(1)} MB`
    : `${Math.round(b / 1024)} KB`;
}

function fmtSize(path: string): string {
  const b = assetSize(path);
  return b ? fmtBytes(b) : "";
}

/** "02-the-four-noble-truths.mp3" → { num: "02", name: "The Four Noble Truths" } */
function trackLabel(file: string): { num: string; name: string } {
  const base = file.replace(/\.mp3$/, "");
  const m = base.match(/^(\d+[a-z]?)-(.*)$/);
  const raw = m ? m[2] : base;
  // Title-casing is a no-op on Chinese, so zh names pass through intact.
  return {
    num: m ? m[1] : "",
    name: raw.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

/** "first-talk-title" → "First Talk Title" */
function prettySlug(slug: string): string {
  return slug
    .replace(/^_/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const byNum = (a: Track, b: Track) =>
  (a.num || a.name).localeCompare(b.num || b.name, undefined, { numeric: true });

/**
 * Assemble sutta cards in canonical order. Slugs outside SUTTAS (framing tracks,
 * or the orphaned `first-talk-title`) keep a slot at the end rather than being
 * dropped — this page's job is to show everything that exists.
 */
function toSuttaCards(
  locale: Locale,
  bySlug: Map<string, Column[]>
): SuttaCard[] {
  const extras = [...bySlug.keys()]
    .filter((s) => !CANONICAL_ORDER.includes(s))
    .sort();
  let ordinal = 0;
  return [...CANONICAL_ORDER, ...extras]
    .filter((slug) => bySlug.has(slug))
    .map((slug) => {
      const isSutta = (SUTTAS as readonly string[]).includes(slug);
      if (isSutta) ordinal += 1;
      const meta = isSutta ? getMeta(locale, slug as SuttaSlug) : undefined;
      return {
        slug,
        title: meta?.title ?? FRAMING[slug] ?? prettySlug(slug),
        pali: meta?.pali_name,
        ordinal: isSutta ? ordinal : undefined,
        columns: bySlug
          .get(slug)!
          .filter((c) => c.tracks.length > 0)
          .map((c) => ({ ...c, tracks: [...c.tracks].sort(byNum) })),
      };
    });
}

/**
 * Bucket paths → zip entries, with the shared leading directory stripped so a
 * group's zip opens as `first-talk/01-opening.mp3` rather than a deep nest.
 * Mixed-prefix sets (a whole book) share nothing, so they keep full paths.
 */
function toZip(paths: string[]): { files: ZipFile[]; bytes: number } {
  const segs = paths.map((p) => p.split("/"));
  let common = 0;
  while (
    segs.length > 0 &&
    segs.every((s) => s.length > common + 1 && s[common] === segs[0][common])
  ) {
    common += 1;
  }
  return {
    files: paths.map((p, i) => ({
      url: assetUrl(p),
      name: segs[i].slice(common).join("/"),
    })),
    bytes: paths.reduce((n, p) => n + (assetSize(p) ?? 0), 0),
  };
}

/** A zip download for a set of bucket paths, or null when there's nothing to zip. */
function zipFor(paths: string[], filename: string, label?: string) {
  if (paths.length < 2) return null;
  const { files, bytes } = toZip(paths);
  return { files, bytes, filename, label };
}

// ── data: what's live ────────────────────────────────────────────────────────

/** The narration currently on the site, for one locale. */
function liveNarration(locale: Locale): SuttaCard[] {
  const bySlug = new Map<string, Column[]>();
  for (const key of listAssets(`audio/${locale}/`).filter((k) =>
    k.endsWith(".mp3")
  )) {
    const seg = key.split("/"); // audio, <locale>, <slug>, [fast], file
    const slug = seg[2];
    const isFast = seg[3] === "fast";
    if (!bySlug.has(slug))
      bySlug.set(slug, [
        { label: "Standard", tracks: [] },
        { label: "Fast", tracks: [] },
      ]);
    bySlug.get(slug)![isFast ? 1 : 0].tracks.push({
      ...trackLabel(seg[seg.length - 1]),
      url: assetUrl(key),
    });
  }
  return toSuttaCards(locale, bySlug);
}

const DOWNLOADS: Record<Locale, [string, string, string][]> = {
  en: [
    ["downloads/plain-dharma.pdf", "PDF", "6×9 typeset, color"],
    ["downloads/plain-dharma-print-bw.pdf", "Print PDF (B&W)", "For plain printers"],
    ["downloads/plain-dharma-print-color.pdf", "Print PDF (color)", "6×9 with bleed"],
    ["downloads/plain-dharma.epub", "EPUB", "Kindle / e-reader"],
    ["downloads/plain-dharma.m4b", "Audiobook (M4B)", "Chaptered, ~38 min"],
    ["downloads/plain-dharma-audio-en.zip", "Audio bundle", "Every English mp3"],
    ["downloads/plain-dharma-text.zip", "Text bundle", "All MDX source, both languages"],
    ["downloads/plain-dharma-cover.jpg", "Front cover", "JPG"],
    ["downloads/plain-dharma-back-cover.jpg", "Back cover", "JPG"],
    ["downloads/plain-dharma-book-photo.png", "Book photo", "PNG, transparent"],
    ["downloads/plain-dharma-book-photo-dark.png", "Book photo (dark)", "PNG, transparent"],
  ],
  zh: [
    ["downloads/plain-dharma-audio-zh.zip", "Audio bundle", "Every Mandarin mp3"],
    ["downloads/plain-dharma-text.zip", "Text bundle", "All MDX source, both languages"],
  ],
};

function downloadsFor(locale: Locale): Download[] {
  return DOWNLOADS[locale]
    .filter(([path]) => hasAsset(path))
    .map(([path, title, note]) => ({
      title,
      note,
      href: assetDownloadUrl(path),
      size: fmtSize(path),
    }));
}

// ── data: what was replaced ──────────────────────────────────────────────────

/** Archive groups for one book, newest first. */
function archiveFor(locale: Locale): ArchiveGroup[] {
  return getArchiveGroups()
    .filter((g) => (g.locale ?? "en") === locale)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** An archive group's playable items, reshaped into the same sutta cards. */
function archiveSuttaCards(group: ArchiveGroup): SuttaCard[] {
  // Playable only — a notes file that rides along with a group's takes carries
  // a slug too, but it belongs in the write-up link, not in a track column.
  const tracks = group.items.filter(
    (i) => i.slug && /\.(mp3|m4b)$/.test(i.path)
  );
  if (tracks.length === 0) return [];

  const bySlug = new Map<string, Column[]>();
  for (const i of tracks) {
    // Items with no variant, or named by keyword rather than numbered (the zh
    // auditions), collect under one "Takes" column.
    const key = i.variant && i.num ? i.variant : "takes";
    const cols = bySlug.get(i.slug!) ?? [];
    let col = cols.find((c) => c.label === VARIANT_LABEL[key]);
    if (!col) {
      col = { label: VARIANT_LABEL[key] ?? key, tracks: [] };
      cols.push(col);
    }
    col.tracks.push({
      num: i.num ?? "",
      name: i.name ?? i.label,
      url: assetUrl(i.path),
    });
    bySlug.set(i.slug!, cols);
  }
  return toSuttaCards(group.locale ?? "en", bySlug);
}

// ── page ─────────────────────────────────────────────────────────────────────

const BOOKS: { locale: Locale; title: string; blurb: string }[] = [
  {
    locale: "en",
    title: "The English book",
    blurb:
      "The book as it stands, then every earlier version of it — newest first.",
  },
  {
    locale: "zh",
    title: "The Mandarin book · 中文",
    blurb:
      "The Mandarin narration, and the auditions that decided whose voice reads it.",
  },
];

export default function AssetsPage() {
  const archive = archiveTotals();
  const books = BOOKS.map((b) => {
    const downloadPaths = DOWNLOADS[b.locale]
      .map(([p]) => p)
      .filter((p) => hasAsset(p));
    const narrationPaths = listAssets(`audio/${b.locale}/`).filter((k) =>
      k.endsWith(".mp3")
    );
    const groups = archiveFor(b.locale);
    // Everything voice-related lives under Narration; older book files belong
    // with the downloads they replace.
    const takes = groups.filter((g) => g.kind !== "build");
    const oldBuilds = groups.filter((g) => g.kind === "build");
    return {
      ...b,
      downloads: downloadsFor(b.locale),
      live: liveNarration(b.locale),
      groups,
      takes,
      oldBuilds,
      downloadPaths,
      narrationPaths,
      allPaths: [
        ...downloadPaths,
        ...narrationPaths,
        ...groups.flatMap((g) => g.items.map((i) => i.path)),
      ],
    };
  }).filter((b) => b.live.length > 0 || b.downloads.length > 0);

  const liveTracks = books.reduce(
    (n, b) =>
      n + b.live.reduce((m, s) => m + s.columns.reduce((k, c) => k + c.tracks.length, 0), 0),
    0
  );

  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-12">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          Assets
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Everything, in one place
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink/80">
          {liveTracks} narration tracks across two languages, the book in every
          format, the source art — and {archive.files} files of earlier takes
          that were replaced along the way. Everything is{" "}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-accent"
          >
            public domain
          </a>
          . For ready-made bundles, see the{" "}
          <Link href="/remix" className="text-link hover:text-accent">
            remix page
          </Link>
          .
        </p>
      </header>

      <div className="space-y-4">
        {/* ILLUSTRATIONS — shared by both books, so it sits on its own */}
        <Accordion
          title="Illustrations"
          meta={`${SUTTAS.length} suttas · light + dark`}
          download={zipFor(
            listAssets("illustrations/").filter((k) => k.endsWith(".png")),
            "plain-dharma-illustrations.zip"
          )}
        >
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
            Tap any image to download the PNG. A dark-mode variant of each also
            exists.
            {hasAsset("illustrations/originals.zip") && (
              <>
                {" "}
                <a
                  href={assetDownloadUrl("illustrations/originals.zip")}
                  download
                  className="text-link hover:text-accent"
                >
                  Full-resolution originals ({fmtSize("illustrations/originals.zip")})
                </a>
                .
              </>
            )}
          </p>
        </Accordion>

        {/* ONE ACCORDION PER BOOK */}
        {books.map((book) => {
          const tracks = book.live.reduce(
            (n, s) => n + s.columns.reduce((m, c) => m + c.tracks.length, 0),
            0
          );
          const earlier = book.groups.reduce((n, g) => n + g.items.length, 0);
          return (
            <Accordion
              key={book.locale}
              title={book.title}
              download={zipFor(
                book.allPaths,
                `plain-dharma-${book.locale}-everything.zip`,
                "Download everything here"
              )}
              meta={[
                book.downloads.length && `${book.downloads.length} downloads`,
                tracks && `${tracks} tracks`,
                earlier && `${earlier} earlier files`,
              ]
                .filter(Boolean)
                .join(" · ")}
            >
              <p className="mb-5 max-w-2xl font-serif text-base leading-relaxed text-ink/75">
                {book.blurb}
              </p>

              <div className="space-y-3">
                {book.downloads.length > 0 && (
                  <Accordion
                    depth={2}
                    open
                    title="Downloads"
                    meta={`${book.downloads.length} files`}
                    download={zipFor(
                      [
                        ...book.downloadPaths,
                        ...book.oldBuilds.flatMap((g) =>
                          g.items.map((i) => i.path)
                        ),
                      ],
                      `plain-dharma-${book.locale}-downloads.zip`,
                      "Download all, including older builds"
                    )}
                  >
                    <DownloadList downloads={book.downloads} />
                    {book.oldBuilds.map((g) => (
                      <div key={g.id} className="mt-3">
                        <TakeAccordion group={g} />
                      </div>
                    ))}
                  </Accordion>
                )}

                {(book.live.length > 0 || book.takes.length > 0) && (
                  <Accordion
                    depth={2}
                    title="Narration"
                    meta={[
                      `${tracks} tracks live`,
                      book.takes.length &&
                        `${book.takes.length} earlier ${
                          book.takes.length === 1 ? "take" : "takes"
                        }`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    download={zipFor(
                      [
                        ...book.narrationPaths,
                        ...book.takes.flatMap((g) =>
                          g.items.map((i) => i.path)
                        ),
                      ],
                      `plain-dharma-${book.locale}-narration-all.zip`,
                      "Download every take"
                    )}
                  >
                    <div className="space-y-3">
                      {book.live.length > 0 && (
                        <Accordion
                          depth={3}
                          open
                          title="Current"
                          badge="On the site"
                          meta={`${tracks} tracks · standard + fast`}
                          download={zipFor(
                            book.narrationPaths,
                            `plain-dharma-${book.locale}-narration.zip`
                          )}
                        >
                          <SuttaCards cards={book.live} />
                        </Accordion>
                      )}
                      {book.takes.map((g) => (
                        <TakeAccordion key={g.id} group={g} />
                      ))}
                    </div>
                  </Accordion>
                )}
              </div>
            </Accordion>
          );
        })}
      </div>

      <div className="mt-12 text-center">
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

/** One superseded group — used for takes under Narration and older book builds. */
function TakeAccordion({ group }: { group: ArchiveGroup }) {
  return (
    <Accordion
      depth={3}
      title={group.title}
      badge={KIND_LABEL[group.kind]}
      meta={`${group.date}${group.voice ? ` · ${group.voice}` : ""} · ${group.items.length} files`}
      download={zipFor(
        group.items.map((i) => i.path),
        `plain-dharma-${group.id}.zip`
      )}
    >
      <ArchiveBody group={group} />
    </Accordion>
  );
}

const KIND_LABEL: Record<ArchiveGroup["kind"], string> = {
  experiment: "Experiment",
  narration: "Superseded read",
  masters: "Raw masters",
  build: "Older build",
};

/**
 * A `<details>` disclosure. `inner` styles it as a nested row inside a book;
 * without it, it's a top-level card. No JS — open/close is native.
 */
function Accordion({
  title,
  meta,
  badge,
  open,
  depth = 1,
  download,
  children,
}: {
  title: string;
  meta?: string;
  badge?: string;
  open?: boolean;
  /** 1 = top-level card, 2 = section inside a book, 3 = a take inside a section. */
  depth?: 1 | 2 | 3;
  download?: {
    files: ZipFile[];
    bytes: number;
    filename: string;
    label?: string;
  } | null;
  children: React.ReactNode;
}) {
  return (
    <details
      open={open}
      className={`group/acc overflow-hidden rounded-lg border ${
        depth === 1 ? "border-divider/80" : "border-divider/70"
      }`}
    >
      <summary
        className={`cursor-pointer list-none transition hover:bg-ink/[0.03] ${
          depth === 1 ? "px-5 py-4" : depth === 2 ? "px-4 py-3" : "px-3 py-2.5"
        }`}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            aria-hidden
            className="font-sans text-xs text-ink/40 transition group-open/acc:rotate-90"
          >
            ▶
          </span>
          <h3
            className={`font-serif text-ink ${
              depth === 1 ? "text-xl" : depth === 2 ? "text-lg" : "text-base"
            }`}
          >
            {title}
          </h3>
          {badge && (
            <span className="rounded-full bg-accent-strong/10 px-2 py-0.5 font-sans text-[0.65rem] font-medium uppercase tracking-[0.1em] text-accent-strong">
              {badge}
            </span>
          )}
          {meta && (
            <span className="ml-auto font-sans text-xs text-ink/50">{meta}</span>
          )}
        </div>
      </summary>
      <div
        className={`border-t border-divider/70 ${
          depth === 1 ? "px-5 py-5" : depth === 2 ? "px-4 py-4" : "px-3 py-3"
        }`}
      >
        {download && (
          <div className="mb-4">
            <ZipDownload
              files={download.files}
              bytes={download.bytes}
              filename={download.filename}
              label={download.label}
            />
          </div>
        )}
        {children}
      </div>
    </details>
  );
}

function DownloadList({ downloads }: { downloads: Download[] }) {
  return (
    <ul className="divide-y divide-divider/70 overflow-hidden rounded-lg border border-divider/70">
      {downloads.map((d) => (
        <li key={d.href} className="flex items-center gap-4 px-4 py-3">
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
  );
}

/** The note, the write-up link, then either sutta cards or a flat file list. */
function ArchiveBody({ group }: { group: ArchiveGroup }) {
  const cards = archiveSuttaCards(group);
  const loose = group.items.filter((i) => !i.slug);
  return (
    <>
      <p className="mb-4 max-w-2xl font-serif text-sm leading-relaxed text-ink/75">
        {group.note}
      </p>
      {group.readme && (
        <a
          href={assetUrl(group.readme)}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-block font-sans text-xs text-link hover:text-accent"
        >
          Read the write-up →
        </a>
      )}
      {cards.length > 0 ? (
        <SuttaCards cards={cards} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {loose.map((item) => (
            <li key={item.path}>
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate font-sans text-sm text-ink/85">
                  {item.label}
                </span>
                <span className="flex-none font-sans text-xs tabular-nums text-ink/45">
                  {formatDuration(item.seconds) || fmtBytes(item.bytes)}
                </span>
              </div>
              {/\.(mp3|m4b)$/.test(item.path) ? (
                <audio
                  controls
                  preload="none"
                  src={assetUrl(item.path)}
                  className="mt-1 h-9 w-full"
                />
              ) : (
                <a
                  href={assetDownloadUrl(item.path)}
                  download
                  className="mt-1 inline-block font-sans text-xs text-link hover:text-accent"
                >
                  Download
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function SuttaCards({ cards }: { cards: SuttaCard[] }) {
  return (
    <div className="space-y-4">
      {cards.map((s) => (
        <div key={s.slug} className="rounded-lg border border-divider/70 p-4">
          <div className="mb-4 flex items-center gap-3">
            {s.ordinal != null && (
              <span className="flex size-8 flex-none items-center justify-center rounded-full bg-accent-strong/15 font-serif font-semibold text-accent-strong">
                {s.ordinal}
              </span>
            )}
            <div>
              <h4 className="font-serif text-base text-ink">{s.title}</h4>
              {s.pali && (
                <p className="font-sans text-xs italic text-ink/55">{s.pali}</p>
              )}
            </div>
            <span className="ml-auto font-sans text-xs text-ink/50">
              {s.columns.reduce((n, c) => n + c.tracks.length, 0)} files
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {s.columns.map((c) => (
              <TrackColumn key={c.label} label={c.label} tracks={c.tracks} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackColumn({ label, tracks }: { label: string; tracks: Track[] }) {
  return (
    <div>
      <h5 className="mb-2 border-b border-divider/70 pb-1 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink/55">
        {label}
      </h5>
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
