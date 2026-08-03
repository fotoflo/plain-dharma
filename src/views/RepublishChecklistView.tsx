"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

/**
 * Operator checklist for the ISBN / byline cleanup (Aug 2026): make every
 * surface carry the one canonical contributor set —
 * Gautama Buddha (Author) · Claude Opus (Translator) · Alex Miller (Editor).
 * Unlisted: noindex, robots-disallowed under /private, not in the sitemap.
 * Checkbox state persists in localStorage only (no server state).
 */

const STORAGE_KEY = "pd-republish-checklist-v1";

type Step = { id: string; title: string; detail?: React.ReactNode };
type Group = { heading: string; intro?: React.ReactNode; steps: Step[] };

const OLD_PAPERBACK_ISBN = "978-1-891328-38-1";
const EPUB_ISBN = "978-1-891328-37-4";

const GROUPS: Group[] = [
  {
    heading: "1 · Kindle edition — fix contributors on KDP",
    intro: (
      <>
        <A href="https://kdp.amazon.com/en_US/bookshelf">KDP Bookshelf</A> →
        Plain Dharma (eBook) → Edit eBook details. The live page currently
        shows &ldquo;Alex Miller (Editor, Translator)&rdquo; because Alex is
        entered as two contributor rows, and Claude Opus is missing.
      </>
    ),
    steps: [
      {
        id: "kindle-dedupe",
        title: "Delete the duplicate Alex Miller contributor row",
        detail:
          "One row says Editor, the other Translator — remove the Translator one. Keep exactly one Alex Miller row, role Editor.",
      },
      {
        id: "kindle-claude",
        title: "Add Claude Opus — role Translator",
        detail: "First name “Claude”, last name “Opus”, role dropdown → Translator.",
      },
      {
        id: "kindle-primary",
        title: "Confirm primary is still Gautama Buddha, then republish",
        detail:
          "No other changes. Propagation to the live page takes up to 72 hours.",
      },
    ],
  },
  {
    heading: "2 · Bowker — new paperback ISBN + fix the EPUB record",
    intro: (
      <>
        At <A href="https://www.myidentifiers.com">myidentifiers.com</A>. KDP
        locks the primary author on a published paperback, so the paperback is
        republished under a fresh ISBN — the old {OLD_PAPERBACK_ISBN} is burned
        (printed on live copies; ISBNs are never reused).
      </>
    ),
    steps: [
      {
        id: "bowker-assign",
        title: "Assign the next free ISBN in the 978-1-891328 block to the paperback",
        detail:
          "Title “Plain Dharma”, subtitle “The Buddha's Foundational Teachings in Modern English”, Medium: Print / Paperback.",
      },
      {
        id: "bowker-tell-claude",
        title: "Give Claude the new ISBN",
        detail:
          "Claude updates the barcode in scripts/build-kdp.ts, rebuilds the wraparound cover PDFs, and updates PAPERBACK_ISBN + the Amazon link in src/lib/book-links.ts (the new ASIN is the new ISBN-10).",
      },
      {
        id: "bowker-register-pb",
        title: "Register the new paperback ISBN with the canonical contributors",
        detail:
          "Gautama Buddha — Author · Claude Opus — Translated by · Alex Miller — Edited by. Same subtitle, publisher (Visual Language LLC dba Alphagram Learning Materials), imprint (Plain Dharma Press), and the paperback list price.",
      },
      {
        id: "bowker-fix-epub",
        title: `Fix the EPUB record (${EPUB_ISBN})`,
        detail:
          "Remove Alex's “Translated with commentary by” and “Compiled by” functions. Set Gautama Buddha — Author, Claude Opus — Translated by, Alex Miller — Edited by. Keep the Alex + Ellen “Cover Design by” credits.",
      },
      {
        id: "bowker-retire-old",
        title: `Retire ${OLD_PAPERBACK_ISBN}`,
        detail:
          "If it has a Bowker record, set Title Status to Out of Print once the old Amazon listing is unpublished. If it was never registered, leave it — just never assign it to anything else.",
      },
    ],
  },
  {
    heading: "3 · Repo — Claude rebuilds the print assets",
    intro:
      "These run in the codebase once the new ISBN exists. Check them off when Claude confirms.",
    steps: [
      {
        id: "repo-barcode",
        title: "New ISBN barcode on the wraparound cover, PDFs rebuilt",
        detail:
          "scripts/build-kdp.ts + pnpm generate-front-cover && pnpm generate-back-cover && pnpm build-kdp.",
      },
      {
        id: "repo-links",
        title: "book-links.ts: PAPERBACK_ISBN + Amazon paperback URL updated",
        detail:
          "Feeds the site's Book structured data and every paperback link. Associates tag (plaindharma-20) stays.",
      },
      {
        id: "repo-docs",
        title: "docs/publishing/ updated to the canonical contributor set",
        detail:
          "KDP_PUBLISHING.md and BOWKER_REVIEW.md record the corrected byline and the new ISBN, so the next print run starts from the right values.",
      },
    ],
  },
  {
    heading: "4 · KDP — republish the paperback, retire the old one",
    intro: (
      <>
        Create the new paperback <em>from the eBook&apos;s page</em> on the
        Bookshelf (&ldquo;Create paperback&rdquo;) so the two editions link on
        one product page.
      </>
    ),
    steps: [
      {
        id: "pb-create",
        title: "Create paperback from the eBook title",
        detail:
          "Details screen: primary Gautama Buddha, contributors Claude Opus — Translator and Alex Miller — Editor (one row each). Same description, categories, keywords as the Kindle edition — the PIN-gated fill-sheet has the copy-paste values.",
      },
      {
        id: "pb-isbn",
        title: "“I have my own ISBN” → enter the new Bowker ISBN",
        detail: "Do not take a free KDP ISBN.",
      },
      {
        id: "pb-files",
        title: "Upload the rebuilt cover PDF + the same interior PDF",
        detail:
          "dist/kdp/plain-dharma-kdp-cover-*.pdf (new barcode) and the matching interior. Run Print Previewer before saving.",
      },
      {
        id: "pb-unpublish-old",
        title: "Publish the new paperback, then unpublish the old one (ASIN 1891328387)",
        detail:
          "Do both around the same time — a live duplicate can trip KDP's duplicate-content review of the new book.",
      },
      {
        id: "pb-verify",
        title: "After it goes live: verify both Amazon pages match",
        detail:
          "Both should read “Gautama Buddha (Author), Claude Opus (Translator), Alex Miller (Editor)” and offer each other as formats. If the editions don't link, use KDP Contact Us with both ASINs.",
      },
    ],
  },
  {
    heading: "5 · Aftermath — links that point at the old ASIN",
    steps: [
      {
        id: "after-links",
        title: "Update Amazon Associates paperback links on both sites",
        detail:
          "plaindharma.com picks up the new link from book-links.ts on deploy; the other Associates-listed site needs its /dp/1891328387 links swapped by hand.",
      },
      {
        id: "after-recheck",
        title: "Re-check the live Amazon pages after ~72h",
        detail:
          "Ask Claude to re-scrape both listings and confirm the bylines converged.",
      },
    ],
  },
  {
    heading: "6 · Audiobook — fix the spoken credit",
    intro: (
      <>
        The narration source was corrected long ago (commit{" "}
        <code className="text-ink/70">76dd1c0</code>: &ldquo;By Alex
        Miller&rdquo; → &ldquo;Translated by Claude Opus, edited by Alex
        Miller&rdquo;) but the audio was never re-rendered, so the shipped M4B
        still speaks the old line.
      </>
    ),
    steps: [
      {
        id: "audio-render",
        title: "Re-render the front-matter track — done Aug 3, 2026",
        detail:
          "pnpm render-english-audio _frontmatter … — new 86s take with the corrected credit. Check this off.",
      },
      {
        id: "audio-m4b",
        title: "Rebuild the audiobook + download bundles — done Aug 3, 2026",
        detail:
          "pnpm build-audiobook + pnpm build-remix-assets — new M4B (opening chapter 1:45) and audio zip. Check this off.",
      },
      {
        id: "audio-upload",
        title: "Upload to the CDN — done Aug 3, 2026",
        detail: "pnpm upload-assets pushed 117 files. Check this off.",
      },
      {
        id: "audio-deploy",
        title: "Commit + deploy so the new cache-busted URLs roll out",
        detail:
          "asset-version.json changed — until the site redeploys, cached copies of the old audio can still serve under the old URLs.",
      },
      {
        id: "audio-verify",
        title: "Listen to the first 30 seconds of the live audiobook",
        detail:
          "The opening chapter should say “Translated by Claude Opus, edited by Alex Miller.”",
      },
    ],
  },
];

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-link underline decoration-link/40 underline-offset-2 hover:decoration-link"
    >
      {children}
    </a>
  );
}

