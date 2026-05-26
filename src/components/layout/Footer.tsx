import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-divider/80">
      <div className="font-sans mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-10 text-sm text-ink/70 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif italic">
            The Buddha&apos;s foundational teachings in plain modern English.
          </p>
          <p className="mt-1 text-xs">
            Released under{" "}
            <a
              href="https://creativecommons.org/publicdomain/zero/1.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC0 / public domain
            </a>
            . Made for free distribution.
          </p>
          <p className="mt-1 text-xs text-ink/50">
            by{" "}
            <a
              href="https://aimhuge.com"
              target="_blank"
              rel="noopener"
            >
              Alex Miller
            </a>
          </p>
        </div>
        <div className="flex items-center gap-5 text-xs">
          <Link href="/about">About</Link>
          <Link href="/glossary">Glossary</Link>
          <a
            href="https://github.com/fotoflo/plain-dharma"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
