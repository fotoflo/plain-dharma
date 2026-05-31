/**
 * Reading-screen glue for Margin Notes on one sutta.
 *
 * Owns the composer/panel/highlight state and exposes:
 *  - `marksForSlug`        — this sutta's marks (for highlight rendering + count)
 *  - `markedAnchors`       — Set of section ids that have at least one mark
 *  - `beginAdd(section)`   — open the composer to add a mark for a section
 *  - `beginEdit(mark)`     — open the composer to edit an existing mark
 *  - render props for `<NoteComposer>` and `<MarginNotesPanel>`
 *
 * ── Parity limitation (documented) ─────────────────────────────────────────
 * The web anchors a mark to a precise text *range* inside a section
 * (`prefix`/`quote`/`suffix` via W3C text-quote selectors, resolved against the
 * live DOM). react-native-markdown-display renders Markdown to native views and
 * exposes no DOM/Range API, so mobile anchors at the SECTION level instead:
 * a long-press on a section adds a mark whose `anchor` is the section id (the
 * same `splitSections` id the web uses), `quote` is the section's leading text
 * snippet, and `prefix`/`suffix` are empty. This is the same data model + table,
 * so marks created on either platform appear in the other's "My notes" list. The
 * gap: a mobile mark won't paint as an inline text highlight on the web (the web
 * resolves the whole-section quote to a range when it can, otherwise it surfaces
 * in the panel only), and the web's sub-sentence precision can't be reproduced
 * with a touch on mobile. Highlight on mobile is rendered as a section-level
 * accent rail rather than inline text shading.
 */

import { useCallback, useMemo, useState } from "react";

import type { ContentSection } from "@/content/markdown";
import { useMarginalia } from "./AuthContext";
import { newMark } from "./store";
import type { MarginMark } from "./types";

const QUOTE_MAX = 180;

/** A readable snippet for a section: strip markdown markers, take the lead. */
function sectionQuote(markdown: string): string {
  const text = markdown
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/[*_`>#-]/g, " ") // inline markers / bullets
    .replace(/\s+/g, " ")
    .trim();
  return text.length > QUOTE_MAX ? `${text.slice(0, QUOTE_MAX).trimEnd()}…` : text;
}

export function useSuttaMarginalia(slug: string, locale: string) {
  const { marks, add, updateNote, remove, signedIn } = useMarginalia();

  const [composer, setComposer] = useState<
    | { mode: "add"; section: ContentSection }
    | { mode: "edit"; mark: MarginMark }
    | null
  >(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const marksForSlug = useMemo(
    () => marks.filter((m) => m.slug === slug),
    [marks, slug],
  );

  const markedAnchors = useMemo(
    () => new Set(marksForSlug.map((m) => m.anchor)),
    [marksForSlug],
  );

  const beginAdd = useCallback((section: ContentSection) => {
    setComposer({ mode: "add", section });
  }, []);

  const beginEdit = useCallback((mark: MarginMark) => {
    setComposer({ mode: "edit", mark });
  }, []);

  const closeComposer = useCallback(() => setComposer(null), []);

  const saveComposer = useCallback(
    (note: string | null) => {
      if (!composer) return;
      if (composer.mode === "add") {
        const quote = sectionQuote(composer.section.markdown);
        add(
          newMark({
            slug,
            locale,
            anchor: composer.section.id,
            quote,
            prefix: "",
            suffix: "",
            note,
            color: "amber",
          }),
        );
      } else {
        updateNote(composer.mark.id, note);
      }
      setComposer(null);
    },
    [composer, add, updateNote, slug, locale],
  );

  const composerQuote =
    composer?.mode === "add"
      ? sectionQuote(composer.section.markdown)
      : composer?.mode === "edit"
        ? composer.mark.quote
        : "";

  const composerInitialNote =
    composer?.mode === "edit" ? composer.mark.note : null;

  return {
    signedIn,
    marksForSlug,
    markedAnchors,
    panelOpen,
    setPanelOpen,
    beginAdd,
    beginEdit,
    remove,
    // composer wiring
    composerVisible: composer != null,
    composerQuote,
    composerInitialNote,
    saveComposer,
    closeComposer,
  };
}
