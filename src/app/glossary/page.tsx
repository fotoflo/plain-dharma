import Link from "next/link";
import type { Metadata } from "next";
import { Wash } from "@/components/Wash";

export const metadata: Metadata = {
  title: "Glossary",
  description:
    "Key terms in plain English, with the Pali / Sanskrit where it matters.",
};

type GlossaryEntry = {
  term: string;
  pali?: string;
  definition: string;
};

const ENTRIES: GlossaryEntry[] = [
  {
    term: "Anattā",
    pali: "Pali; Sanskrit: anātman.",
    definition:
      '"Not-self." The teaching that no permanent, separate self can be found in any aspect of experience.',
  },
  {
    term: "Anicca",
    pali: "Pali; Sanskrit: anitya.",
    definition:
      '"Impermanence." The teaching that all conditioned things change.',
  },
  {
    term: "Bodhi",
    definition:
      'Awakening; the seeing the Buddha had under the tree. "Buddha" means "awakened one."',
  },
  {
    term: "Dharma",
    pali: "Sanskrit; Pali: dhamma.",
    definition:
      'The Buddha’s teaching, and also "the way things are." The English spelling is used throughout this site.',
  },
  {
    term: "Dukkha",
    pali: "Pali; Sanskrit: duḥkha.",
    definition:
      'Often translated "suffering," but more like "unease," "unsatisfactoriness," the inherent friction of conditioned existence.',
  },
  {
    term: "The Eightfold Path",
    definition:
      "The Buddha’s prescription for ending suffering: Right View, Right Intention, Right Speech, Right Action, Right Livelihood, Right Effort, Right Mindfulness, Right Concentration.",
  },
  {
    term: "The Five Aggregates",
    pali: "Pali: pañcakkhandha.",
    definition:
      'Body, feeling, perception, mental formations, consciousness. The five things you take to be "you," none of which is actually a self.',
  },
  {
    term: "The Four Noble Truths",
    definition:
      "Suffering exists; suffering has a cause (craving); suffering can end; there is a path to ending it.",
  },
  {
    term: "Karma",
    pali: "Sanskrit; Pali: kamma.",
    definition:
      'Literally "action." The teaching that intentional actions have natural consequences.',
  },
  {
    term: "Mahāyāna",
    definition:
      '"The great vehicle." A later branch of Buddhism dominant in East Asia and Tibet. The teachings on this site predate the Mahāyāna / Theravāda split.',
  },
  {
    term: "Mettā",
    pali: "Pali.",
    definition:
      "Loving-kindness, goodwill, friendliness. The subject of the fourth teaching on this site.",
  },
  {
    term: "Nirvana",
    pali: "Sanskrit; Pali: nibbāna.",
    definition:
      'Literally "blowing out" — the extinction of craving, and the freedom from suffering it brings. Not a place; not annihilation.',
  },
  {
    term: "Pali",
    definition:
      "The language in which the earliest Buddhist texts were preserved, closely related to what the Buddha himself likely spoke.",
  },
  {
    term: "Sangha",
    pali: "Pali / Sanskrit.",
    definition: "The community of practitioners.",
  },
  {
    term: "Satipaṭṭhāna",
    pali: "Pali.",
    definition:
      '"Foundations of mindfulness." The practice of mindful attention in four domains: body, feelings, mind, mental contents.',
  },
  {
    term: "Sutta",
    pali: "Pali; Sanskrit: sūtra.",
    definition:
      "A discourse or talk attributed to the Buddha. The six teachings on this site are all suttas.",
  },
  {
    term: "Tathāgata",
    pali: "Pali / Sanskrit.",
    definition:
      'Literally "one who has thus gone" or "thus come." The Buddha’s term for himself.',
  },
  {
    term: "Theravāda",
    pali: "Pali.",
    definition:
      '"The way of the elders." The school of Buddhism that preserved the Pali Canon, dominant in Sri Lanka and Southeast Asia.',
  },
];

export default function GlossaryPage() {
  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.08} />

      <header className="mb-12 max-w-3xl">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          Glossary
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Glossary
        </h1>
        <p className="mt-4 font-serif text-lg italic leading-relaxed text-ink/70">
          Key terms in plain English, with the Pali / Sanskrit where it matters.
        </p>
      </header>

      <dl className="divide-y divide-divider/70 border-t border-divider/70">
        {ENTRIES.map((entry) => (
          <div
            key={entry.term}
            className="grid grid-cols-1 gap-2 py-6 lg:grid-cols-[18rem_1fr] lg:gap-12"
          >
            <dt className="font-serif text-xl text-ink">
              <span className="font-semibold">{entry.term}</span>
              {entry.pali ? (
                <span className="mt-1 block font-sans text-xs uppercase tracking-wider text-ink/65">
                  <em className="font-serif normal-case tracking-normal">
                    {entry.pali}
                  </em>
                </span>
              ) : null}
            </dt>
            <dd className="font-serif text-base leading-relaxed text-ink/85 lg:text-lg">
              {entry.definition}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-16 text-center">
        <Link
          href="/read"
          className="font-sans text-sm text-link hover:text-accent"
        >
          Read all six on one page &rarr;
        </Link>
      </div>
    </div>
  );
}
