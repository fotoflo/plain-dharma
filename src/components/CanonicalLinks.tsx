import type { Locale, SuttaSlug } from "@/content";
import { CANONICAL_LINKS } from "@/content/canonical-links";
import { getStrings } from "@/content/strings";

function getSuttaCentralUrl(links: { label: string; url: string }[]): string | null {
  const sc = links.find((l) => l.url.includes("suttacentral.net"));
  return sc?.url ?? null;
}

export function CanonicalLinks({
  locale,
  slug,
}: {
  locale: Locale;
  slug: SuttaSlug;
}) {
  const entry = CANONICAL_LINKS[slug];
  const links = entry.linksByLocale[locale];
  const scUrl = getSuttaCentralUrl(links);
  const s = getStrings(locale).canonicalLinks;
  return (
    <aside className="mt-12 border-t border-divider pt-6 font-sans text-sm text-ink/70">
      <p>
        {s.paliSourcePrefix}{" "}
        {scUrl ? (
          <a
            href={scUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link underline-offset-2 hover:text-accent hover:underline"
          >
            <em className="font-serif">{entry.paliName}</em>
          </a>
        ) : (
          <em className="font-serif">{entry.paliName}</em>
        )}{" "}
        <span className="text-ink/65">({entry.paliReference})</span>
      </p>
      <p className="mt-3">{s.compareIntro}</p>
      <ul className="mt-2 space-y-1">
        {links.map((l) => (
          <li key={l.url}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link underline-offset-2 hover:text-accent hover:underline"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
