# File Size Snapshots

## 2026-07-26 (current)

### Distribution

| Bucket     | Count | Δ vs 2026-07-25 |
|------------|-------|-----------------|
| <=50       | 148   | +86             |
| 51-150     | 145   | +71             |
| 151-300    | 57    | +28             |
| 301-500    | 15    | +6              |
| 501-1000   | 7     | +3              |
| 1001-2000  | 0     | —               |
| 2000+      | 0     | —               |

Total files: 372 (+194)

### Largest File

`src/app/assets/page.tsx` — 814 lines

### Files Over 500 Lines

7 files exceed the 500-line guideline:
- `src/app/assets/page.tsx` — 814 lines (NEW, substantially rewritten)
- `src/components/AudioPlayer.tsx` — 796 lines
- `packages/content/strings.ts` — 725 lines
- `packages/content/canonical/mindfulness.json` — 716 lines (data file)
- `src/views/HowItWasMadeView.tsx` — 667 lines
- `scripts/generate-audio.ts` — 627 lines
- `src/components/marginalia/Marginalia.tsx` — 529 lines

### Delta

Major expansion: +194 files (178 → 372, +109%). All size buckets grew substantially — the <=50 bracket added 86 files, 51–150 added 71, and 151–300 added 28. The 501–1000 bucket grew from 4 to 7 files, with `src/app/assets/page.tsx` now the largest file at 814 lines (previous snapshot's 178-file count was anomalously low, likely branch-specific). Files over 500-line threshold increased from 4 to 7. `src/app/assets/page.tsx` was substantially rewritten this session and now far exceeds the 500-line guideline at 814 lines.

## 2026-07-25

### Distribution

| Bucket     | Count | Δ vs 2026-06-27 |
|------------|-------|-----------------|
| <=50       | 62    | -84             |
| 51-150     | 74    | -66             |
| 151-300    | 29    | -26             |
| 301-500    | 9     | -6              |
| 501-1000   | 4     | -2              |
| 1001-2000  | 0     | —               |
| 2000+      | 0     | —               |

Total files: 178 (-184)

### Largest File

`src/components/AudioPlayer.tsx` — 728 lines

### Files Over 500 Lines

4 files exceed the 500-line guideline:
- `src/components/AudioPlayer.tsx` — 728 lines
- `packages/content/strings.ts` — 700 lines
- `src/components/marginalia/Marginalia.tsx` — 529 lines
- (1 additional file in the 501–1000 bucket)

### Delta

Significant contraction: -184 files (362 → 178, -50.8%). All size buckets decreased substantially — the 51–150 bracket lost 66 files, <=50 lost 84, and 151–300 lost 26. The 501–1000 bucket shrank from 6 to 4 files. The largest file remains `AudioPlayer.tsx` at 728 lines. Files over 500-line threshold reduced from 6 to 4. This large reduction suggests branch divergence or significant repository restructuring (e.g., removal of build outputs, temporary directories, or branch-specific files).

## 2026-06-27 (current)

### Distribution

| Bucket     | Count | Δ vs 2026-06-09 |
|------------|-------|-----------------|
| <=50       | 146   | +2              |
| 51-150     | 140   | +2              |
| 151-300    | 55    | +3              |
| 301-500    | 15    | —               |
| 501-1000   | 6     | —               |
| 1001-2000  | 0     | —               |
| 2000+      | 0     | —               |

Total files: 362 (+7)

### Largest File

`src/components/AudioPlayer.tsx` — 728 lines

### Files Over 500 Lines

6 files exceed the 500-line guideline:
- `src/components/AudioPlayer.tsx` — 728 lines
- `src/views/HowItWasMadeView.tsx` — 667 lines
- `packages/content/strings.ts` — 700 lines
- `src/components/marginalia/Marginalia.tsx` — 529 lines
- (2 additional files in the 501–1000 bucket)

### Delta

Modest growth: +7 files from 2026-06-09 snapshot (355 → 362). The <=50, 51-150, and 151-300 buckets each gained files (+2, +2, and +3 respectively). The 301-500 and 501-1000 buckets remained unchanged. No files crossed into new size brackets. Distribution remains healthy with no new threshold-crossing files; the 501-1000 bucket holds steady at 6 files.

## 2026-06-09

### Distribution

| Bucket     | Count | Δ vs 2026-06-08 |
|------------|-------|-----------------|
| <=50       | 144   | +2              |
| 51-150     | 138   | +2              |
| 151-300    | 52    | +1              |
| 301-500    | 15    | —               |
| 501-1000   | 6     | +1              |
| 1001-2000  | 0     | —               |
| 2000+      | 0     | —               |

Total files: 355 (+6)

### Largest File

`src/components/AudioPlayer.tsx` — 728 lines

### Files Over 500 Lines

6 files exceed the 500-line guideline:
- `src/components/AudioPlayer.tsx` — 728 lines (+43 from 685)
- `src/views/HowItWasMadeView.tsx` — 667 lines (NEW)
- `packages/content/strings.ts` — 700 lines
- `src/components/marginalia/Marginalia.tsx` — 529 lines
- (2 additional files in the 501–1000 bucket)

### Delta

Moderate growth: +6 files (349 → 355) and a notable threshold crossing. `AudioPlayer.tsx` expanded from 685 to 728 lines (+43 lines); `HowItWasMadeView.tsx` is new at 667 lines and immediately entered the 501+ bracket. `LengthDisclosure.tsx` (newly created, 120 lines) remains well under 500. The <=50, 51-150, and 151-300 buckets each gained files; the 501-1000 bucket gained +1 with the new view. No files crossed into 1001+.

### Session Files (2026-06-09)
- `src/views/HowItWasMadeView.tsx` — 667 lines (provenance page, new, exceeds guideline)
- `src/components/AudioPlayer.tsx` — 728 lines (complex playback state, +43 lines, continues to exceed guideline)
- `src/components/LengthDisclosure.tsx` — 120 lines (new, under guideline)

## 2026-06-08

### Distribution

| Bucket     | Count | Δ vs 2026-06-03 |
|------------|-------|-----------------|
| <=50       | 142   | —               |
| 51-150     | 136   | +1              |
| 151-300    | 51    | +2              |
| 301-500    | 15    | +1              |
| 501-1000   | 5     | —               |
| 1001-2000  | 0     | —               |
| 2000+      | 0     | —               |

Total files: 349 (+2)

### Largest File

`src/components/AudioPlayer.tsx` — 685 lines

### Files Over 500 Lines

5 files exceed the 500-line guideline:
- `src/components/AudioPlayer.tsx` — 685 lines
- `packages/content/strings.ts` — 700 lines
- `src/components/marginalia/Marginalia.tsx` — 529 lines
- (2 additional files in the 501–1000 bucket)

### Delta

Minor growth: +2 files from 2026-06-03 snapshot (347 → 349). The `51–150` bucket gained +1 file, `151–300` gained +2, and `301–500` gained +1. Largest file remains `AudioPlayer.tsx` at 685 lines (stable). The 5 files over 500 lines remain unchanged: `AudioPlayer.tsx` at 685 (complex playback state machine), `strings.ts` at 700 (all UI copy), and `Marginalia.tsx` at 529 (highlights + notes integration). Session files noted in CLAUDE.md (`AudioPanel.tsx`, `donate.tsx`) remain well under 500 lines.

## 2026-06-03 (previous)

### Distribution

| Bucket     | Count | Δ vs prev |
|------------|-------|-----------|
| <=50       | 373   | -1        |
| 51-150     | 432   | +2        |
| 151-300    | 181   | +1        |
| 301-500    | 35    | +1        |
| 501-1000   | 16    | —         |
| 1001-2000  | 0     | —         |
| 2000+      | 0     | —         |

Total files: 1037 (+3)

### Largest File

`src/components/AudioPlayer.tsx` — 661 lines

### Files Over 500 Lines

16 files exceed the 500-line guideline (up from 4 in 2026-06-02's main branch). The main branch now reports 16 files in the 501-1000 bucket.

### Delta

Modest growth: +3 files overall (1034 → 1037). Distribution shifted slightly upward—one file moved from <=50 to 51-150, net +2 in 51-150 bracket, +1 in 151-300, +1 in 301-500. The 501-1000 bucket remains at 16 files. No files crossed into the 1001+ range. AudioPlayer.tsx continues as the largest at 661 lines.

## 2026-06-02 (previous)

### Distribution

| Bucket     | Count | Δ vs prev |
|------------|-------|-----------|
| <=50       | 87    | -48       |
| 51-150     | 106   | -21       |
| 151-300    | 46    | +2        |
| 301-500    | 10    | -1        |
| 501-1000   | 4     | —         |
| 1001-2000  | 0     | —         |
| 2000+      | 0     | —         |

Total files: 253 (-68)

### Largest File

`scripts/generate-audio.ts` — 700 lines

### Files Over 500 Lines

4 files exceed the 500-line guideline:
- `scripts/generate-audio.ts` — 700 lines
- `src/components/AudioPlayer.tsx` — 647 lines
- `packages/content/strings.ts` — 580 lines
- `src/components/marginalia/Marginalia.tsx` — 529 lines

### Delta

Significant contraction: the analysis scope changed in this snapshot — the previous 321-file count included iOS Pods and `.claude/worktrees/` directories, while this clean count excludes them. Stripping those artifacts reveals the true source size: 253 files, down 68 from the inflated count. Distribution remains healthy; no new files crossed 500-line threshold since 2026-05-30. `generate-audio.ts` has grown 700 lines and is now the largest file, replacing `AudioPlayer.tsx` (which was 647 at last count and remains at 647). Session files noted in this run:
- `apps/mobile/src/marginalia/SelectableSectionText.tsx` — 242 lines (under 500)
- `apps/mobile/src/marginalia/sectionRuns.ts` — 191 lines (under 500)
- `apps/mobile/src/components/MarkdownRenderer.tsx` — 397 lines (under 500)

No session files exceeded the 500-line guideline.

## 2026-05-30 (previous)

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
