import type { SuttaSlug } from "@plain-dharma/content";

/**
 * Pull quotes for /quotes and their graphics. Every `text` is lifted word for
 * word from the English MDX in packages/content/en (scripts/check-quotes.ts
 * checks it), so a shared quote is always what the book says.
 *
 * `id` is the URL: plaindharma.com/quotes/<id>, its square graphic at
 * /quotes/<id>/buddha-quote.png. Never rename an id once shared. Where a quote Short
 * says the same thing, `short` names it (src/content/shorts.json), so the
 * page can play the video.
 */
export type Quote = {
  id: string;
  sutta: SuttaSlug;
  text: string;
  /** What it's about, in the words people search with ("Buddha quotes on …"). */
  topics: string[];
  short?: string;
  /** Pin a photo for the photo graphic (a QUOTE_PHOTOS name); else picked by order. */
  photo?: string;
};

export const QUOTES: Quote[] = [
  // The Buddha's First Talk
  {
    id: "two-dead-ends",
    topics: ["the middle way", "pleasure"],
    sutta: "first-talk",
    text: "If you've left ordinary life behind to find the truth, there are two dead ends you shouldn't waste yourself on. Chasing pleasure — it never satisfies, and it leads nowhere. Punishing yourself — it's painful, pointless, and also gets you nowhere.",
    short: "two-dead-ends",
  },
  {
    id: "suffering",
    topics: ["suffering"],
    sutta: "first-talk",
    text: "Being stuck with what you can't stand hurts; being torn from what you love hurts; not getting what you want hurts.",
    short: "hurts",
  },

  // Not-self
  {
    id: "grip",
    topics: ["letting go", "freedom"],
    sutta: "not-self",
    text: "When the grip lets go, you're free.",
    short: "grip",
  },
  {
    id: "body",
    topics: ["the body", "self"],
    sutta: "not-self",
    text: "The body gets sick, ages, falls apart, ignores your wishes completely. That is why it cannot be self.",
    short: "body",
  },
  {
    id: "if-the-body-were-you",
    topics: ["self", "the body"],
    sutta: "not-self",
    text: "If the body really were you — your self, the thing you actually are — then it would never let you down, and you'd be able to tell it: ‘Be like this, don't be like that,’ and it would obey. But you can't.",
    short: "body",
  },

  // The Fire Sermon
  {
    id: "on-fire",
    topics: ["desire", "anger"],
    sutta: "fire-sermon",
    text: "Burning with wanting. Burning with anger. Burning with confusion.",
    short: "on-fire",
  },

  // Loving-kindness
  {
    id: "everyone",
    topics: ["loving-kindness", "compassion"],
    sutta: "loving-kindness",
    text: "May everyone be at ease. May everyone be safe. May everyone be happy. And mean everyone — no exceptions.",
    short: "everyone",
  },
  {
    id: "mother",
    topics: ["love", "compassion"],
    sutta: "loving-kindness",
    text: "Think of how a mother would protect her only child — willing to put her own life on the line for it. Hold that same care toward every living thing — a heart without limit.",
    short: "mother",
  },
  {
    id: "no-enemy",
    topics: ["loving-kindness", "anger"],
    sutta: "loving-kindness",
    text: "Let that goodwill fill the whole world — above you, below you, all around you — with no walls, no grudge, no enemy anywhere.",
    short: "no-enemy",
  },
  {
    id: "look-down",
    topics: ["kindness", "honesty"],
    sutta: "loving-kindness",
    text: "Don't deceive anyone. Don't look down on anyone, anywhere.",
    short: "look-down",
  },
  {
    id: "simply",
    topics: ["simple living", "contentment"],
    sutta: "loving-kindness",
    text: "Live simply, with few wants. Be easy to please and easy to support.",
    short: "simply",
  },
  {
    id: "gentle",
    topics: ["humility", "kindness"],
    sutta: "loving-kindness",
    text: "Be gentle. Don't carry yourself like you're better than anyone.",
    short: "simply",
  },
  {
    id: "divine-living",
    topics: ["loving-kindness"],
    sutta: "loving-kindness",
    text: "This is what they call divine living — right here, in this life.",
    short: "look-down",
  },

  // Mindfulness
  {
    id: "breathe",
    topics: ["meditation", "breathing"],
    sutta: "mindfulness",
    text: "Just breathe, and know you're breathing.",
    short: "breathe-2",
  },
  {
    id: "somewhere-quiet",
    topics: ["meditation"],
    sutta: "mindfulness",
    text: "Go somewhere quiet — under a tree, an empty room, wherever's still.",
    short: "breathe-2",
  },
  {
    id: "feelings",
    topics: ["mindfulness", "emotions"],
    sutta: "mindfulness",
    text: "You don't have to chase the good ones or shove away the bad ones. You just see each feeling clearly as it shows up and as it fades.",
    short: "feeling",
  },
  {
    id: "not-grasping",
    topics: ["mindfulness", "letting go"],
    sutta: "mindfulness",
    text: "Not leaning on anything, not grasping at anything in the world.",
    short: "breathe",
  },

  // How to decide what to believe (Kālāma)
  {
    id: "you-looked",
    topics: ["truth", "belief"],
    sutta: "how-to-decide",
    text: "Not ‘because I said so’ — because you looked, and you saw.",
    short: "you-looked",
    photo: "bronze-head",
  },
  {
    id: "even-me",
    topics: ["belief", "thinking for yourself"],
    sutta: "how-to-decide",
    text: "Or ‘because the teacher said so’ — even if that teacher is me. None of those, on their own, make a thing true.",
    short: "even-me",
  },
  {
    id: "worth-doubting",
    topics: ["doubt"],
    sutta: "how-to-decide",
    text: "“Of course you're unsure,” the Buddha said. “You're right to be — this is exactly the kind of thing worth doubting.”",
    short: "doubt",
  },
  {
    id: "know-for-yourself",
    topics: ["thinking for yourself", "doubt"],
    sutta: "how-to-decide",
    text: "So don't just take anyone's word for it, or believe whatever sounds convincing. Let me give you a way to know for yourself.",
    short: "doubt",
  },
  {
    id: "nothing-to-fear",
    topics: ["fear", "living well"],
    sutta: "how-to-decide",
    text: "There's nothing to fear in living decently and seeing clearly.",
    short: "nothing-to-fear",
  },
  {
    id: "either-way",
    topics: ["death", "living well"],
    sutta: "how-to-decide",
    text: "Either way, they come out fine.",
    short: "either-way",
  },
];

