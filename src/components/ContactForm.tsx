"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { getStrings } from "@plain-dharma/content/strings";
import { getLocaleFromPathname } from "@/lib/locale-href";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function ContactForm() {
  const pathname = usePathname() ?? "/";
  const locale = getLocaleFromPathname(pathname);
  const s = getStrings(locale);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "submitting") return;

    if (!email.trim() || message.trim().length < 2) {
      setStatus({ kind: "error", message: s.contact.validationError });
      return;
    }
    setStatus({ kind: "submitting" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? s.contact.genericError,
        });
        return;
      }
      setStatus({ kind: "success" });
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : s.contact.networkError,
      });
    }
  }

  if (status.kind === "success") {
    return (
      <div className="rounded-lg border border-divider/80 p-8">
        <h2 className="font-serif text-2xl text-ink">
          {s.contact.successHeading}
        </h2>
        <p className="mt-2 font-serif text-base text-ink/75">
          {s.contact.successMessage}
        </p>
      </div>
    );
  }

  const disabled = status.kind === "submitting";

  return (
    <div className="rounded-lg border border-divider/80 p-8">
      <h2 className="font-serif text-2xl text-ink">{s.contact.heading}</h2>
      <p className="mt-2 font-serif text-base text-ink/75">{s.contact.lead}</p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        <label>
          <span className="sr-only">{s.contact.nameLabel}</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={s.contact.namePlaceholder}
            disabled={disabled}
            className="w-full rounded-md border border-ink/25 bg-paper/60 px-4 py-2.5 font-sans text-base text-ink placeholder:text-ink/40 outline-none focus:border-accent disabled:opacity-60"
          />
        </label>
        <label>
          <span className="sr-only">{s.contact.emailLabel}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={s.contact.emailPlaceholder}
            disabled={disabled}
            className="w-full rounded-md border border-ink/25 bg-paper/60 px-4 py-2.5 font-sans text-base text-ink placeholder:text-ink/40 outline-none focus:border-accent disabled:opacity-60"
          />
        </label>
        <label>
          <span className="sr-only">{s.contact.messageLabel}</span>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={s.contact.messagePlaceholder}
            disabled={disabled}
            className="w-full resize-y rounded-md border border-ink/25 bg-paper/60 px-4 py-2.5 font-sans text-base text-ink placeholder:text-ink/40 outline-none focus:border-accent disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center justify-center self-start rounded-full bg-accent-strong px-5 py-2.5 font-sans text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {disabled ? s.contact.submitting : s.contact.submit}
        </button>
      </form>

      {status.kind === "error" && (
        <p className="mt-4 font-serif text-sm text-red-700 dark:text-red-300">
          {status.message}
        </p>
      )}
    </div>
  );
}
