/**
 * One reader passage with native text selection.
 *
 * Renders the section's Markdown through MarkdownRenderer in `selectable` mode:
 * each paragraph becomes a real iOS UITextView (react-native-uitextview), so the
 * user gets the native press-and-drag selection grabbers + loupe. When a
 * selection settles, MarkdownRenderer hands up the selected text; we turn it into
 * a {sectionId, quote} result for the reader to anchor a highlight/note/share.
 *
 * This replaced an attempt to measure every word's frame and hit-test a custom
 * drag — impossible on iOS, where a <Text> nested in a <Text> is an
 * attributed-string run with no view/onLayout. Saved highlights still paint
 * inline (passed straight through to MarkdownRenderer).
 */

import { memo } from "react";

import type { InlineHighlight, SelectionRect } from "@/components/MarkdownRenderer";
import type { ContentSection } from "@/content/markdown";
import { SelectableSectionText } from "./SelectableSectionText";

/** A settled selection handed up to the reader to open the toolbar. */
export interface SelectionResult {
  sectionId: string;
  /** The selected text (whitespace-collapsed) — the selector quote. */
  quote: string;
  /** Selection bounding rect in window coordinates, for toolbar anchoring. */
  rect: SelectionRect;
}

interface SelectableSectionProps {
  section: ContentSection;
  highlights: InlineHighlight[];
  onPressHighlight: (markId: string) => void;
  /** Fired when a native selection settles on a non-empty quote. */
  onSelect: (result: SelectionResult) => void;
  /** Fired when the native selection collapses — reader closes the toolbar. */
  onSelectionCleared: () => void;
  /** Tap on a paragraph (its plain text) — the source-peek sheet. Must be
      referentially stable, like the other callbacks (see memo note below). */
  onPressParagraph?: (text: string) => void;
}

/**
 * Memoized so opening the selection toolbar (a parent state change) does NOT
 * re-render the section's text. Re-rendering the UITextView subtree mid-gesture
 * makes iOS drop the live native selection (the magnifier blinks out and the
 * drag dies after ~1s). We only re-render when this section's own content or its
 * painted highlights change; the callbacks must be referentially stable from the
 * reader (useCallback) for this guard to hold — which is why `onSelect` reports
 * `sectionId` rather than closing over `section`.
 */
function SelectableSectionImpl({
  section,
  highlights,
  onPressHighlight,
  onSelect,
  onSelectionCleared,
  onPressParagraph,
}: SelectableSectionProps) {
  return (
    <SelectableSectionText
      markdown={section.markdown}
      highlights={highlights}
      onPressHighlight={onPressHighlight}
      onSelectQuote={(quote, rect) => onSelect({ sectionId: section.id, quote, rect })}
      onSelectionCleared={onSelectionCleared}
      onPressParagraph={onPressParagraph}
    />
  );
}

/** Highlights compared by content (the reader hands a fresh array each render). */
function sameHighlights(a: InlineHighlight[], b: InlineHighlight[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].markId !== b[i].markId || a[i].quote !== b[i].quote || a[i].color !== b[i].color)
      return false;
  }
  return true;
}

export const SelectableSection = memo(
  SelectableSectionImpl,
  (prev, next) =>
    prev.section === next.section &&
    prev.onPressHighlight === next.onPressHighlight &&
    prev.onSelect === next.onSelect &&
    prev.onSelectionCleared === next.onSelectionCleared &&
    prev.onPressParagraph === next.onPressParagraph &&
    sameHighlights(prev.highlights, next.highlights),
);
