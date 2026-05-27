"use client";

import { useState } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; alreadySubscribed: boolean }
  | { kind: "error"; message: string };

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "submitting") return;
    setStatus({ kind: "submitting" });

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        alreadySubscribed?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? "Something went wrong.",
        });
        return;
      }
      setStatus({
        kind: "success",
        alreadySubscribed: Boolean(data.alreadySubscribed),
      });
      setEmail("");
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error.",
      });
    }
  }

  return (
    <div className="rounded-lg border border-divider/80 p-8">
      <h2 className="font-serif text-2xl text-ink">Stay in touch</h2>
      <p className="mt-2 font-serif text-base text-ink/75">
        We&rsquo;re slowly publishing more &mdash; new translations, printed
        editions, audio. Get an email when something new goes up. No more than
        a handful a year.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col gap-3 sm:flex-row"
      >
        <label className="flex-1">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={status.kind === "submitting" || status.kind === "success"}
            className="w-full rounded-md border border-ink/25 bg-paper/60 px-4 py-2.5 font-sans text-base text-ink placeholder:text-ink/40 outline-none focus:border-accent disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={status.kind === "submitting" || status.kind === "success"}
          className="inline-flex items-center justify-center rounded-full bg-accent-strong px-5 py-2.5 font-sans text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {status.kind === "submitting" ? "Subscribing…" : "Subscribe"}
        </button>
      </form>

      {status.kind === "success" && (
        <p className="mt-4 font-serif text-sm text-ink/75">
          {status.alreadySubscribed
            ? "You're already on the list. Thanks for checking back."
            : "Thanks — you'll hear from us when something new goes up."}
        </p>
      )}
      {status.kind === "error" && (
        <p className="mt-4 font-serif text-sm text-red-700 dark:text-red-300">
          {status.message}
        </p>
      )}
    </div>
  );
}
