---
name: post-dharma
description: Daily Plain Dharma posting run — queue today's quote Short on our own accounts through BlastCP, then post in Facebook groups, reply on Threads and comment in groups through Chrome, and report to Slack. Runs on the m1mini. Use when the user says "post dharma", "run the posting", or a cron fires it with a window (A or B).
---

# post-dharma

One run = one **window**. The cron says which:

| Window | Bangkok time | Who's awake | This run does |
|---|---|---|---|
| **A** | 14:00–17:00 | UK morning, Australian evening | Step 1 (BlastCP for the day), 1 group post, Threads replies |
| **B** | 20:00–22:30 | US East morning, UK lunch | 1 group post, group comments, Threads replies |

No window given → work it out from the clock. Outside both windows, only do Step 1 and stop.

Runs on **the m1mini** (`ssh lanbox`), where Chrome is signed in to Alex's Facebook (which also manages the Plain Dharma Page), Threads @plain.dharma, and Slack.

## Read first

- `docs/marketing-places.csv` — where to post: tier, URL, which identity to post as (`post_as`), what fits, and notes. Tiers: `home` (discussion, as Alex), `california`, `broadcast` (quote videos, as the Page), `own`, `reddit`/`forum`/`discord` (**never** post to these: leave them out of this skill).
- `src/content/shorts.json` — the 18 quote Shorts: `id`, `quote`, `transcript`, `sutta`, `seconds`. Media: `https://ffoiltrarbdbibmymlqm.supabase.co/storage/v1/object/public/assets/downloads/shorts/<id>.mp4` (and `.jpg` for the poster).
- `src/content/quotes.ts` — 23 pull quotes, each word for word from the book, with a **quote graphic**: `https://plaindharma.com/quotes/<id>/buddha-quote.png` (1080×1080), and a page `https://plaindharma.com/quotes/<id>` whose link preview *is* the quote card. The quote's `short` names its matching video.
- `packages/content/en/<sutta>.mdx` — the full text, for passages beyond the quotes.
- The log: `~/plain-dharma-posting/log.csv` on this machine (create it with the header `date,window,channel,place,identity,short_id,variant,kind,url,status,note` if missing). **Every action appends a row.** Read the last 30 days before choosing anything.

## House rules (always)

- Say **"free (creative commons)"**, never "CC0". No Amazon or /buy links anywhere in this skill. The only link is `plaindharma.com` (or a sutta page on it).
- Lead with the teaching. Put the passage in the post itself; **no link in the body of a group post**. Put the link in the first comment, and only when the group's rules allow links.
- When AI comes up, or the group is Theravada/scholarly: say plainly it was AI-drafted from the Pāli, then checked line by line against Bhikkhu Bodhi and Ṭhānissaro Bhikkhu by Alex.
- **Never post the same wording twice.** Each group gets text written fresh for it, its rules and its members. Re-read the log to make sure.
- A question at the end that invites real answers, not "thoughts?".
- Lowercase-friendly, warm, plain. No hashtags in groups. No emoji walls.

## Step 1 — our own accounts (window A only, once a day)

1. Pick today's quote from `src/content/quotes.ts`: the one least recently used across `own` rows in the log (never one used in the last 14 days). Alternate days: quote graphic (square.png) one day, its Short (MP4) the next.
2. BlastCP (`mcp__blastcp__*`, property `plain-dharma`): `list_skills`, then `get_skill` on the voice and the post type that fits. Apply them.
3. `create_post` + `schedule_post` for:
   - **Threads @plain.dharma**: the quote plus one line, `topic_tag` rotating Buddhism → Meditation → Spirituality → Mindfulness → Philosophy → Stoicism (continue from the last one in the log; match it to the passage when one fits clearly, e.g. Kālāma → Philosophy, breathe → Meditation). Schedule inside window B today (20:00–22:30) Mon–Fri.
   - **Instagram Reel, YouTube Short, Facebook Page**: the MP4 + a caption, on Tue/Thu/Sat only, in window B.
4. Log each one (`kind=own`, `url` = the BlastCP post link).

## Step 2 — one Facebook group post (every window, Mon–Fri)

