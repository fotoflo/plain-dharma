"use client";

import { useState } from "react";

type Field = {
  label: string;
  value?: string;
  note?: string;
  multiline?: boolean;
};
type Section = { heading: string; intro?: string; fields: Field[] };

type Status =
  | { kind: "locked" }
  | { kind: "checking" }
  | { kind: "error"; message: string }
  | { kind: "open"; sections: Section[] };

function CopyValue({ value, multiline }: { value: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard blocked (no HTTPS / permissions) — selection still works.
    }
  }

  return (
    <div className="group relative">
      <pre
        className={`m-0 overflow-x-auto rounded-md border border-ink/15 bg-paper/60 px-3 py-2 font-sans text-sm text-ink ${
          multiline ? "whitespace-pre-wrap" : "whitespace-pre"
        }`}
      >
        {value}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 rounded-md bg-accent-strong px-2 py-1 font-sans text-xs font-medium text-white opacity-0 shadow-sm transition group-hover:opacity-100 focus:opacity-100"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function PrivateView() {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "locked" });

  async function unlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "checking") return;
    setStatus({ kind: "checking" });
    try {
      const res = await fetch("/api/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = (await res.json()) as {
        sections?: Section[];
        error?: string;
      };
      if (!res.ok || !data.sections) {
        setStatus({ kind: "error", message: data.error ?? "Incorrect PIN." });
        return;
      }
      setStatus({ kind: "open", sections: data.sections });
    } catch {
      setStatus({ kind: "error", message: "Network error. Try again." });
    }
  }

  if (status.kind !== "open") {
    const checking = status.kind === "checking";
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-sm flex-col justify-center px-6 py-16">
        <h1 className="font-serif text-2xl text-ink">Private</h1>
        <p className="mt-2 font-sans text-sm text-ink/55">
          Enter the PIN to view the publishing fill-sheet.
        </p>
        <form onSubmit={unlock} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            disabled={checking}
            className="w-full rounded-md border border-ink/25 bg-paper/60 px-4 py-2.5 text-center font-sans text-lg tracking-[0.3em] text-ink placeholder:tracking-normal placeholder:text-ink/40 outline-none focus:border-accent disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={checking}
            className="inline-flex items-center justify-center rounded-full bg-accent-strong px-5 py-2.5 font-sans text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {checking ? "Checking…" : "Unlock"}
          </button>
          {status.kind === "error" && (
            <p className="font-sans text-sm text-red-700 dark:text-red-300">
              {status.message}
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
      <header className="mb-10">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          Operator
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">
          Publishing fill-sheet
        </h1>
        <p className="mt-3 font-sans text-sm text-ink/55">
          Copy-paste values for the KDP &amp; Bowker forms. Source of truth:{" "}
          <code className="text-ink/70">docs/publishing/</code>.
        </p>
      </header>

      {status.sections.map((section) => (
        <section key={section.heading} className="mb-12">
          <h2 className="font-serif text-xl text-ink">{section.heading}</h2>
          {section.intro && (
            <p className="mt-1 font-sans text-sm text-ink/55">{section.intro}</p>
          )}
          <dl className="mt-4 flex flex-col gap-4">
            {section.fields.map((field) => (
              <div key={field.label}>
                <dt className="font-sans text-xs font-medium uppercase tracking-wide text-ink/50">
                  {field.label}
                </dt>
                <dd className="mt-1">
                  {field.value ? (
                    <CopyValue value={field.value} multiline={field.multiline} />
                  ) : (
                    <p className="font-sans text-sm italic text-ink/45">
                      (leave blank)
                    </p>
                  )}
                  {field.note && (
                    <p className="mt-1 font-sans text-xs text-ink/55">
                      {field.note}
                    </p>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
