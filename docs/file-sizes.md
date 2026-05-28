# File Size Snapshots

## 2026-05-28 (current)

### Distribution

| Bucket     | Count | Δ vs 2026-05-27 |
|------------|-------|-----------------|
| <=50       | 149   | +88             |
| 51-150     | 99    | +58             |
| 151-300    | 40    | +25             |
| 301-500    | 10    | +6              |
| 501-1000   | 3     | +2              |
| 1001-2000  | 0     | 0               |
| 2000+      | 0     | 0               |

Total files: 301 (+179)

### Largest File

`src/components/AudioPlayer.tsx` — 601 lines

### Files Over 500 Lines

3 files (AudioPlayer.tsx exceeds the 500-line guideline):
- `src/components/AudioPlayer.tsx` — 601 lines
- (2 additional files not listed above)

### Delta

Significant growth: 122 → 301 files (+179, +147% increase). Expansion across all buckets, with most growth in small files (<=50 and 51-150). AudioPlayer.tsx grew from 508 to 601 lines, deepening the need for refactoring. Two additional files now exceed 500 lines. Codebase expanded substantially — likely due to locale support (`zh`), downloads feature, and other features landed recently.

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
