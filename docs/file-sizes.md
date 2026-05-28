# File Size Snapshots

## 2026-05-29 (current)

### Distribution

| Bucket     | Count | Δ vs prev |
|------------|-------|-----------|
| <=50       | 156   | +2        |
| 51-150     | 125   | +1        |
| 151-300    | 44    | -3        |
| 301-500    | 11    | -1        |
| 501-1000   | 4     | —         |
| 1001-2000  | 0     | —         |
| 2000+      | 0     | —         |

Total files: 340 (-1)

### Largest File

`src/components/AudioPlayer.tsx` — 647 lines

### Files Over 500 Lines

4 files exceed the 500-line guideline:
- `src/components/AudioPlayer.tsx` — 647 lines
- 3 additional files

### Delta

Content de-duplication: `src/content` lost its 12 duplicate sutta MDX files and the `strings/drops/canonical-links/glossary` modules, while `src/content/{index,audio}.ts` shrank to thin re-export shims — hence the drop in the 151–300 bracket and a slightly lower total (the canonical copies live on in `packages/content`). No threshold-crossing files; the 501–1000 bucket holds steady at 4.

## 2026-05-28 (previous)

### Distribution

| Bucket     | Count | Δ vs prev |
|------------|-------|-----------|
| <=50       | 154   | —         |
| 51-150     | 124   | +1        |
| 151-300    | 47    | -1        |
| 301-500    | 12    | +2        |
| 501-1000   | 4     | —         |
| 1001-2000  | 0     | —         |
| 2000+      | 0     | —         |

Total files: 341 (+2)

### Largest File

`src/components/AudioPlayer.tsx` — 647 lines

### Files Over 500 Lines

4 files exceed the 500-line guideline:
- `src/components/AudioPlayer.tsx` — 647 lines
- 3 additional files

### Delta

Minor consolidation: two files moved into the 301–500 bracket (likely from contact form and contribute view additions), one file shrunk out of 151–300. AudioPlayer.tsx remains the largest at 647 lines. No new threshold-crossing files; the 501-1000 bucket remains stable at 4 files.

## 2026-05-28 (previous)

### Distribution

| Bucket     | Count | Δ vs 2026-05-27 |
|------------|-------|-----------------|
| <=50       | 47    | +21             |
| 51-150     | 39    | +8              |
| 151-300    | 14    | +5              |
| 301-500    | 3     | 0               |
| 501-1000   | 1     | +1              |
| 1001-2000  | 0     | 0               |
| 2000+      | 0     | 0               |

Total files: 104 (+35)

### Largest File

`src/components/AudioPlayer.tsx` — 508 lines

### Files Over 500 Lines

1 file: `src/components/AudioPlayer.tsx`

### Delta

Repo continued to expand (69 → 104 files, +35). Most growth in small files (<=50 and 51-150 brackets). AudioPlayer.tsx crossed the 500-line threshold, now 508 lines. First file to exceed the 500-line guideline — candidate for refactoring.

## 2026-05-27

### Distribution

| Bucket     | Count | Δ vs 2026-05-26 |
|------------|-------|-----------------|
| <=50       | 26    | +11             |
| 51-150     | 31    | +18             |
| 151-300    | 9     | +4              |
| 301-500    | 3     | +3              |
| 501-1000   | 0     | 0               |
| 1001-2000  | 0     | 0               |
| 2000+      | 0     | 0               |

Total files: 69 (+36)

### Largest File

`src/components/AudioPlayer.tsx` — 440 lines

### Files Over 500 Lines

None.

### Delta

Repo roughly doubled in file count since first snapshot (33 → 69) — audio, downloads,
checkout/donate flow, OG card system, and newsletter signup all landed. Three files
crossed into the 301–500 bucket but none exceeded the 500-line guideline. Largest
file shifted from `globals.css` to `AudioPlayer.tsx` as audio playback matured.

## 2026-05-26 (first snapshot)

### Distribution

| Bucket     | Count |
|------------|-------|
| <=50       | 15    |
| 51-150     | 13    |
| 151-300    | 5     |
| 301-500    | 0     |
| 501-1000   | 0     |
| 1001-2000  | 0     |
| 2000+      | 0     |

Total files: 33

### Largest File

`src/app/globals.css` — 281 lines

### Files Over 500 Lines

None.

### Delta

First snapshot — no previous data to compare.
