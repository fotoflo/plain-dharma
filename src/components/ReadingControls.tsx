"use client";

import { useSyncExternalStore, useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getStrings } from "@/content/strings";
import { getLocaleFromPathname } from "@/lib/locale-href";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReadingSize     = "sm" | "md" | "lg" | "xl";
export type ReadingContrast = "low" | "med" | "high";
export type ReadingFont     = "serif" | "accessible";

// ── Constants ─────────────────────────────────────────────────────────────────

const SIZE_KEY     = "pd-reading-size";
const CONTRAST_KEY = "pd-reading-contrast";
const FONT_KEY     = "pd-reading-font";

const DEFAULT_SIZE:     ReadingSize     = "md";
const DEFAULT_CONTRAST: ReadingContrast = "med";
const DEFAULT_FONT:     ReadingFont     = "serif";

// ── Consolidated FOUC-prevention init script (replaces readingSizeInitScript)
// Reads all three localStorage keys and applies all three HTML classes in one
// synchronous pass — no flash, no separate script tags.
export const readingPrefsInitScript = `(function(){try{
  var s=localStorage.getItem('pd-reading-size');
  if(s&&['sm','md','lg','xl'].includes(s)){document.documentElement.classList.remove('reading-size-sm','reading-size-md','reading-size-lg','reading-size-xl');document.documentElement.classList.add('reading-size-'+s);}
  var c=localStorage.getItem('pd-reading-contrast');
  if(c&&['low','med','high'].includes(c)){document.documentElement.classList.remove('contrast-low','contrast-med','contrast-high');document.documentElement.classList.add('contrast-'+c);}
  var f=localStorage.getItem('pd-reading-font');
  if(f&&['serif','accessible'].includes(f)){document.documentElement.classList.remove('font-serif-pref','font-accessible-pref');document.documentElement.classList.add('font-'+f+'-pref');}
}catch(e){}})();`;

// Keep the old export name as an alias so any other importers don't break.
export const readingSizeInitScript = readingPrefsInitScript;

// ── External-store helpers ────────────────────────────────────────────────────

// Size
function getSizeSnapshot(): ReadingSize {
  const el = document.documentElement;
  if (el.classList.contains("reading-size-sm")) return "sm";
  if (el.classList.contains("reading-size-lg")) return "lg";
  if (el.classList.contains("reading-size-xl")) return "xl";
  return "md";
}
const getServerSizeSnapshot = (): ReadingSize => DEFAULT_SIZE;

function subscribeSize(onChange: () => void) {
  window.addEventListener("readingsizechange", onChange);
  return () => window.removeEventListener("readingsizechange", onChange);
}

function applySize(size: ReadingSize) {
  const el = document.documentElement;
  el.classList.remove("reading-size-sm", "reading-size-md", "reading-size-lg", "reading-size-xl");
  el.classList.add(`reading-size-${size}`);
  try { localStorage.setItem(SIZE_KEY, size); } catch {}
  window.dispatchEvent(new Event("readingsizechange"));
}

// Contrast
function getContrastSnapshot(): ReadingContrast {
  const el = document.documentElement;
  if (el.classList.contains("contrast-low"))  return "low";
  if (el.classList.contains("contrast-high")) return "high";
  return "med";
}
const getServerContrastSnapshot = (): ReadingContrast => DEFAULT_CONTRAST;

function subscribeContrast(onChange: () => void) {
  window.addEventListener("readingcontrastchange", onChange);
  return () => window.removeEventListener("readingcontrastchange", onChange);
}

function applyContrast(contrast: ReadingContrast) {
  const el = document.documentElement;
  el.classList.remove("contrast-low", "contrast-med", "contrast-high");
  el.classList.add(`contrast-${contrast}`);
  try { localStorage.setItem(CONTRAST_KEY, contrast); } catch {}
  window.dispatchEvent(new Event("readingcontrastchange"));
}

// Font
function getFontSnapshot(): ReadingFont {
  const el = document.documentElement;
  if (el.classList.contains("font-accessible-pref")) return "accessible";
  return "serif";
}
const getServerFontSnapshot = (): ReadingFont => DEFAULT_FONT;

function subscribeFont(onChange: () => void) {
  window.addEventListener("readingfontchange", onChange);
  return () => window.removeEventListener("readingfontchange", onChange);
}

function applyFont(font: ReadingFont) {
  const el = document.documentElement;
  el.classList.remove("font-serif-pref", "font-accessible-pref");
  el.classList.add(`font-${font}-pref`);
  try { localStorage.setItem(FONT_KEY, font); } catch {}
  window.dispatchEvent(new Event("readingfontchange"));
}

// ── Shared button style helper ────────────────────────────────────────────────