1. **Choose the group.** From `home`, `california` and `broadcast` in the CSV, drop any group posted in during the last 14 days (by either identity) and any whose last log row is `blocked`/`removed`/`declined`. Prefer `home`. Pick one `california` group at most once a week. Weekends: skip this step.
2. **Open it in Chrome** (Claude in Chrome tools: `tabs_context_mcp`, then your own tab). If not a member: click Join, answer any membership questions honestly as Alex ("I read and translate the Buddha's talks into plain English"; agree to rules), log `kind=join`, and stop here for this group (pick another for today's post if one is available).
3. **Read the group's rules** (About → Group rules). If they forbid self-promotion, links, videos or outside content, adapt: text-only passage + question, no link at all. If they forbid what we'd post even then, log `skip` with the reason and choose another group.
4. **Read the last ~10 posts** so the post fits the room (length, tone, what's welcome).
5. **Write the post** for that group: a passage (from the Short or the MDX), 1–3 lines of why it matters, a question. 40–120 words. Pick the identity from `post_as`: `Alex` posts as Alex; `Page` uses the composer's identity switcher to post as Plain Dharma (if the group doesn't offer it, post as Alex or skip broadcast groups).
6. **Attach media: the A/B test.** Every quote has two graphics:
   - **art** — `https://plaindharma.com/quotes/<id>/buddha-quote.png` (parchment, the teaching's illustration, no Buddha figure)
   - **photo** — `https://plaindharma.com/quotes/<id>/buddha-quote-photo.png` (one of Alex's Buddha photos behind the words)
   Alternate them: use whichever variant has fewer group posts in the log this week (ties → photo). Download with `curl -sL <url> -o /tmp/pd-<id>.png` and attach it with the file-upload tool; log `variant=art|photo`. Use the Short MP4 instead (`variant=video`) for practice posts (breathe, feelings) at most every third post. Text-only discussion posts in `home` groups log `variant=text`.
7. **Post it.** Take a screenshot after it lands. If the group queues it for approval, log `pending`.
8. Log it (`short_id` = the quote id). If the group allows links, add the first comment: `Free to read and listen (creative commons): plaindharma.com/quotes/<id>` — the link preview shows the quote card, and the page links to the whole teaching.

## Step 3 — comments and replies (every window, 15 min max)

- **Threads** (Chrome, logged in as @plain.dharma): search the topic feeds (Buddhism, Meditation, Mindfulness) for posts from the last 24h asking something a passage really answers ("what did the buddha say about anger", "how do I start meditating", "is buddhism a religion"). Reply to **at most 3**: the passage in a sentence or two, in your own words around it, no link unless they ask. Also reply to every new comment on @plain.dharma's own posts.
- **Facebook groups** (window B, as Alex, `home` tier groups you're a member of): **at most 3** comments on recent posts where a passage helps someone. Mostly no link. Comments outnumber posts: that's the point.
- Never reply to the same person twice in a week. Never argue doctrine. Log each one (`kind=reply`/`comment`, `url` = the post's link).

## Stop at once if

Facebook or Threads shows a checkpoint, a CAPTCHA, "You're posting too fast", "Your account is restricted", a warning about spam, or asks to confirm identity: **don't try to get past it.** Close the tab, log `blocked` with a screenshot path, skip every remaining Chrome step for **3 days** (the next runs read the log and do Step 1 only), and say so first in the Slack report. Same if a post of ours is removed by admins two times in a week: stop posting in that tier for a week.

## Limits (hard)

- Facebook group posts: **2 a day**, **8 a week** in total, across both identities.
- Joins: 3 a day.
- Comments + replies: 6 a day per platform.
- A group sees us at most once every 14 days.

## Step 4 — report to Slack

DM Alex on Slack (Slack connector, `slack_send_message`; find the user by email fotoflo@gmail.com). One message:

```
🪷 Plain Dharma · window A · Mon 23 Nov
Queued: "grip" → Threads (Mindfulness, 21:10), IG/YT/Page (Tue)
Posted: Theravada Buddhism (as Alex) — <link> — "When the grip lets go…"
Replies: 3 on Threads (<links>), 0 in groups
Held: —
Next: window B tonight · 7/8 group posts left this week
```

If anything was blocked or removed, start the message with it. Then end the turn with the log rows you added.

## Weekly report (window `weekly`, Sunday evening)

No posting. Revisit everything logged in the last 7 days and measure it:

1. **Groups:** open each group post from the log in Chrome and record reactions, comments, shares, or `removed`/`pending`. Write them back to the log (`kind=metrics`).
   **A/B:** total and average reactions + comments per post for `art` vs `photo` (and `video`, `text`), in groups of similar size. Report the split, the counts behind it, and say plainly when there are too few posts to call it (under ~8 per variant). Once one variant leads clearly for 3 weeks, recommend switching the default.
2. **Threads replies:** likes and replies on each, and whether the person followed @plain.dharma.
3. **Own accounts:** BlastCP `get_analytics` / `get_post_metrics` for the week's posts; follower counts on Threads, IG, YouTube and the Page vs last week.
4. **Site:** plaindharma.com visits from facebook.com, threads.net/threads.com, instagram.com, youtube.com (Vercel Web Analytics referrers, or PostHog if it's wired; say which).
5. **Slack DM** to Alex: top 3 posts (and why they worked), groups to drop (removed, ignored, or 0 engagement twice), groups to post in more, follower deltas, site visits from social, and next week's plan (which Shorts, which groups).
6. Update `post_as`/`notes` in a local copy of the CSV (`~/plain-dharma-posting/places-overrides.csv`) for groups to drop or favour. Step 2 reads it as an override.
