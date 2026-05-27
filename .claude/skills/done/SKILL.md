---
name: done
description: Wrap up a coding session — update docs, lint, then commit. Use when the user says "done", "wrap up", or "finish".
argument-hint: "[optional commit message]"
model: sonnet
---

Wrap up the current coding session.

## Timing & Stats

At the start of EACH phase, run `date +%s` to capture a timestamp. At the end of each phase, capture another timestamp and compute the elapsed time.

After all phases complete, output a summary table like this:

```
/done summary
-----------------------------------------------
Phase                   Time     Count
-----------------------------------------------
Architecture docs       12s      2 updated, 1 created
Bug fix docs             5s      1 created (or "no bug fix")
Lint fix                18s      3 errors fixed, 0 remaining
File sizes              5s       42 files, 1 over 500 lines
Tests + coverage        8s       12 passed, 0 failed, 42% lines
Commit                  3s       1 commit, 14 files staged
Report                  1s       session complete
-----------------------------------------------
Total                   34s
```

Adjust the "Count" column to reflect what actually happened in each phase. Be specific with numbers.

## Determining Session Files

Multiple Claude Code sessions may run concurrently on the same branch, so git history (e.g., `HEAD~3`) is NOT a reliable way to determine which files this session changed.

**Use your own memory of the conversation.** You know every file you read, edited, created, or wrote during this session. Compile that list directly — it's the only reliable source.

To get the list:
1. Review the conversation history for all `Read`, `Edit`, `Write`, `Bash` tool calls that modified files
2. Compile the deduplicated list of file paths — these are your "session files"
3. For line counts, use `.claude/skills/done/session-stats.sh` on your session files, plus check any commits YOU made this session

Do NOT use `HEAD~N` or broad `git diff` ranges — other sessions may have committed in between.

## Productivity Summary

After the phase summary, generate a session productivity report.

Run `.claude/skills/done/session-stats.sh <file1> <file2> ...` with your session files to get modification timestamps and line change stats.

Output:

```
Session productivity
-----------------------------------------------
Session duration:     1h 23m (first change 2:15pm -> last change 3:38pm)
User prompts:         8
Files modified:       14
Files created:        3
Lines changed:        +187 / -42
Areas touched:        src/app/workshop, src/app/page.tsx
-----------------------------------------------
```

The `session-stats.sh` script handles line counts and session duration from modification timestamps.

To count user prompts: count the number of distinct user messages in the current conversation (excluding system messages and tool results).

## Steps

### Phase 0: Gather Session Context

Before launching parallel agents, prepare the context they'll need:

1. **Compile session files** — review the conversation history for all files YOU touched (see "Determining Session Files" above).
2. Run `.claude/skills/done/gather-context.sh` to see current state (git diff stats, existing docs, uncommitted files).
3. Determine: was a bug fixed this session? (needed to decide if bug-fix doc agent should run)
4. Determine: were 3+ files modified? (needed to decide if file-sizes agent should run)

### Parallel Phase: Launch agents for Phases 1-4

**Launch ALL applicable phases as parallel subagents in a single message.** These phases are independent and should run concurrently. Each agent should be given the session file list and enough context to do its work. **Use `model: "haiku"` for all parallel subagents** — these are mechanical tasks (lint, tests, docs templating) that don't need a heavier model.

Always launch these agents:
- **Architecture docs agent**
- **Lint fix agent**
- **Tests agent**

Conditionally launch:
- **Bug fix docs agent** — only if a bug was fixed this session
- **File sizes agent** — only if 3+ files were modified

Each agent's prompt should include the full session file list and instructions from its phase below.

---

#### Agent: Architecture Docs (Phase 1)

Prompt the agent with the session file list and these instructions:

1. Run `ls docs/architecture/` to see existing docs.
2. Identify which feature areas were modified based on the session files.
3. Read the key changed files to understand the current state.
4. For each affected area, check if a doc exists in `docs/architecture/`:
   - If yes, read it and update it to reflect the new state
   - If no, create a new doc following the pattern of existing ones
5. Each architecture doc should include:
   - **Overview**: What this feature/area does
   - **Key files**: File paths and their roles
   - **Data flow**: How data moves through the system (if applicable)
   - **Important patterns**: Conventions, gotchas, or design decisions

Tell the agent to report back what it created/updated.

#### Agent: Bug Fix Docs (Phase 1.5)

**Only launch if the session involved fixing a bug.**

Prompt the agent with the bug details and these instructions:

