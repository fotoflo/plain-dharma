import type { SourceRow } from "@plain-dharma/content/source";

/**
 * Three-way "diff" of a sutta, one aligned row per passage:
 *   1. CC0 root Pāli (original)
 *   2. a canonical English translation (Bhikkhu Sujato, CC-BY)
 *   3. our plain-modern retelling
 *
 * Three columns on desktop; stacks to one column on narrow screens (Pāli →
 * canonical → plain) so it stays readable on a phone. Pure presentation, no JS.
 */
export function SourceDiff({
  rows,
  paliLabel,
  tradLabel,
  plainLabel,
}: {
  rows: SourceRow[];
  paliLabel: string;
  tradLabel: string;
  plainLabel: string;
}) {
  const cols =
    "grid grid-cols-1 md:grid-cols-3 divide-y divide-divider/40 md:divide-y-0 md:divide-x md:divide-divider/60";

  return (
    <div className="overflow-hidden rounded-xl border border-divider/70">
      {/* Column headers */}
      <div className={`${cols} border-b border-divider/70 bg-ink/[0.03] font-sans text-[0.7rem] uppercase tracking-[0.18em] text-ink/45`}>
        <div className="px-5 py-2.5">{paliLabel}</div>
        <div className="px-5 py-2.5">{tradLabel}</div>
        <div className="px-5 py-2.5">{plainLabel}</div>
      </div>

      <div className="divide-y divide-divider/60">
        {rows.map((row, i) => (
          <div key={i} className={cols}>
            {/* Pāli — original */}
            <div className="relative bg-ink/[0.03] px-5 py-5">
              <span className="absolute right-2.5 top-2.5 font-sans text-[0.65rem] tabular-nums text-ink/30">
                {row.ref}
              </span>
              <p className="whitespace-pre-line font-serif italic leading-relaxed text-ink/70">
                {row.pali}
              </p>
            </div>
            {/* Canonical translation */}
            <div className="px-5 py-5">
              <p className="whitespace-pre-line font-serif leading-relaxed text-ink/80">
                {row.trad}
              </p>
            </div>
            {/* Plain English — our retelling */}
            <div className="px-5 py-5">
              <p className="font-serif leading-relaxed text-ink">{row.en}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
