/**
 * Reading-screen glue for Margin Notes on one sutta.
 *
 * Owns the selection / composer / panel / share / save-prompt state and the
 * derived data the reader needs. The creation flow now mirrors the web's
 * drag-to-select + floating-toolbar UX:
 *
 *   long-press a passage, then drag across it → word-level selection
 *   → floating toolbar: tap a color swatch (highlight now) · Note · Share
 *
 * The selection uses the native iOS UITextView grabbers (see SelectableSection).
 * The settled selection's words are joined into a `quote` and turned into a real
 * `prefix`/`quote`/`suffix` text-quote selector anchored to the section id, so
 * it round-trips with the web: a passage highlighted by dragging here resolves
 * to an inline `<mark>` on plaindharma.com, a `?h=` link opens it on either
 * surface, and a web-created mark paints inline here (see `inlineHighlightsFor`).
 *
 * ── Parity notes (documented) ───────────────────────────────────────────────
 * Granularity is word-level (snap-to-word), not the web's arbitrary character
 * range — close enough that the same drag gesture and toolbar feel carry over.
 * Inline rendering keeps the existing limit: a quote that straddles markdown
 * styling (bold/italic/links) lands across multiple render leaves; if the saved
 * quote can't be located inside a single leaf it falls back to the section
 * accent rail instead of inline shading. Everything else — data model, table,
 * share link, color palette, toolbar ordering — matches the web.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";

import { getMeta } from "@plain-dharma/content";
import type { Locale, SuttaSlug } from "@plain-dharma/content";
import type { ContentSection } from "@/content/markdown";
import type { InlineHighlight, SelectionRect } from "@/components/MarkdownRenderer";
import { useZhConvert } from "@/i18n/LocaleContext";
import { useMarginalia } from "./AuthContext";
import {
  DEFAULT_HIGHLIGHT_COLOR,
  resolveColorKey,
  type HighlightColorKey,
} from "./colors";
import { sectionPlainText, selectorForQuote } from "./sections";
import type { SelectionResult } from "./SelectableSection";
import { buildSharePayload, type SharePayload } from "./share";
import { newMark } from "./store";
import type { AnnotationSelector } from "./textAnchor";
import type { MarginMark } from "./types";

// Mirrors the web's `pd-mn-prompt` localStorage guard: show the save nudge once.
const PROMPT_KEY = "pd-mn-prompt";

/** A settled selection awaiting a toolbar action (highlight / note / share). */
interface PendingSelection {
  sectionId: string;
  selector: AnnotationSelector;
  /** The selection's bounding rect in window coordinates (toolbar anchor). */
  toolbar: SelectionRect;
}