// localStorage as an external store: "storage" covers other tabs, the custom
// event covers same-tab writes (setItem doesn't fire "storage" locally).
const LOCAL_EVENT = "pd-checklist-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCAL_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCAL_EVENT, onChange);
  };
}

export function RepublishChecklistView() {
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(STORAGE_KEY),
    () => null
  );

  const done = useMemo(() => {
    try {
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set<string>();
    }
  }, [raw]);

  function toggle(id: string) {
    const next = new Set(done);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      window.dispatchEvent(new Event(LOCAL_EVENT));
    } catch {
      // Storage blocked (private mode) — nothing to persist to.
    }
  }

  const total = GROUPS.reduce((n, g) => n + g.steps.length, 0);
  const doneCount = GROUPS.reduce(
    (n, g) => n + g.steps.filter((s) => done.has(s.id)).length,
    0
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
      <header className="mb-10">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          Operator
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">
          ISBN &amp; byline cleanup
        </h1>
        <p className="mt-3 font-sans text-sm text-ink/55">
          Make every surface — Kindle, paperback, Bowker, audiobook — carry the
          one canonical credit. Progress is saved in this browser.
          <span className="ml-2 text-ink/70">
            {doneCount}/{total} done
          </span>
        </p>
      </header>

      <section className="mb-10 rounded-lg border border-ink/15 bg-paper/60 px-5 py-4">
        <p className="font-sans text-xs font-medium uppercase tracking-wide text-ink/50">
          The canonical byline
        </p>
        <p className="mt-2 font-serif text-lg text-ink">
          Gautama Buddha <span className="text-ink/45">(Author)</span> · Claude
          Opus <span className="text-ink/45">(Translator)</span> · Alex Miller{" "}
          <span className="text-ink/45">(Editor)</span>
        </p>
        <p className="mt-2 font-sans text-sm text-ink/55">
          Already what the covers, the site&apos;s structured data, and the
          audiobook narration say. Copy-paste form values live in the{" "}
          <Link
            href="/private"
            className="text-link underline decoration-link/40 underline-offset-2 hover:decoration-link"
          >
            fill-sheet
          </Link>
          .
        </p>
      </section>

      {GROUPS.map((group) => (
        <section key={group.heading} className="mb-10">
          <h2 className="font-serif text-xl text-ink">{group.heading}</h2>
          {group.intro && (
            <p className="mt-1 font-sans text-sm text-ink/55">{group.intro}</p>
          )}
          <ul className="mt-4 flex flex-col gap-3">
            {group.steps.map((step) => {
              const checked = done.has(step.id);
              return (
                <li key={step.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-ink/10 bg-paper/40 px-4 py-3 transition hover:border-ink/25">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(step.id)}
                      className="mt-1 size-4 shrink-0 accent-[var(--color-accent-strong,#8a5a2b)]"
                    />
                    <span>
                      <span
                        className={`block font-sans text-sm font-medium ${
                          checked ? "text-ink/40 line-through" : "text-ink"
                        }`}
                      >
                        {step.title}
                      </span>
                      {step.detail && (
                        <span
                          className={`mt-1 block font-sans text-xs leading-relaxed ${
                            checked ? "text-ink/30" : "text-ink/55"
                          }`}
                        >
                          {step.detail}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <footer className="mt-12 border-t border-ink/10 pt-6">
        <p className="font-sans text-xs text-ink/45">
          Unlisted operator page — not in the sitemap, noindex, disallowed in
          robots.txt. Sources: docs/publishing/KDP_PUBLISHING.md ·
          docs/publishing/BOWKER_REVIEW.md.
        </p>
      </footer>
    </div>
  );
}
