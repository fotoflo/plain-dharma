"use client";

import { useState, type ReactNode } from "react";
import {
  SPEC,
  PRINT_LANGS,
  THAI_CLASS,
  type PrintLang,
} from "@/content/print-strings";

type Vars = { pages: number; sheets: number; trim: string };

/**
 * Render one copy string: fill `{pages}` / `{sheets}` / `{trim}`, then turn
 * `**bold**` into <strong>. Deliberately tiny — the only markup the print copy
 * needs, and keeping it to two rules means a translator can edit the strings
 * without learning anything.
 */
function format(body: string, vars: Vars): ReactNode {
  const filled = body
    .replace(/\{pages\}/g, String(vars.pages))
    .replace(/\{sheets\}/g, String(vars.sheets))
    .replace(/\{trim\}/g, vars.trim);

  return filled.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

type Props = {
  vars: Vars;
  /** Which language the sheet opens on — the page's own locale. */
  defaultLang: PrintLang;
};

/**
 * The shop-facing spec sheet, switchable between English, Thai and Chinese.
 *
 * Each language also has its own full page (/print, /th/print, /zh/print), but
 * this toggle is not redundant with them: it's for the moment you're standing
 * at the counter reading English and need to show the clerk the Thai, without
 * navigating away from the downloads you just opened.
 */
export function PrintSpecSheet({ vars, defaultLang }: Props) {
  const [lang, setLang] = useState<PrintLang>(defaultLang);
  const copy = SPEC[lang];
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

        <div
          role="group"
          aria-label="Spec sheet language"
          className="flex shrink-0 overflow-hidden rounded-md border border-divider"
        >
          {PRINT_LANGS.map(({ code, label }) => {
            const active = code === lang;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={active}
                className={[
                  "px-3 py-1.5 font-sans text-xs transition-colors",
                  active
                    ? "bg-ink text-paper"
                    : "text-ink/60 hover:bg-ink/5 hover:text-ink",
                  code === "th" ? THAI_CLASS : "",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
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