function segmentedBtn(active: boolean) {
  return [
    "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-sans transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
    active
      ? "bg-accent text-white font-medium"
      : "border border-accent/40 bg-transparent text-ink/70 hover:border-accent hover:text-accent",
  ].join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReadingControls() {
  const pathname = usePathname() ?? "/";
  const locale = getLocaleFromPathname(pathname);
  const s = getStrings(locale);

  const SIZES: { key: ReadingSize; label: string; ariaLabel: string; scale: number }[] = [
    { key: "sm",  label: "A",  ariaLabel: s.readingControls.sizeSmall,      scale: 0.82 },
    { key: "md",  label: "A",  ariaLabel: s.readingControls.sizeMedium,     scale: 1.0  },
    { key: "lg",  label: "A",  ariaLabel: s.readingControls.sizeLarge,      scale: 1.2  },
    { key: "xl",  label: "A",  ariaLabel: s.readingControls.sizeExtraLarge, scale: 1.45 },
  ];

  const CONTRASTS: { key: ReadingContrast; label: string }[] = [
    { key: "low",  label: s.readingControls.contrastLow  },
    { key: "med",  label: s.readingControls.contrastMed  },
    { key: "high", label: s.readingControls.contrastHigh },
  ];

  const FONTS: { key: ReadingFont; label: string }[] = [
    { key: "serif",      label: s.readingControls.fontSerif      },
    { key: "accessible", label: s.readingControls.fontAccessible },
  ];

  const currentSize     = useSyncExternalStore(subscribeSize,     getSizeSnapshot,     getServerSizeSnapshot);
  const currentContrast = useSyncExternalStore(subscribeContrast, getContrastSnapshot, getServerContrastSnapshot);
  const currentFont     = useSyncExternalStore(subscribeFont,     getFontSnapshot,     getServerFontSnapshot);

  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef  = useRef<HTMLButtonElement>(null);

  // Close on click-outside
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Keyboard: Escape closes; arrow keys navigate within each row
  const handlePopoverKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      // Find buttons in the same role="group" as the focused button
      const focused = document.activeElement as HTMLButtonElement;
      const group = focused?.closest('[role="group"]');
      const btns = Array.from(
        (group ?? popoverRef.current)?.querySelectorAll<HTMLButtonElement>("button") ?? []
      );
      const idx = btns.indexOf(focused);
      btns[(idx + 1) % btns.length]?.focus();
    }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const focused = document.activeElement as HTMLButtonElement;
      const group = focused?.closest('[role="group"]');
      const btns = Array.from(
        (group ?? popoverRef.current)?.querySelectorAll<HTMLButtonElement>("button") ?? []
      );
      const idx = btns.indexOf(focused);
      btns[(idx - 1 + btns.length) % btns.length]?.focus();
    }
  }, []);

  return (
    <div data-mn-ui className="fixed bottom-6 right-4 z-50 sm:bottom-auto sm:top-20 sm:right-5 flex flex-col items-end gap-2">
      {/* Trigger pill — unchanged */}
      <button
        ref={buttonRef}
        type="button"
        aria-label={s.readingControls.a11yTrigger}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex h-9 w-14 items-center justify-center gap-0.5 rounded-full",
          "border border-accent/40 bg-paper/95 shadow-sm backdrop-blur-sm",
          "text-accent transition-colors hover:border-accent hover:bg-paper",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        ].join(" ")}
      >
        <span className="font-sans font-medium leading-none" style={{ fontSize: "0.7rem" }}>A</span>
        <span className="font-sans font-medium leading-none" style={{ fontSize: "1.05rem" }}>a</span>
      </button>

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={s.readingControls.a11yPanel}
          onKeyDown={handlePopoverKeyDown}
          className={[
            "flex flex-col gap-3 rounded-2xl p-4 w-64",
            "border border-accent/25 bg-paper/97 shadow-md backdrop-blur-sm",
          ].join(" ")}
        >
          {/* ── Size ── */}
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wide text-ink/60 font-sans">{s.readingControls.sectionSize}</p>
            <div role="group" aria-label={s.readingControls.a11ySize} className="flex flex-row gap-1">
              {SIZES.map((size) => {
                const active = currentSize === size.key;
                const label = `${size.ariaLabel} ${s.readingControls.a11ySizeSuffix}${active ? ` ${s.readingControls.a11ySelectedSuffix}` : ""}`;
                return (
                  <button
                    key={size.key}
                    type="button"
                    aria-label={label}
                    aria-pressed={active}
                    onClick={() => applySize(size.key)}
                    className={[
                      "flex h-9 w-10 items-center justify-center rounded-xl font-sans font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                      active
                        ? "bg-accent text-white"
                        : "border border-accent/40 bg-transparent text-ink/70 hover:border-accent hover:text-accent",
                    ].join(" ")}
                    style={{ fontSize: `${size.scale * 0.9}rem` }}
                  >
                    {size.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Contrast ── */}
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wide text-ink/60 font-sans">{s.readingControls.sectionContrast}</p>
            <div role="group" aria-label={s.readingControls.a11yContrast} className="flex flex-row gap-1">
              {CONTRASTS.map((c) => {
                const active = currentContrast === c.key;
                const label = `${c.label} ${s.readingControls.a11yContrastSuffix}${active ? ` ${s.readingControls.a11ySelectedSuffix}` : ""}`;
                return (
                  <button
                    key={c.key}
                    type="button"
                    aria-label={label}
                    aria-pressed={active}
                    onClick={() => applyContrast(c.key)}
                    className={segmentedBtn(active)}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Font ── */}
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wide text-ink/60 font-sans">{s.readingControls.sectionFont}</p>
            <div role="group" aria-label={s.readingControls.a11yFont} className="flex flex-row gap-1">
              {FONTS.map((f) => {
                const active = currentFont === f.key;
                const label = `${f.label} ${s.readingControls.a11yFontSuffix}${active ? ` ${s.readingControls.a11ySelectedSuffix}` : ""}`;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-label={label}
                    aria-pressed={active}
                    onClick={() => applyFont(f.key)}
                    className={segmentedBtn(active)}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
