import type { SuttaSlug } from "@/content";
import { CANONICAL_LINKS } from "@/content/canonical-links";

function getSuttaCentralUrl(links: { label: string; url: string }[]): string | null {
  const sc = links.find((l) => l.url.includes("suttacentral.net"));
  return sc?.url ?? null;
}

export function CanonicalLinks({ slug }: { slug: SuttaSlug }) {
  const entry = CANONICAL_LINKS[slug];
  const scUrl = getSuttaCentralUrl(entry.links);
  return (
    <aside className="mt-12 border-t border-divider pt-6 font-sans text-sm text-ink/70">
      <p>
        Pali source —{" "}
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
      <p className="mt-3">Compare with canonical translations:</p>
      <ul className="mt-2 space-y-1">
        {entry.links.map((l) => (
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
