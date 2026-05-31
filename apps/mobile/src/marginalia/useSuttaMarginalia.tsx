/**
 * Reading-screen glue for Margin Notes on one sutta.
 *
 * Owns the picker / composer / panel / share / save-prompt state and the
 * derived data the reader needs. Creation flow now mirrors the web's intent as
 * closely as RN allows:
 *
 *   long-press a section → SentencePicker (pick a sentence or the whole passage)
 *   → NoteComposer (optional note + highlight color) → mark saved.
 *
 * The saved mark carries a real `quote` + `prefix`/`suffix` text-quote selector
 * anchored to the section id, so it round-trips with the web: a sentence
 * highlighted here resolves to an inline `<mark>` on plaindharma.com, and a
 * web-created mark paints inline here (see `inlineHighlightsFor`).
 *
 * ── Parity limitation (documented) ─────────────────────────────────────────
 * The web anchors to an exact DOM text *Range* (arbitrary sub-sentence
 * selection via the browser's Selection API). react-native-markdown-display
 * renders Markdown to native views with no DOM/Range API and RN's text
 * selection can't drive a custom toolbar, so mobile's finest creation grain is
 * a *sentence* (or the whole passage). A reader can't, on mobile, highlight a
 * three-word fragment mid-sentence the way the web can. Inline rendering has a
 * matching limit: a quote that straddles markdown styling (bold/italic/links)
 * lands across multiple render leaves and falls back to the section accent rail
 * instead of inline shading. Everything else — the data model, the table, the
 * share link, sentence-grain highlights — is at parity.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getMeta } from "@plain-dharma/content";
import type { Locale, SuttaSlug } from "@plain-dharma/content";
import type { ContentSection } from "@/content/markdown";
import type { InlineHighlight } from "@/components/MarkdownRenderer";
import { useMarginalia } from "./AuthContext";
import { resolveColorKey, type HighlightColorKey } from "./colors";
import { sectionPlainText, sectionQuote, selectorForQuote, splitSentences } from "./sections";
import { buildSharePayload, type SharePayload } from "./share";
import { newMark } from "./store";
import type { MarginMark } from "./types";

// Mirrors the web's `pd-mn-prompt` localStorage guard: show the save nudge once.
const PROMPT_KEY = "pd-mn-prompt";

export function useSuttaMarginalia(slug: string, locale: Locale) {
  const { marks, add, updateMark, remove, signedIn, signInWithEmail } = useMarginalia();

  // Section currently being annotated (sentence picker is open for it).
  const [picking, setPicking] = useState<ContentSection | null>(null);
  const [composer, setComposer] = useState<
    | { mode: "add"; section: ContentSection; quote: string }
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
        .map((m) => ({ markId: m.id, quote: m.quote, color: m.color })),
    [marksForSlug],
  );

  /* ── creation flow ──────────────────────────────────────────────────────── */
  const beginAdd = useCallback((section: ContentSection) => setPicking(section), []);

  const pickSentence = useCallback(
    (quote: string) => {
      if (!picking) return;
      setComposer({ mode: "add", section: picking, quote });
      setPicking(null);
    },
    [picking],
  );

  const beginEdit = useCallback((mark: MarginMark) => {
    setComposer({ mode: "edit", mark });
  }, []);

  const closeComposer = useCallback(() => setComposer(null), []);
  const closePicker = useCallback(() => setPicking(null), []);

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

  const saveComposer = useCallback(
    (note: string | null, color: HighlightColorKey) => {
      if (!composer) return;
      if (composer.mode === "add") {
        const plain = sectionPlainText(composer.section.markdown);
        const sel = selectorForQuote(composer.section.id, plain, composer.quote);
        add(
          newMark({
            slug,
            locale,
            anchor: sel.anchor,
            quote: sel.quote,
            prefix: sel.prefix,
            suffix: sel.suffix,
            note,
            color,
          }),
        );
        showToast(note ? "Note saved" : "Highlighted");
        void maybePromptSave();
      } else {
        updateMark(composer.mark.id, { note, color });
        showToast("Note saved");
      }
      setComposer(null);
    },
    [composer, add, updateMark, slug, locale, showToast, maybePromptSave],
  );

  /* ── share ──────────────────────────────────────────────────────────────── */
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
      ? composer.quote
      : composer?.mode === "edit"
        ? composer.mark.quote
        : "";
  const composerInitialNote = composer?.mode === "edit" ? composer.mark.note : null;
  const composerInitialColor =
    composer?.mode === "edit" ? composer.mark.color : undefined;

  // Sentence list + whole-passage snippet for the open picker.
  const pickerPlain = picking ? sectionPlainText(picking.markdown) : "";
  const pickerSentences = useMemo(() => splitSentences(pickerPlain), [pickerPlain]);
  const pickerWhole = picking ? sectionQuote(picking.markdown) : "";

  return {
    signedIn,
    marksForSlug,
    markedAnchors,
    inlineHighlightsFor,
    panelOpen,
    setPanelOpen,
    // creation
    beginAdd,
    beginEdit,
    remove: removeMark,
    // sentence picker
    pickerVisible: picking != null,
    pickerSentences,
    pickerWhole,
    pickSentence,
    closePicker,
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
