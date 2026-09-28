import Link from "next/link";
import { Wash } from "@/components/Wash";
import { AUTHOR_LINKS } from "@/lib/author";

// Standalone, English-only page about the editor. Linked from the footer
// byline. The headshot lives in public/author/ (small enough to commit, like
// public/how-it-was-made/); plain <img> to stay output:'export'-safe.
export function AuthorView() {
  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-10">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          The editor
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Alex Miller
        </h1>
      </header>

      <figure className="mb-12 not-prose">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/author/alex-miller.jpg"
          alt="Alex Miller in a white Balinese headcloth, sitting with son Dion in front of a mossy stone wall."
          width={1000}
          height={666}
          className="w-full rounded-lg border border-divider/60 shadow-sm"
        />
        <figcaption className="mt-3 font-sans text-sm leading-relaxed text-ink/60">
          With my son Dion after <em>melukat</em>, a traditional Balinese Hindu
          water purification ceremony meant to cleanse the mind, body, and soul
          of negative energy, stress, and emotional burdens.
        </figcaption>
      </figure>

      <article className="prose-dharma">
        <p>
          As editor of Plain Dharma, my job was to make sure the teachings stay
          the Buddha’s, and that the words make sense to a modern ear. The
          first English draft came from Claude Opus, working directly from the
          Pāli. I went through it line by line, weighing each word or phrase
          against what Claude told me the Pāli meant, and sometimes checking
          the standard translations too. The whole time I kept asking whether
          my friends, my wife, my mom, and people I met along the way would
          understand what was meant, and would enjoy reading it.
        </p>

        <h2>Background</h2>
        <p>
          I grew up in New York and studied East Asian Studies at Oberlin
          College, where I first tried to read the suttas, cramming them the
          night before exams. At 19 I interrupted my studies to move to China,
          and I stayed for eleven years, going back and forth to finish my
          degree.
        </p>
        <p>
          Along the way I studied at Peking University, Beijing Institute of
          Technology, and Kunming University, where I learned Classical Chinese
          well enough to (barely) read it, and took a summer at Harvard
          studying travel writing. I taught English for five years, and learned
          the Chinese for every word I taught my students. I worked as a translator, did some
          translation work for <em>Harper’s Magazine</em>, and became fluent in
          Mandarin. It was in China that I met my wife, Yan.
        </p>
        <p>
          Though I speak English, Chinese, some Indonesian, Singlish,
          JavaScript, and SQL, I never became
          a scholar of any language. What I took away was a
          method: read the original closely, understand what it meant to the
          people who first heard it, then find the nearest words in your own
          language that carry the same meaning. The suttas began as an oral
          tradition and were only later written down by monks, so I took
          the liberty of translating them back toward the spoken word.
        </p>
        <p>
          I’ve spent 25 years building software companies across Asia, from
          Beijing to Dhaka. Along the way I lived in Silicon Valley,
          Singapore, and Bali. I live in Chiang Mai now, surrounded by temples. By
          day I train teams to build with AI and invest through AimHuge
          Holdings.
        </p>

        <h2>Why I published Plain Dharma</h2>
        <p>
          I kept going back to the Buddha’s words: in college, in Bali, in San
          Francisco, in Chiang Mai. Every time, the stiff language turned me
          away. “Thus have I heard” made it sound like a god being worshipped,
          not a teacher being read. The dharma reached me anyway, through D.T.
          Suzuki, Kerouac, Thich Nhat Hanh, temple murals, and the occasional
          deep breath. The scripture never did.
        </p>
        <p>
          So one night, awake at 3 a.m., I asked a plain question: what did he
          actually say? By sunrise I had read all six teachings in one sitting
          and understood them for the first time. Plain Dharma is that reading,
          worked over line by line against the Pāli until it holds up.
        </p>

        <h2>How I edited Plain Dharma</h2>
        <p>
          The drafts came fast. The editing was slow. Every term got the same
          treatment: fetch the Pāli, lay out its range of meanings, and choose
          from the real range rather than whatever the machine agreed to. The
          three poisons, <em>moha</em>, <em>rāga</em>, <em>dosa</em>, are
          usually Englished as delusion, greed, and hatred. I kept asking until
          I got to confusion, wanting, and anger: plain words everyone has felt.
          Most of the finishing happened on a flight from Chiang Mai to
          Surabaya, pen on a printed proof, reading along with the audiobook.
        </p>
        <p>
          This is not a substitute for a scholarly translation. If a teaching
          here moves you, read the same passage by Bhikkhu Bodhi or Thanissaro
          Bhikkhu next. Plain Dharma is a starting point.
        </p>
        <p>
          The full story is on{" "}
          <Link href="/how-it-was-made">How this was made</Link>.
        </p>

        <h2>Elsewhere</h2>
        <ul>
          {AUTHOR_LINKS.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer me">
                {l.label}
              </a>
              {l.note}
            </li>
          ))}
        </ul>
        <p>
          To help with the project, or just to say hello, see{" "}
          <Link href="/contribute">Contribute</Link>.
        </p>
      </article>

      <div className="mt-16 text-center">
        <Link
          href="/read"
          className="font-sans text-sm text-link hover:text-accent"
        >
          Start reading →
        </Link>
      </div>
    </div>
  );
}
