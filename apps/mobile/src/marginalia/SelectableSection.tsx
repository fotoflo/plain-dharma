/**
 * One reader passage wrapped for drag-to-select.
 *
 * Renders the section's Markdown through MarkdownRenderer in word-selection mode
 * (every body word becomes a measurable <Text>), and drives an inclusive
 * word-range selection from a long-press-then-drag gesture:
 *
 *   long-press inside the passage  → begin a selection at the touched word
 *   drag                            → extend start..end across words
 *   release                         → settle; the reader's floating toolbar opens
 *
 * The gesture's handlers run on the JS thread (`.runOnJS(true)`) so they can read
 * the measured word frames directly — no shared values / worklets, pure JS over
 * gesture-handler, OTA-safe. Selection state lives in React state so the word
 * washes re-render; a ref mirror lets the gesture extend without stale closures.
 *
 * Saved highlights still paint inline (passed straight through to
 * MarkdownRenderer). A live selection sits visually on top via the per-word
 * wash. When nothing is selected this behaves like the old static passage.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { MarkdownRenderer, type InlineHighlight } from "@/components/MarkdownRenderer";
import { useTheme } from "@/theme/ThemeContext";
import { highlightWash, type HighlightColorKey } from "./colors";
import type { ContentSection } from "@/content/markdown";
import {
  WordSelectionContext,
  hitTestWord,
  normalizeRange,
  rangeBounds,
  type WordFrame,
  type WordRange,
  type WordSelectionContextValue,
} from "./selection";

/** A settled selection handed up to the reader to open the toolbar. */
export interface SelectionResult {
  sectionId: string;
  /** Words joined by single spaces — the selector quote. */
  quote: string;
  /** Section-local bounding box of the selection (for toolbar anchoring). */
  bounds: { x: number; y: number; width: number; height: number };
}

export function SelectableSection({
  section,
  highlights,
  selectionColor,
  onPressHighlight,
  onSelect,
  cleared,
}: {
  section: ContentSection;
  highlights: InlineHighlight[];
  /** Color whose wash tints the live selection (the toolbar's active swatch). */
  selectionColor: HighlightColorKey;
  onPressHighlight: (markId: string) => void;
  /** Fired when a drag settles on a non-empty word range. */
  onSelect: (result: SelectionResult, sectionTop: number) => void;
  /** Bumping this token clears the selection (reader closed the toolbar). */
  cleared: number;
}) {
  const { theme } = useTheme();
  const sectionRef = useRef<View>(null);
  const framesRef = useRef<Map<number, WordFrame>>(new Map());
  const sectionTopRef = useRef(0);
  // Latest selection geometry, mirrored for the gesture handlers (which fire
  // outside render). `range` (state) drives the per-word washes; the refs let a
  // drag read the live values without stale closures.
  const rangeRef = useRef<WordRange | null>(null);
  const anchorRef = useRef<number | null>(null);

  const [range, setRange] = useState<WordRange | null>(null);
  const [active, setActive] = useState(false);
  const [seenCleared, setSeenCleared] = useState(cleared);

  const washColor = useMemo(
    () => highlightWash(selectionColor, theme),
    [selectionColor, theme],
  );

  // Clear the live selection when the reader bumps `cleared` (toolbar closed /
  // mark saved). The "adjust state during render" pattern — React re-renders
  // synchronously and only state is touched (the stale refs are harmless: the
  // next drag's onBegin overwrites them before any settle reads them).
  if (seenCleared !== cleared) {
    setSeenCleared(cleared);
    if (range !== null) setRange(null);
    if (active) setActive(false);
  }

  const applyRange = useCallback((next: WordRange | null) => {
    rangeRef.current = next;
    setRange(next);
  }, []);

  const beginAt = useCallback(
    (px: number, py: number) => {
      const hit = hitTestWord(framesRef.current, px, py);
      if (hit == null) return;
      anchorRef.current = hit;
      setActive(true);
      applyRange({ start: hit, end: hit });
    },
    [applyRange],
  );

  const extendTo = useCallback(
    (px: number, py: number) => {
      const anchor = anchorRef.current;
      if (anchor == null) return;
      const hit = hitTestWord(framesRef.current, px, py);
      if (hit == null) return;
      applyRange(normalizeRange(anchor, hit));
    },
    [applyRange],
  );

  const settle = useCallback(() => {
    const r = rangeRef.current;
    if (!r) {
      setActive(false);
      return;
    }
    // Quote = selected words joined by single spaces (matches sectionPlainText's
    // whitespace collapse, so selectorForQuote resolves prefix/suffix cleanly).
    const words: string[] = [];
    for (let i = r.start; i <= r.end; i++) {
      const f = framesRef.current.get(i);
      if (f) words.push(f.text);
    }
    const quote = words.join(" ").trim();
    const bounds = rangeBounds(framesRef.current, r);
    if (!quote || !bounds) {
      setActive(false);
      applyRange(null);
      return;
    }
    onSelect({ sectionId: section.id, quote, bounds }, sectionTopRef.current);
  }, [onSelect, section.id, applyRange]);

  const finalize = useCallback(() => {
    // If the gesture cancelled before settling, drop the partial range.
    if (rangeRef.current == null) setActive(false);
  }, []);

  // Long-press-to-begin, drag-to-extend. `.runOnJS(true)` runs the handlers on
  // the JS thread so they (via the stable useCallbacks) can read the frames map
  // directly — pure JS, no worklets / shared values. Built in a memo so the
  // recognizer is recreated only when a handler identity changes.
  //
  // The handler callbacks read instance refs (frames / anchor / range), which
  // the React-Compiler `react-hooks/refs` lint flags transitively. That's a
  // false positive here: gesture callbacks fire at gesture time, never during
  // render — exactly the "refs are fine in event handlers" case the rule allows
  // when it can see the call site. Suppress only the wiring lines.
  /* eslint-disable react-hooks/refs */
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(300)
        .runOnJS(true)
        .maxPointers(1)
        .onBegin((e) => beginAt(e.x, e.y))
        .onUpdate((e) => extendTo(e.x, e.y))
        .onEnd(() => settle())
        .onFinalize(() => finalize()),
    [beginAt, extendTo, settle, finalize],
  );
  /* eslint-enable react-hooks/refs */

  const setFrame = useCallback((frame: WordFrame) => {
    framesRef.current.set(frame.index, frame);
  }, []);

  const isSelected = useCallback(
    (index: number) => range != null && index >= range.start && index <= range.end,
    [range],
  );

  // A fresh per-render word counter (plain local, not a ref): the section body
  // runs, then the leaf `text` rule calls nextWordIndex in document order, so a
  // word keeps the same index across re-renders without touching a ref.
  const counter = { n: 0 };
  const ctx: WordSelectionContextValue = {
    active,
    nextWordIndex: () => counter.n++,
    setFrame,
    isSelected,
    sectionRef,
    washColor,
  };

  const onLayout = (e: LayoutChangeEvent) => {
    sectionTopRef.current = e.nativeEvent.layout.y;
  };

  return (
    <GestureDetector gesture={pan}>
      <View ref={sectionRef} onLayout={onLayout} collapsable={false}>
        <WordSelectionContext.Provider value={ctx}>
          <MarkdownRenderer highlights={highlights} onPressHighlight={onPressHighlight}>
            {section.markdown}
          </MarkdownRenderer>
        </WordSelectionContext.Provider>
      </View>
    </GestureDetector>
  );
}