export function useSuttaMarginalia(slug: string, locale: Locale) {
  const { marks, add, updateMark, remove, signedIn, email, signInWithEmail, signOut } =
    useMarginalia();
  // Marks are stored in the canonical Simplified script (web/Supabase parity).
  // In 繁體 view we paint them against the Traditional on-screen text, so convert
  // each stored quote to the display script for matching; and fold a new
  // Traditional selection back to Simplified before it's stored.
  const { toDisplay, toCanonical } = useZhConvert();

  // The settled selection (toolbar open). The native UITextView owns the
  // on-screen selection highlight, so there's no live word-wash to clear —
  // closing just drops `pending`.
  const [pending, setPending] = useState<PendingSelection | null>(null);
  // Single highlight color (web parity — no picker); the composer opens on it.
  const selectionColor = DEFAULT_HIGHLIGHT_COLOR;

  const [composer, setComposer] = useState<
    | { mode: "add"; sectionId: string; selector: AnnotationSelector }
    | { mode: "edit"; mark: MarginMark }
    | null
  >(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [share, setShare] = useState<SharePayload | null>(null);
  const [savePrompt, setSavePrompt] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const title = useMemo(() => {
    if (!slug) return "Plain Dharma";
    const meta = getMeta(locale, slug as SuttaSlug);
    return meta?.title ? `${meta.title} · Plain Dharma` : "Plain Dharma";
  }, [slug, locale]);

  const marksForSlug = useMemo(() => marks.filter((m) => m.slug === slug), [marks, slug]);

  const markedAnchors = useMemo(
    () => new Set(marksForSlug.map((m) => m.anchor)),
    [marksForSlug],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  /** Resolve the inline highlights to paint within a given section. */
  const inlineHighlightsFor = useCallback(
    (section: ContentSection): InlineHighlight[] =>
      marksForSlug
        .filter((m) => m.anchor === section.id && m.quote)
        .map((m) => ({ markId: m.id, quote: toDisplay(m.quote), color: m.color })),
    [marksForSlug, toDisplay],
  );

  /* ── selection → toolbar ─────────────────────────────────────────────────── */

  // A native selection settled in a section. Build a real text-quote selector
  // from the selected text and open the floating toolbar over the selection
  // (rect is in window coordinates, straight from the native event).
  const onSelect = useCallback(
    (result: SelectionResult, section: ContentSection) => {
      // section.markdown + result.quote are in the display script; fold both back
      // to canonical Simplified so the stored selector matches the source text.
      const plain = toCanonical(sectionPlainText(section.markdown));
      const selector = selectorForQuote(
        result.sectionId,
        plain,
        toCanonical(result.quote),
      );
      setPending({
        sectionId: result.sectionId,
        selector,
        toolbar: result.rect,
      });
    },
    [toCanonical],
  );

  const closeSelection = useCallback(() => {
    setPending(null);
  }, []);

  /* ── creation ────────────────────────────────────────────────────────────── */

  // After a first mark while signed out, nudge once (web SavePrompt parity).
  const maybePromptSave = useCallback(async () => {
    if (signedIn) return;
    try {
      const flag = await AsyncStorage.getItem(PROMPT_KEY);
      if (flag) return;
      await AsyncStorage.setItem(PROMPT_KEY, "shown");
    } catch {
      return;
    }
    setSavePrompt(true);
  }, [signedIn]);

  const createMark = useCallback(
    (selector: AnnotationSelector, note: string | null, color: HighlightColorKey) => {
      add(
        newMark({
          slug,
          locale,
          anchor: selector.anchor,
          quote: selector.quote,
          prefix: selector.prefix,
          suffix: selector.suffix,
          note,
          color,
        }),
      );
      showToast(note ? "Note saved" : "Highlighted");
      void maybePromptSave();
    },
    [add, slug, locale, showToast, maybePromptSave],
  );

  // Toolbar: tap a swatch → highlight immediately in that color (web parity:
  // the web's single amber Highlight button creates the mark on tap.
  const highlightSelection = useCallback(() => {
    if (!pending) return;
    createMark(pending.selector, null, DEFAULT_HIGHLIGHT_COLOR);
    closeSelection();
  }, [pending, createMark, closeSelection]);

  // Toolbar: Note → open the composer for the live selection.
  const noteFromSelection = useCallback(() => {
    if (!pending) return;
    setComposer({ mode: "add", sectionId: pending.sectionId, selector: pending.selector });
    setPending(null); // hide the toolbar but keep the section's wash until save
  }, [pending]);

  // Toolbar: Copy → copy the selected passage to the clipboard (web parity:
  // the web toolbar's Copy button copies the quote text).
  const copyFromSelection = useCallback(() => {
    if (!pending) return;
    const quote = pending.selector.quote;
    void Clipboard.setStringAsync(quote).then(
      () => showToast("Passage copied"),
      () => showToast("Something went wrong — try again."),
    );
    closeSelection();
  }, [pending, showToast, closeSelection]);

  // Toolbar: Share → open the share sheet for the live selection.
  const shareFromSelection = useCallback(() => {
    if (!pending) return;
    setShare(buildSharePayload(slug, pending.selector, title));
    closeSelection();
  }, [pending, slug, title, closeSelection]);

  const beginEdit = useCallback((mark: MarginMark) => {
    setComposer({ mode: "edit", mark });
  }, []);

  const closeComposer = useCallback(() => {
    setComposer(null);
    closeSelection();
  }, [closeSelection]);

  const saveComposer = useCallback(
    (note: string | null, color: HighlightColorKey) => {
      if (!composer) return;
      if (composer.mode === "add") {
        createMark(composer.selector, note, color);
      } else {
        updateMark(composer.mark.id, { note, color });
        showToast("Note saved");
      }
      setComposer(null);
      closeSelection();
    },
    [composer, createMark, updateMark, showToast, closeSelection],
  );

  /* ── share (from a saved mark, e.g. the panel) ─────────────────────────────── */
  const shareMark = useCallback(
    (mark: MarginMark) => {
      setShare(
        buildSharePayload(
          mark.slug,
          { anchor: mark.anchor, quote: mark.quote, prefix: mark.prefix, suffix: mark.suffix },
          title,
        ),
      );
    },
    [title],
  );
  const closeShare = useCallback(() => setShare(null), []);

  const removeMark = useCallback(
    (id: string) => {
      remove(id);
      showToast("Removed");
    },
    [remove, showToast],
  );

  /* ── save-prompt sign-in ──────────────────────────────────────────────────── */
  const onSavePromptSend = useCallback(
    async (mail: string) => {
      const res = await signInWithEmail(mail);
      if (res.ok) {
        try {
          await AsyncStorage.setItem(PROMPT_KEY, "sent");
        } catch {
          /* ignore */
        }
      }
      return res;
    },
    [signInWithEmail],
  );

  const composerQuote =
    composer?.mode === "add"
      ? composer.selector.quote
      : composer?.mode === "edit"
        ? composer.mark.quote
        : "";
  const composerInitialNote = composer?.mode === "edit" ? composer.mark.note : null;
  const composerInitialColor =
    composer?.mode === "edit" ? composer.mark.color : selectionColor;

  return {
    signedIn,
    email,
    signOut,
    marksForSlug,
    markedAnchors,
    inlineHighlightsFor,
    panelOpen,
    setPanelOpen,
    // selection
    onSelect,
    closeSelection,
    toolbar: pending?.toolbar ?? null,
    toolbarVisible: pending != null,
    highlightSelection,
    noteFromSelection,
    copyFromSelection,
    shareFromSelection,
    // edit
    beginEdit,
    remove: removeMark,
    // composer
    composerVisible: composer != null,
    composerQuote,
    composerInitialNote,
    composerInitialColor,
    saveComposer,
    closeComposer,
    // share
    share,
    shareMark,
    closeShare,
    // save prompt
    savePromptVisible: savePrompt,
    onSavePromptSend,
    dismissSavePrompt: () => setSavePrompt(false),
    // toast
    toast,
    resolveColorKey,
  };
}
