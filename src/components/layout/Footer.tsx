"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStrings } from "@plain-dharma/content/strings";
import { getLocaleFromPathname, localizedHref } from "@/lib/locale-href";

export function Footer() {
  const pathname = usePathname() ?? "/";
  const locale = getLocaleFromPathname(pathname);
  const s = getStrings(locale);

  return (
    <footer data-site-chrome className="mt-24 border-t border-divider/80">
      <div className="font-sans mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-10 text-sm text-ink/70 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif italic">{s.footer.tagline}</p>
          <p className="mt-1 text-xs">
            {s.footer.licenseLinePrefix}
            <a
              href="https://creativecommons.org/publicdomain/zero/1.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.footer.licenseLinkText}
            </a>
            {s.footer.licenseLineSuffix}
          </p>
          <p className="mt-1 text-xs text-ink/50">
            {s.footer.byLinePrefix}
            <a
              href="https://aimhuge.com"
              target="_blank"
              rel="noopener"
            >
              {s.footer.byLineLinkText}
            </a>
          </p>
          {/* Required by the Amazon Associates Operating Agreement — the
              paperback/Kindle links on the home and download pages carry the
              plaindharma-20 tag (see src/lib/book-links.ts). */}
          <p className="mt-1 text-xs text-ink/50">{s.footer.affiliateLine}</p>
        </div>
        <div className="flex items-center gap-5 text-xs">
          <Link href={localizedHref(locale, "about")}>
            {s.footer.aboutLink}
          </Link>
          <Link href={localizedHref(locale, "glossary")}>
            {s.footer.glossaryLink}
          </Link>
          {/* Remix is EN-only (like /download), so it always points at /remix. */}
          <Link href="/remix">{s.footer.remixLink}</Link>
          <Link href={localizedHref(locale, "contribute")}>
            {s.footer.contributeLink}
          </Link>
          <Link href={localizedHref(locale, "privacy")}>
            {s.footer.privacyLink}
          </Link>
          <a
            href="https://github.com/fotoflo/plain-dharma"
            target="_blank"
            rel="noopener noreferrer"
          >
            {s.footer.githubLink}
          </a>
        </div>
      </div>
    </footer>
  );
}
