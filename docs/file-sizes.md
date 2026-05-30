# File Size Snapshots

## 2026-05-30 (current)

### Distribution

| Bucket     | Count | Δ vs prev |
|------------|-------|-----------|
| <=50       | 135   | -22       |
| 51-150     | 127   | +1        |
| 151-300    | 44    | —         |
| 301-500    | 11    | —         |
| 501-1000   | 4     | —         |
| 1001-2000  | 0     | —         |
| 2000+      | 0     | —         |

Total files: 321 (-21)

### Largest File

`src/components/AudioPlayer.tsx` — 647 lines

### Files Over 500 Lines

4 files exceed the 500-line guideline:
- `src/components/AudioPlayer.tsx` — 647 lines
- 3 additional files

### Delta

Significant contraction: 21 fewer files (342 → 321). The <=50 bucket dropped by 22 files; 51-150 gained +1. Net result suggests cleanup/consolidation — likely artifact directories (`.temp/`, build outputs, or similar) were removed. Distribution shape remains healthy; no files crossed thresholds. AudioPlayer.tsx stays stable at 647 lines.

## 2026-05-29 (previous)

### Distribution

| Bucket     | Count | Δ vs prev |
|------------|-------|-----------|
| <=50       | 157   | +3        |
| 51-150     | 126   | +1        |
| 151-300    | 44    | —         |
| 301-500    | 11    | -1        |
| 501-1000   | 4     | —         |
| 1001-2000  | 0     | —         |
| 2000+      | 0     | —         |

Total files: 342 (+1)

### Largest File

`src/components/AudioPlayer.tsx` — 647 lines

### Files Over 500 Lines

4 files exceed the 500-line guideline:
- `src/components/AudioPlayer.tsx` — 647 lines
- 3 additional files

### Delta

Minor growth: one net file added (342 vs 341). Slight migration upward in distribution—three small files consolidated into the 51–150 bracket (+1 in that bucket), and one file fell from 301–500 into a smaller bracket. AudioPlayer.tsx remains the largest at 647 lines; no threshold shifts in the 501+ buckets.

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
