/**
 * Word-level drag-to-select for the mobile reader — the closest practical
 * mirror of the web's Selection-API + floating-toolbar flow.
 *
 * The web anchors to an exact DOM Range; react-native-markdown-display renders
 * Markdown to native <Text> with no Range API. To recover a selection we render
 * every body word as its own measurable <Text> span (see MarkdownRenderer's
 * `text` rule in word-selection mode), record each word's frame in a stable
 * section-local coordinate space, then hit-test a `Gesture.Pan` drag against
 * those frames to compute an inclusive start..end word range. The range maps
 * back to the section's plain text to build a W3C-style text-quote selector
 * (`prefix`/`quote`/`suffix`), so a highlight created by dragging here resolves
 * to an inline <mark> on plaindharma.com and a `?h=` link round-trips both ways.
 *
 * Word indices are assigned in document order: the section resets the per-render
 * counter (see SelectableSection) before its children render, and the `text`
 * rule increments it as it emits each word, so the same word keeps the same
 * index across re-renders. Whitespace and punctuation snap to whole words.
 */

import { createContext, useContext, type RefObject } from "react";
import type { View } from "react-native";

export interface WordFrame {
  /** Section-global word index (document order). */
  index: number;
  /** The rendered word text (markdown markers already stripped by the leaf). */
  text: string;
  /** Section-local geometry, filled in by measureLayout. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Inclusive word-index range, normalized so start <= end. */
export interface WordRange {
  start: number;
  end: number;
}

export interface WordSelectionContextValue {
  /** True while a drag selection is in progress / settled (renders washes). */
  active: boolean;
  /** Hand back a stable index for the next word in document order. */
  nextWordIndex: () => number;
  /** Register / update a word's measured frame. */
  setFrame: (frame: WordFrame) => void;
  /** Whether a given word index is inside the current selection. */
  isSelected: (index: number) => boolean;
  /** The section host view to measure word frames against (section-local space). */
  sectionRef: RefObject<View | null>;
  /** Resting selection wash for the current theme. */
  washColor: string;
}

/**
 * Provided by SelectableSection, consumed by MarkdownRenderer's word-mode `text`
 * rule. Null outside a selectable section (renderer falls back to plain text).
 */
export const WordSelectionContext = createContext<WordSelectionContextValue | null>(null);

export function useWordSelectionContext(): WordSelectionContextValue | null {
  return useContext(WordSelectionContext);
}

/** Normalize a raw start/end pair into an inclusive ascending range. */
export function normalizeRange(a: number, b: number): WordRange {
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

/**
 * Hit-test a section-local point against the measured word frames, returning the
 * nearest word index (or null if there are no frames yet). Prefers a frame that
 * contains the point; otherwise picks the frame on the touched line (closest in
 * y) whose x is nearest, so dragging into the gaps between words still snaps to a
 * sensible word.
 */
export function hitTestWord(
  frames: Map<number, WordFrame>,
  px: number,
  py: number,
): number | null {
  let best: number | null = null;
  let bestScore = Infinity;
  for (const f of frames.values()) {
    const inX = px >= f.x && px <= f.x + f.width;
    const inY = py >= f.y && py <= f.y + f.height;
    if (inX && inY) return f.index; // direct hit — done
    // Distance metric: vertical distance dominates (pick the right line first),
    // then horizontal distance to the word's nearest edge.
    const dy = py < f.y ? f.y - py : py > f.y + f.height ? py - (f.y + f.height) : 0;
    const dx = px < f.x ? f.x - px : px > f.x + f.width ? px - (f.x + f.width) : 0;
    const score = dy * 1000 + dx;
    if (score < bestScore) {
      bestScore = score;
      best = f.index;
    }
  }
  return best;
}

/** The bounding box (section-local) of an inclusive word range. */
export function rangeBounds(
  frames: Map<number, WordFrame>,
  range: WordRange,
): { x: number; y: number; width: number; height: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = false;
  for (let i = range.start; i <= range.end; i++) {
    const f = frames.get(i);
    if (!f) continue;
    found = true;
    minX = Math.min(minX, f.x);
    minY = Math.min(minY, f.y);
    maxX = Math.max(maxX, f.x + f.width);
    maxY = Math.max(maxY, f.y + f.height);
  }
  if (!found) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
