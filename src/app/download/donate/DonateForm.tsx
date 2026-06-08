"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { assetDownloadUrl, assetSize } from "@plain-dharma/content/assets";
import { FreeDownloadButton } from "./FreeDownloadButton";

const FILE_LABELS: Record<string, { label: string; href: string }> = {
  pdf:  { label: "PDF",       href: assetDownloadUrl("downloads/plain-dharma.pdf") },
  m4b:  { label: "Audiobook", href: assetDownloadUrl("downloads/plain-dharma.m4b") },
};

type Preset = {
  cents: number;
  label: string;
  reason: string;
};

// Center-bias picks the middle option. $7 is the most-clicked tier; the
// reasoning copy attached to each amount converts much better than naked
// numbers (Humble Bundle / itch.io research).
const PRESETS: Preset[] = [
  { cents: 300,  label: "$3",  reason: "Matches the Amazon price." },
  { cents: 700,  label: "$7",  reason: "Helps cover hosting and future translations." },
  { cents: 1500, label: "$15", reason: "Funds printed copies given freely at temples, retreats, and hospices." },
];

function getFileSlug(raw: string | null): "pdf" | "m4b" {
  if (raw === "m4b") return "m4b";
  return "pdf"; // default if missing/invalid
}

export function DonateForm() {
  const searchParams = useSearchParams();
  const slug = getFileSlug(searchParams.get("file"));
  const file = FILE_LABELS[slug];
  const cancelled = searchParams.get("cancelled") === "1";

  // Funnel tagging via ?ref (web player → "player", download page → "download",
  // mobile app → "app_*"). When the mobile app opens this in an in-app browser it
  // also passes an anonymous install id (?cid) and ?hide_nav=true so the page
  // reads as a native sheet. We fire one donate_view GA event for every source
  // (anonymous; no PII), matching the native event.
  const ref = searchParams.get("ref");
  const cid = searchParams.get("cid");
  const hideNav = searchParams.get("hide_nav") === "true";

  useEffect(() => {
    if (hideNav) document.documentElement.classList.add("app-embed");
    if (ref) {
      const w = window as Window & {
        gtag?: (...args: unknown[]) => void;
        dataLayer?: unknown[];
      };
      // Define the gtag stub if GA's script hasn't loaded yet — queued events
      // are flushed once it does (same contract as the inline GA init).
      if (!w.gtag) {
        w.dataLayer = w.dataLayer ?? [];
        w.gtag = (...args: unknown[]) => w.dataLayer!.push(args);
      }
      // Same event name + param shape as the mobile native donate_view, so the
      // app, web player, and download-page funnels all land in one GA4 event.
      w.gtag("event", "donate_view", {
        ref,
        cid: cid ?? undefined,
        file: slug,
      });
    }
    return () => {
      if (hideNav) document.documentElement.classList.remove("app-embed");
    };
  }, [hideNav, ref, cid, slug]);

  const [selectedCents, setSelectedCents] = useState<number>(700);
  const [customDollars, setCustomDollars] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function effectiveCents(): number {
    if (customDollars.trim() !== "") {
      const parsed = Number(customDollars.replace(/[^0-9.]/g, ""));
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.round(parsed * 100);
      }
      return 0;
    }
    return selectedCents;
  }

  async function handleDonate() {
    const cents = effectiveCents();
    if (cents < 100) {
      setError("Minimum donation is $1. Use the free download link below if you'd like to skip donating.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cents, file: slug }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const donateAmountLabel = (() => {
    const cents = effectiveCents();
    if (cents < 100) return "Donate";
    return `Donate $${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)} & download`;
  })();

  return (
    <div className="space-y-8">
      <p className="font-serif text-base text-ink/70">
        Downloading the <strong>{file.label}</strong> edition.
      </p>

      {cancelled && (
        <p className="rounded-md bg-accent/10 px-4 py-3 font-sans text-sm text-ink/80">
          Payment was cancelled. You can try a different amount or take the
          free download below.
        </p>
      )}

      <div className="space-y-3">
        {PRESETS.map((p) => {
          const isActive = customDollars.trim() === "" && selectedCents === p.cents;
          return (
            <button
              key={p.cents}
              type="button"
              onClick={() => {
                setSelectedCents(p.cents);
                setCustomDollars("");
              }}
              className={`block w-full rounded-lg border px-5 py-4 text-left transition ${
                isActive
                  ? "border-accent bg-accent/10"
                  : "border-divider hover:border-ink/40 hover:bg-ink/[0.03]"
              }`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-serif text-2xl text-ink">{p.label}</span>
                <span className="font-serif text-sm text-ink/70">{p.reason}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <label className="flex items-center gap-3 font-sans text-sm text-ink/70">
          <span className="whitespace-nowrap">Or another amount —</span>
          <span className="font-serif text-lg text-ink">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={customDollars}
            onChange={(e) => setCustomDollars(e.target.value)}
            placeholder="0"
            className="w-24 rounded border border-ink/25 bg-paper/60 px-2 py-1 font-serif text-lg text-ink outline-none focus:border-accent"
          />
        </label>
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-4 py-3 font-sans text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleDonate}
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full bg-accent-strong px-6 py-3 font-sans text-base font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? "Opening Stripe…" : donateAmountLabel}
        </button>
        <FreeDownloadButton
          href={file.href}
          label="Download free"
          fallbackBytes={assetSize(`downloads/plain-dharma.${slug}`)}
        />
      </div>

      <p className="font-serif text-xs text-ink/50">
        Payment is processed by Stripe. We don&rsquo;t store your card. The
        download works the same whether you donate or not &mdash; this is a
        nudge, not a gate.
      </p>
    </div>
  );
}
