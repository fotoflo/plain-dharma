# Bug-fix reports

Short post-mortems for non-trivial bugs: symptom → root cause → fix → key rule.
Written for whoever (human or agent) hits something similar later.

## Naming

`NNN-kebab-slug.md`, where `NNN` is a zero-padded sequence number in
**chronological order** of when the bug was fixed (see each file's `**Date**`).
The number is just an ordering label — nothing references these files by number,
so they can be renamed freely.

## Avoiding number collisions

The sequence is a single global counter, and this repo is often worked on by
several concurrent branches/agents. Two branches each grabbing "the next number"
independently will collide (this has happened — e.g. two `007`s and two `011`s,
cleaned up in the renumber that added this README).

To avoid it:

- **Assign the final number at merge time, not when you start.** Pick `ls`'s
  current highest + 1 just before committing.
- If you author concurrently and a collision still lands on `main`, fix it with a
  cheap chronological renumber (`git mv`) — nothing links to these by number.