/** Every topic, with its quotes, most-quoted first. */
export function quoteTopics(): { topic: string; slug: string; quotes: Quote[] }[] {
  const map = new Map<string, Quote[]>();
  for (const q of QUOTES) for (const t of q.topics) map.set(t, [...(map.get(t) ?? []), q]);
  return [...map.entries()]
    .map(([topic, quotes]) => ({ topic, slug: topicSlug(topic), quotes }))
    .sort((a, b) => b.quotes.length - a.quotes.length || a.topic.localeCompare(b.topic));
}

export const topicSlug = (topic: string) => "on-" + topic.replace(/\s+/g, "-");

export function getQuote(id: string): Quote | undefined {
  return QUOTES.find((q) => q.id === id);
}

/**
 * Popular lines the Buddha never said, each paired with the real line from
 * this translation on the same theme. Sources for the misattributions:
 * Bodhipaksa's fakebuddhaquotes.com. Keep each note to what's established.
 */
export const FAKE_QUOTES: { fake: string; note: string; real: string }[] = [
  {
    fake: "Believe nothing, no matter where you read it, or who said it, no matter if I have said it, unless it agrees with your own reason and your own common sense.",
    note: "A loose rewrite of the Kālāma Sutta that turns it upside down: the real talk lists “it sounds logical” among the reasons not to accept a claim, and asks what leads to harm and what to well-being.",
    real: "even-me",
  },
  {
    fake: "Holding on to anger is like grasping a hot coal with the intent of throwing it at someone else; you are the one who gets burned.",
    note: "Not in the suttas. It's a modern reworking of a simile from a commentary written about a thousand years after the Buddha.",
    real: "on-fire",
  },
  {
    fake: "Peace comes from within. Do not seek it without.",
    note: "No source in the early texts; it began circulating as a Buddha quote in the 20th century.",
    real: "grip",
  },
  {
    fake: "You yourself, as much as anybody in the entire universe, deserve your love and affection.",
    note: "A modern paraphrase from a book on loving-kindness, later attributed to the Buddha directly.",
    real: "everyone",
  },
];
