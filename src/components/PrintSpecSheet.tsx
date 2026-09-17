"use client";

import { useState, type ReactNode } from "react";
import {
  CUT,
  SPEC,
  PRINT_LANGS,
  THAI_CLASS,
  type PrintLang,
} from "@/content/print-strings";
import {
  editionVars,
  type EditionKey,
  type PrintshopEdition,
} from "@/content/printshop";

/**
 * Render one copy string: fill the `{placeholders}`, then turn `**bold**` into
 * <strong>. Deliberately tiny — the only markup the print copy needs, and
 * keeping it to two rules means a translator can edit the strings without
 * learning anything.
 */
function format(body: string, vars: Record<string, string | number>): ReactNode {
  const filled = body.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  );

  return filled.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

/** One segmented control. Both toggles on this sheet are the same widget. */
function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { code: T; label: string }[];
  value: T;
  onChange: (code: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex shrink-0 overflow-hidden rounded-md border border-divider"
    >
      {options.map(({ code, label: text }) => {
        const active = code === value;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            aria-pressed={active}
            className={[
              "px-3 py-1.5 font-sans text-xs transition-colors",
              active
                ? "bg-ink text-paper"
                : "text-ink/60 hover:bg-ink/5 hover:text-ink",
              code === "th" ? THAI_CLASS : "",
            ].join(" ")}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

type Props = {
  editions: PrintshopEdition[];
  /** Which trim the sheet opens on — whichever the reader was just looking at. */
  defaultEdition: EditionKey;
  /** Which language the sheet opens on — the page's own locale. */
  defaultLang: PrintLang;
};

/**
 * The shop-facing spec sheet: one trim, one language, at a time.
 *
 * Both toggles exist for the same reason — this is the thing you hold up at the
 * counter. The language toggle is not redundant with /print, /th/print and
 * /zh/print: it's for the moment you're standing there reading English and need
 * to show the clerk the Thai, without navigating away from the downloads you
 * just opened. The edition toggle is stricter than that: the sheet shows ONE
 * size's numbers, never both, because a shop handed two page counts and two cut
 * instructions on one card is a shop about to guess.
 */
export function PrintSpecSheet({ editions, defaultEdition, defaultLang }: Props) {
  const [lang, setLang] = useState<PrintLang>(defaultLang);
  const [key, setKey] = useState<EditionKey>(defaultEdition);

  const copy = SPEC[lang];
  const edition = editions.find((e) => e.key === key) ?? editions[0];
  const vars = { ...editionVars(edition), cut: CUT[lang][edition.key] };
  const thai = lang === "th";

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <div>
          <h2 className={`font-serif text-3xl text-ink${thai ? ` ${THAI_CLASS}` : ""}`}>
            {copy.heading}
          </h2>
          <p
            className={`mt-3 font-serif text-lg leading-relaxed text-ink/70${
              thai ? ` ${THAI_CLASS}` : ""
            }`}
          >
            {copy.lede}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {/* Only offered when there's a choice to make. */}
          {editions.length > 1 && (
            <Toggle
              label="Spec sheet size"
              options={editions.map((e) => ({ code: e.key, label: e.label }))}
              value={key}
              onChange={setKey}
            />
          )}
          <Toggle
            label="Spec sheet language"
            options={PRINT_LANGS.map(({ code, label }) => ({ code, label }))}
            value={lang}
            onChange={setLang}
          />
        </div>
      </div>

      <dl
        className={`mt-8 border-b border-divider${thai ? ` ${THAI_CLASS}` : ""}`}
        lang={lang === "zh" ? "zh-Hans" : lang}
      >
        {copy.rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-1 border-t border-divider py-4 sm:flex-row sm:gap-6"
          >
            <dt className="shrink-0 font-sans text-xs uppercase tracking-[0.16em] text-ink/50 sm:w-36 sm:pt-1">
              {row.label}
            </dt>
            <dd className="font-serif text-base leading-relaxed text-ink">
              {format(row.body, vars)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