1. Run `ls docs/bug-fixes/` to find existing reports and determine the next number (e.g., `002`).
2. Create `docs/bug-fixes/NNN-short-description.md` with:
   - **Date** and **Severity** (Critical / High / Medium / Low)
   - **Symptom**: What the user saw. Be specific.
   - **Root Cause**: Technical explanation with code snippets showing the problematic pattern.
   - **Why It Was Hard to Find** (optional): If significant debugging effort was needed.
   - **The Fix**: What was changed and why, with before/after code snippets.
   - **Key Rule**: A one-line rule to prevent this class of bug in the future.
   - **Files Involved**: List of files changed to fix the bug.

Tell the agent to report back the filename it created.

#### Agent: Lint Fix (Phase 2)

Prompt the agent with the session file list and these instructions:

1. Run `.claude/skills/done/lint.sh` to find ESLint violations.
2. Fix lint errors **only in the session files** listed.
3. Re-run `.claude/skills/done/lint.sh` to confirm fixes.
4. Do NOT fix pre-existing errors in untouched files.

Tell the agent to report back how many errors were found and fixed.

#### Agent: File Sizes (Phase 3)

**Only launch if 3+ files were modified this session.**

Prompt the agent with these instructions:

1. Run `.claude/skills/done/file-sizes.sh` to scan all source files and build the size distribution.

2. The script outputs a distribution table (buckets: <=50, 51-150, 151-300, 301-500, 501-1000, 1001-2000, 2000+) with the largest file.

3. Read `docs/file-sizes.md` for the previous snapshot. Show a delta comparison (only rows that changed).

4. Save the new snapshot to `docs/file-sizes.md` with today's date.

Tell the agent to report back the tables and any notable changes.

#### Agent: Tests + Coverage (Phase 4)

Prompt the agent with these instructions:

1. Run `.claude/skills/done/tests.sh` to ensure all tests pass.
2. If tests fail, investigate and fix before reporting.
3. Report back: number of test files, tests passed, tests failed, and duration.

---

### Phase 5: Commit (sequential — after all agents complete)

Wait for all parallel agents to complete, then:

1. Collect results from all agents.
2. Build the commit message using conventional commits:
   - If $ARGUMENTS is provided, use it as the first line
   - Otherwise, draft a summary of the session's changes as the first line
   - Append the session productivity summary to the commit body, formatted like:
     ```
     feat: summary of changes

     Session summary:
     - Duration: 1h 23m
     - User prompts: 8
     - Files modified: 14, created: 3
     - Lines: +187 / -42
     - Lint: 3 errors fixed, 0 remaining in session files
     - File sizes: 29 files, largest 491 lines
     - Tests: 12 passed, 0 failed (or "no test runner")
     - Coverage: Stmts 45% | Lines 42% (if available)
     - Docs: 2 updated, 1 created
     - Areas: src/app/workshop, src/app/page.tsx

     Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
     ```
3. Run `.claude/skills/done/commit.sh "commit message" file1 file2 ...` with all relevant changed files (including docs, lint fixes, and any test fixes from agents).
4. The script stages, commits, and runs `git status` to confirm everything is clean.

### Phase 5.5: Sync new skills to user level

Check if any skills in this project's `.claude/skills/` are missing from the user-level `~/.claude/skills/`. For each skill directory that exists in the project but not at the user level:

1. Copy the entire skill directory to `~/.claude/skills/<skill-name>/`
2. Report which skills were copied

Skip skills that already exist at the user level (don't overwrite — the user-level version may have been customized). Only copy net-new skills.

### Phase 6: Report (sequential)

1. Output the `/done summary` table and `Session productivity` block (see Timing & Stats above).

2. **ASCII art** — draw a simple ASCII art representation of the main page or UI that was built/changed this session. Include key elements like layout, sections, or content that reflect what was worked on. Keep it fun and recognizable. **IMPORTANT: Use ONLY plain ASCII characters** (`+`, `-`, `|`, `=`, `*`, `#`, `/`, `\`, letters, numbers). Do NOT use Unicode box-drawing, block elements, or special arrows — they misalign in the terminal.

3. **Goodbye message** — end with a dramatic, fun goodbye message wrapped in `***#$(*#$)` and `($#*)$#***` markers. Include 3-4 lines celebrating what was accomplished in the session, referencing specific technical wins or funny moments from the work. End with "done."

## Rules

- Focus on documenting the CURRENT state, not the history of changes
- Keep docs concise — aim for quick reference, not exhaustive documentation
- Don't document trivial changes (typo fixes, formatting)
- Match the style of existing docs in `docs/architecture/`
- Only fix lint errors in files you changed this session — don't go on a codebase-wide cleanup
- NEVER use `--no-verify`, `--amend`, or force push
- NEVER commit `.env`, secrets, or credential files
- Do NOT push unless the user explicitly asks
