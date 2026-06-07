# 010 — React Native: Sutta Title Header Not Selectable on iOS

**Date:** 2026-06-03  
**Severity:** Medium  
**Component:** apps/mobile sutta reader text selection  

## Symptom

On the mobile (Expo/iOS) sutta reader, drag-and-drop text highlighting worked on chapter body text and section headings — but NOT on the page header (title, subtitle, and Pali-name kicker). The selection system treated the header as non-interactive and skipped it during highlight/quote capture.

## Root Cause

The reader title block in `apps/mobile/src/app/[slug].tsx` rendered the three header components (Pali-name kicker, title, and subtitle) as plain React Native `<Text>` elements:

```typescript
// BEFORE: apps/mobile/src/app/[slug].tsx
<Text style={styles.kicker}>{paliName}</Text>
<Text style={styles.title}>{title}</Text>
<Text style={styles.subtitle}>{subtitle}</Text>
```

**The problem:** Plain `<Text>` has no native iOS text selection support. Only `react-native-uitextview` (a native iOS component wrapper) can be selected and measured on iOS. Since the title strings come from frontmatter metadata (SUTTA_META), not from the section Markdown, they were never part of the selectable pipeline (`SelectableSectionText`, which renders each body section as one `react-native-uitextview`).

Additionally, there was no synthetic section entry in the marginalia engine to resolve selected quotes from the header to a text-quote selector.

## The Fix

Extracted the selection/highlight rendering core into a reusable component, then wrapped the title header in the same selectable system as body sections:

### 1. Created SelectableRuns Component
**New file:** `apps/mobile/src/marginalia/SelectableRuns.tsx`

Draws styled inline "runs" (strings with individual RunStyle formatting) as one selectable `react-native-uitextview`, paints highlights atop the view, and reports selection events as `{quote, rect}`:

```typescript
// AFTER: apps/mobile/src/marginalia/SelectableRuns.tsx
export function SelectableRuns({
  runs,
  sectionId,
  onSelect,
  highlights,
}: SelectableRunsProps) {
  return (
    <View style={styles.container}>
      <UITextView
        runs={runs}
        onSelectionChange={(selection) => {
          const quote = extractQuoteFromSelection(selection, runs);
          onSelect({ quote, sectionId, rect: ... });
        }}
      />
      {highlights.map((h) => (
        <HighlightPaint key={h.id} highlight={h} runs={runs} />
      ))}
    </View>
  );
}
```

### 2. Created SelectableTitle Component
**New file:** `apps/mobile/src/marginalia/SelectableTitle.tsx`

Renders kicker + title + subtitle as styled runs in a single selectable `UITextView`, anchored to synthetic section id `TITLE_SECTION_ID = "title"`:

```typescript
// AFTER: apps/mobile/src/marginalia/SelectableTitle.tsx
export const TITLE_SECTION_ID = "title";

export function SelectableTitle({
  paliName,
  title,
  subtitle,
  onSelect,
  highlights,
}: SelectableTitleProps) {
  const runs: Run[] = [
    { text: paliName, style: "kicker" },
    { text: "\n" },
    { text: title, style: "h1" },
    { text: "\n" },
    { text: subtitle, style: "subtitle" },
  ];

  return (
    <SelectableRuns
      runs={runs}
      sectionId={TITLE_SECTION_ID}
      onSelect={onSelect}
      highlights={highlights}
    />
  );
}
```

### 3. Updated Sutta Page to Mount SelectableTitle
**Updated:** `apps/mobile/src/app/[slug].tsx`

- Rendered `<SelectableTitle>` instead of three separate `<Text>` elements
- Built a synthetic `titleSection` ContentSection entry so the marginalia engine can resolve a selected quote to a text-quote selector:

```typescript
// AFTER: apps/mobile/src/app/[slug].tsx
const titleSection: ContentSection = {
  id: TITLE_SECTION_ID,
  type: "title",
  runs: buildTitleRuns(paliName, title, subtitle),
};

// Prepend to sections list so quote resolution finds it
const allSections = [titleSection, ...bodyS ections];

<SelectableTitle
  paliName={paliName}
  title={title}
  subtitle={subtitle}
  onSelect={handleSelect}
  highlights={getHighlightsForSection(TITLE_SECTION_ID)}
/>
```

### 4. Extended RunStyle Type
**Updated:** `apps/mobile/src/marginalia/sectionRuns.ts`

Added three new run style variants to support header formatting:

```typescript
// AFTER: apps/mobile/src/marginalia/sectionRuns.ts
export type RunStyle =
  | "body"
  | "bold"
  | "italic"
  | "bold-italic"
  | "link"
  | "kicker"      // ← new
  | "h1"          // ← new
  | "subtitle";   // ← new
```

### Trade-off
Inside a single `UITextView`, the title's per-line block margins become line breaks (iOS limitation — selection cannot cross separate text views). This is acceptable because:
1. The title is visually compact (3–4 lines max)
2. Users can now highlight all of it in one selection
3. The minor line-spacing reduction is less disruptive than non-selection

## Key Rule

**Plain React Native `<Text>` cannot be selected on iOS; only `react-native-uitextview` supports native text selection.** For any selectable content (body text, headers, metadata), use `react-native-uitextview` (wrapped in a component like `SelectableRuns`) instead of plain `<Text>`. This applies even when the content comes from metadata (frontmatter) rather than Markdown — it still needs to be part of the selectable surface.

## Files Involved

- `apps/mobile/src/marginalia/SelectableRuns.tsx` — new component; renders styled text runs as one selectable UITextView
- `apps/mobile/src/marginalia/SelectableTitle.tsx` — new component; wraps kicker + title + subtitle in SelectableRuns with synthetic TITLE_SECTION_ID
- `apps/mobile/src/marginalia/sectionRuns.ts` — extended RunStyle type with "kicker", "h1", "subtitle" variants
- `apps/mobile/src/app/[slug].tsx` — replaced three plain `<Text>` elements with `<SelectableTitle>`, added synthetic titleSection to sections list
