"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const LINKS = [
  { href: "/read", label: "Read" },
  { href: "/about", label: "About" },
  { href: "/glossary", label: "Glossary" },
  { href: "/download", label: "Download" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="relative z-40 w-full border-b border-divider/80 bg-paper">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-8 px-6 py-5">
          <Logo size={36} />

          <nav className="font-sans hidden items-center gap-6 text-sm sm:flex sm:gap-8">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-ink hover:text-accent no-underline hover:no-underline"
              >
                {l.label}
              </Link>
            ))}
            <ThemeToggle />
          </nav>

          <div className="flex items-center gap-1 sm:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav-panel"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-divider/40 hover:text-accent"
            >
              {open ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {open && (
          <nav
            id="mobile-nav-panel"
            className="font-sans absolute left-0 right-0 top-full border-b border-divider/80 bg-paper shadow-lg sm:hidden"
          >
            <ul className="mx-auto flex w-full max-w-5xl flex-col px-6 py-2">
              {LINKS.map((l) => (
                <li key={l.href} className="border-b border-divider/40 last:border-b-0">
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-4 text-base text-ink hover:text-accent no-underline hover:no-underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 sm:hidden"
        />
      )}
    </>
  );
}
