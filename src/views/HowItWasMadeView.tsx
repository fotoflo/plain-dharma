import type { ReactNode } from "react";
import Link from "next/link";
import { Wash } from "@/components/Wash";
import { ZoomableImage } from "@/components/ZoomableImage";
import { AudioPlayer } from "@/components/AudioPlayer";
import { LengthDisclosure } from "@/components/LengthDisclosure";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAudioManifest, getCombinedAudioManifest } from "@/content/audio";

// Standalone, English-only narrative page: the origin story of Plain Dharma plus
// the provenance evidence (session screenshots + manuscript photos). Linked from
// the About page's "How It Was Made" section. Images live in
// public/how-it-was-made/ — the manuscript photos are casual placeholders pending
// proper reshoots. Click-to-zoom via ZoomableImage so the small screenshot text
// is readable; plain <img> under the hood to stay output:'export'-safe.
function Figure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: ReactNode;
}) {
  return (
    <figure className="my-8 not-prose">
      <ZoomableImage
        src={src}
        alt={alt}
        className="w-full rounded-lg border border-divider/60 shadow-sm"
      />
      <figcaption className="mt-3 font-sans text-sm leading-relaxed text-ink/60">
        {caption}
      </figcaption>
    </figure>
  );
}

// Decorative house-style line drawing (transparent PNG). In dark mode a CSS
// filter flips the black ink to light and rotates the saffron wash back to warm,
// so the same single asset reads on either background — no dark variant needed.
function Doodle({ src, className }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`${className ?? ""} dark:[filter:invert(1)_hue-rotate(180deg)]`}
    />
  );
}

export async function HowItWasMadeView() {
  // The Metta Sutta narration (inline player in "More than the words"), plus the
  // full six-sutta audiobook for the closing player.
  const audioManifest = await getAudioManifest("en", "loving-kindness");
  const combinedAudio = await getCombinedAudioManifest("en");

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <Doodle
        src="/how-it-was-made/header.png"
        className="mx-auto mb-4 w-44 sm:w-52"
      />

      <header className="mb-12">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          How it was made
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          How this was made
        </h1>
        <p className="mt-6 font-serif text-lg leading-relaxed text-ink/80">
          It started with a question at three in the morning — heart racing,
          just woke up from a vivid dream. It took a detour through a Gen-Z
          Buddha, and it hasn’t ended yet — the slow work of weighing every
          phrase against the Pāli, by hand, out loud, more than once.
        </p>
        <div className="mt-6">
          <LengthDisclosure minutes={10} />
        </div>
      </header>

      <figure className="mb-20 mt-4 not-prose">
        <ZoomableImage
          src="/how-it-was-made/manuscript-title-page.jpg"
          alt="The signed printed proof of Plain Dharma — title page on top, held with a binder clip."
          className="mx-auto w-full max-w-md rounded-lg border border-divider/60 shadow-sm"
        />
      </figure>

      <article className="prose-dharma">
        <h2>A question at 3 a.m.</h2>
        <p>
          I’d read plenty <em>about</em> the Buddha —{" "}
          <a
            href="https://www.gutenberg.org/ebooks/2500"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hermann Hesse’s <em>Siddhartha</em>
          </a>{" "}
          (which is wonderful; go read it), the stories, the potted summaries —
          but I’d never really read the suttas themselves. I tried in college,
          cramming them the night before exams — I was an East Asian Studies
          major, after all — and again many times over the years since: in Bali,
          in San Francisco, now here in Chiang Mai, surrounded by temples. Every
          time, the stiff language turned me back — and it was more than the
          language. Every <em>The Blessed One</em>, every{" "}
          <em>thus have I heard</em>, smacked of organized religion, the same
          way the Torah does: a god being worshipped, not a teacher being read.
        </p>
        <p>
          But the dharma had reached me anyway — never through the scripture,
          but through everything around it. The imagery: mandalas, paintings on
          temple walls. The searching in D.T. Suzuki’s essays and Kerouac’s{" "}
          <em>The Dharma Bums</em>; the kindness in Thich Nhat Hanh’s smile. The
          strange, empty feeling of flying through the night down an empty
          highway, just off a plane in a new country —{" "}
          <em>is this life even real? Did I just get dropped here somehow?</em>{" "}
          And the moments of clarity, with yoga or meditation, or now that I’ve
          learned to practice, in a single deep breath: everything slowing down,
          the rising and the falling, the bones in the body.
        </p>
        <p>
          I came to it warily, though — I’ve given up on it more than once.
          Taken all the way, Buddhism felt like it went too far: detach from
          everything, and where does that leave you? Where does that leave the
          world? Our children’s planet is being burned down; we have to fight
          for our right to exist. I have nothing but respect for the monastery —
          but it isn’t my path, not now. Life is too beautiful to give up.
          The suffering is what makes it so. Frankl gave me the answer I could
          hold onto: meaning, found inside the suffering and not beyond it.
          Utilitarianism always sat right with me — that we’re all of equal
          value. And Descartes echoed whenever I really wondered what was real —
          or at least the start of his argument: that our thoughts, at least,
          exist.
        </p>
        <p>
          None of which is coldness toward the Buddha. Meditating in front of his
          statue brings me a peace I can’t explain; I love the imagery and the
          little I know of the tradition; we keep a few small statues at home.
          And still — I don’t think he should be worshipped, and I know that isn’t
          a popular thing to say. Worship is the line. He risks becoming a golden
          calf — a fingertip in a reliquary — and he tells you so himself, in{" "}
          <Link href="/how-to-decide">How to Decide What to Believe</Link>:
          don’t accept something just because someone you respect said it,{" "}
          <em>even if that teacher is me</em>. I wanted to hear the teaching,
          not bow to the teacher.
        </p>
        <p>
          So one night, wide awake at 3 a.m., I asked Claude the plain question:
          what <em>did</em> he say?
        </p>
        <p>
          The first answer came back straight from the Pāli. Before anything
          else, it said plainly what this was:
        </p>
        <blockquote>
          “This is my own plain-English rendering of the Pali rather than any
          one scholar’s copyrighted translation.”
        </blockquote>
        <p>
          That line turned out to be the whole foundation. Everything here is an
          original rendering — which is why it can be given away freely, in the
          public domain, with nothing borrowed and nothing owed. By the time the
          sun came up I’d read all six in a single sitting, for the first time
          in my life understanding them.
        </p>

        <h2>The detour: a Gen-Z Buddha</h2>
        <Doodle
          src="/how-it-was-made/detour.png"
          className="not-prose mx-auto my-4 w-40"
        />
        <p>
          My very next message — the second prompt, before there was even a
          second teaching — was a dumb, irresistible thought:{" "}
          <em>
            what if the Buddha were around today, how would he say it? What if
            he was… Gen Z?
          </em>{" "}
          No plan behind it, I was just curious — and the AI cranked the voice
          all the way to one edge:
        </p>
        <blockquote>
          “If you actually left your whole life behind to find the truth, lemme
          save you some time — there’s two ways to fumble this completely.
          Sending it on pleasure 24/7 — it’s mid, it’s empty, it leads nowhere.
          Beating yourself up to prove a point — it hurts, it’s pointless, also
          leads nowhere.”
        </blockquote>
        <p>
          I laughed. It’s funny — and it’s slop: unworked AI output, too far,
          nothing I’d call <em>made</em>. But the plain rendering it came
          wrapped around was the opposite, and that contrast is the point — the
          book is what happens when you stop letting the machine talk and start
          arguing with it, line by line. Here’s the line that shipped:
        </p>
        <blockquote>
          “If you’ve left ordinary life behind to find the truth, there are two
          dead ends you shouldn’t waste yourself on. Chasing pleasure — it never
          satisfies, and it leads nowhere. Punishing yourself — it’s painful,
          pointless, and also gets you nowhere.”
        </blockquote>
        <p>
          The full Gen-Z slop — all eight steps and four truths, in the dialect
          — lives on <Link href="/how-it-was-made/gen-z">its own page</Link>,
          for the curious. It’s actually quite amusing.
        </p>

        <h2>Then the slow part: word by word against the Pāli</h2>
        <p>
          The first night wasn’t really drafting — it was reading. The six
          renderings came one by one out of that first Claude session; I
          downloaded them as files and read them straight through. The book took
          shape afterward, in much slower work — each line checked against the
          canonical Pāli from{" "}
          <a
            href="https://suttacentral.net"
            target="_blank"
            rel="noopener noreferrer"
          >
            SuttaCentral
          </a>
          , kept or changed for a reason.
        </p>
        <p>
          The thing I still can’t quite get over is that I was examining the{" "}
          <em>original</em> — a 2,600-year-old text, in a dead language I don’t
          read a word of. Two years ago that would have been flatly impossible
          for someone like me: it would have taken a PhD and months in a library
          — the stuff of a dissertation, or at least a final-year project for a
          degree in ancient languages. Now I could do it in a chat window, at 3
          a.m., and actually understand what I was looking at.
        </p>
        <p>
          Here is one of those inquiries, in full, over the opening of the
          Kālāma Sutta:
        </p>

        <Figure
          src="/how-it-was-made/session-kalama-opening.png"
          alt="A working session checking the Kālāma Sutta opening against the Pāli source from SuttaCentral."
          caption={
            <>
              The opening of the Kālāma Sutta, fetched from SuttaCentral and
              read against the draft. Three points:{" "}
              <em>evaṃ kalyāṇo kittisaddo abbhuggato</em> means a fine
              reputation had spread, not just “heard of him”; the Pāli has him
              traveling <em>with</em> a large company of monks; and “shared
              their honest doubt” softens the plainer <em>upasaṅkamiṃsu</em>{" "}
              (approached) → <em>etadavocuṃ</em> (said this).
            </>
          }
        />

        <p>
          Take the monks the Buddha travels with in{" "}
          <em>How to Decide What to Believe</em>.
        </p>
        <blockquote>
          “The Buddha was traveling with many monks and came to a town called
          Kesaputta… They’d heard good things about him, so they came to meet
          him, and told him their doubt directly.”
        </blockquote>
        <p>
          We talked about a sangha of bhikkhus. We tried on many followers. We
          came back to looking for both — what readers would understand, and
          what was still true to the text.
        </p>

        <Figure
          src="/how-it-was-made/session-kalama-doubt.png"
          alt="A working session weighing the Pāli terms kaṅkhā and vicikicchā in the Kālāma Sutta."
          caption={
            <>
              Deeper into the same talk: the Kālāmas’ confusion is{" "}
              <em>kaṅkhā</em> + <em>vicikicchā</em> — doubt and uncertainty —
              and the teachers “glorify their own ideas” from{" "}
              <em>dīpenti jotenti</em>, to expound and to make shine (from{" "}
              <em>joti</em>, light). The Pāli, not a thesaurus, picks the
              English.
            </>
          }
        />

        <p>
          None of this was a fight — there was no adversary. Or the only
          adversary was the AI’s agreeableness: Claude told me I was right no
          matter how I put it. So the real work was against that.
        </p>
        <p>
          You can’t trust “it felt right” when the machine agrees with
          everything; you have to keep demanding the ground under the answer —
          fetch the Pāli, lay every term and its meanings out in a table — so
          you’re choosing from the real range, not from flattery.
        </p>
        <p>
          The three poisons — <em>moha</em>, <em>rāga</em>, <em>dosa</em> — are
          Englished by tradition as delusion, greed, and hatred; I kept asking,
          source in hand, until “confusion, wanting, anger” held. Ours stayed —
          and because the canonical words are repeated so often, we wanted to
          show them too, beside ours.
        </p>
        <p>The decision leaves no trace in the final text.</p>

        <Figure
          src="/how-it-was-made/session-fire-suffering.png"
          alt="A lexical table glossing the Pāli terms for suffering in the Fire Sermon."
          caption={
            <>
              Every term got this treatment. The Fire Sermon’s suffering-list,
              glossed one Pāli word at a time — <em>soka</em> (inner grief),{" "}
              <em>parideva</em> (wailing), <em>domanassa</em> (“the closest
              anchor to depression”), <em>upāyāsa</em> (a churning, turbulent
              distress). The final line — “sorrow, wailing, pain, depression,
              despair” — was settled first by the meaning, then by ear: read
              aloud against the audiobook, over and over, for what it would
              actually sound like.
            </>
          }
        />

        <p>
          Most of the finishing happened on a flight from Chiang Mai to Surabaya
          — pen on a printed proof, reading along with the audiobook word for
          word, catching a pop in the audio, nudging the pacing. Even after all
          the wrestling, the ElevenLabs voice had no feeling in it. A machine
          reading words about what it is to feel.
        </p>
        <p>
          Then I looked up. A woman in the row ahead was reading the first sutta
          — twenty stark Latin letters, <em>Dhammacakkappavattana</em>, in a sea
          of Chinese characters. Taken by the coincidence, I started a
          conversation. She had just finished a 25-day vipassanā retreat, and
          she was generous with it: her teacher was wonderful, room 12b at
          such-and-such monastery, there between nine and ten each morning, here
          is his number — and a book. The book was the constant noting.
        </p>
        <p>
          She was kind, and I wished her well. And then — editing, that very
          hour, the sutra that says to{" "}
          <Link href="/loving-kindness">
            love every living thing as a mother loves her only child
          </Link>{" "}
          — I caught myself. Did I? I’d wished her well and judged her in the
          same breath. The teaching was already working on me, and I was already
          failing it.
        </p>
        <p>
          And I did read it — the next six hours, flight and layover and flight
          again. I tried the techniques, the mental repeating of words:{" "}
          <em>
            left foot rising, left foot falling, right foot rising, right foot
            falling, breathing, breathing, breathing, breathing.
          </em>
        </p>

        <div className="not-prose my-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ZoomableImage
            src="/how-it-was-made/manuscript-flames.jpg"
            alt="A printed proof page of the Fire Sermon with handwritten edits in the margin."
            className="aspect-[3/4] w-full rounded-lg border border-divider/60 object-cover shadow-sm"
          />
          <ZoomableImage
            src="/how-it-was-made/manuscript-kalama-scales.jpg"
            alt="A printed proof page of the Kālāma Sutta with a scales illustration and margin notes."
            className="aspect-[3/4] w-full rounded-lg border border-divider/60 object-cover shadow-sm"
          />
          <ZoomableImage
            src="/how-it-was-made/manuscript-kalama-list.jpg"
            alt="A printed proof page of the Kālāma Sutta's list, marked up by hand."
            className="aspect-[3/4] w-full rounded-lg border border-divider/60 object-cover shadow-sm"
          />
        </div>
        <p className="font-sans text-sm leading-relaxed text-ink/60 not-prose">
          The proof, hand-marked over the Andaman Sea. Fittingly, the most
          marked-up page is the <Link href="/how-to-decide">Kālāma Sutta</Link>{" "}
          — the one teaching that says{" "}
          <em>test it yourself, don’t take anyone’s word for it.</em>
        </p>

        <figure className="not-prose my-12">
          <ZoomableImage
            src="/how-it-was-made/mach.png"
            alt="Ernst Mach's 1886 drawing of his own visual field — a first-person view down his reclining body toward a window."
            className="mx-auto w-full max-w-xs rounded-lg border border-divider/60 shadow-sm"
          />
          <figcaption className="mt-3 text-center font-sans text-sm leading-relaxed text-ink/60">
            Ernst Mach, drawing his own visual field, 1886. Don’t forget to try
            and point the finger back at yourself.
          </figcaption>
        </figure>

        <h2>More than the words</h2>
        <Doodle
          src="/how-it-was-made/audio.png"
          className="not-prose mx-auto my-4 w-40"
        />
        <p>
          The audiobook was its own long labor. I auditioned dozens of voices —
          thirty thousand ElevenLabs credits, burned just trying them on
          different passages. The one I kept — a voice called{" "}
          <a
            href="https://elevenlabs.io/app/voice-library?voiceId=UmQN7jS1Ee8B1czsUtQh"
            target="_blank"
            rel="noopener noreferrer"
          >
            Theo Silk
          </a>{" "}
          — I had to fight: it misreads emotion, runs a little fast, a little
          slow.
        </p>
        <p>
          I prompted it flat and calm and slow, then dragged it 20–30% slower
          still — cut, stitched, re-rendered and stitched back in, 700
          milliseconds of silence dropped between sections to let them breathe —
          and finally re-recorded the whole thing through the API and joined it
          to a cover, a back cover, and a barcode. Claude designed those; my mom
          fixed them.
        </p>

        {audioManifest && (
          <div className="not-prose my-8 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="w-[320px] max-w-full">
                <AudioPlayer
                  manifest={audioManifest}
                  audioBaseUrl="/audio/en/loving-kindness"
                  locale="en"
                  compact
                />
              </div>
              <ThemeToggle />
            </div>
            <p className="max-w-sm text-center font-sans text-sm leading-relaxed text-ink/60">
              Click to listen to the Metta Sutra in its entirety — a guided
              meditation by the Buddha himself.
            </p>
          </div>
        )}

        <p>
          The mobile app was a labor of love too: an audio player with offline
          downloads, a free CC0 copy to keep, and a donate page. A man’s got to
          eat; here’s my bowl. And all of it runs in three scripts — English,
          and Chinese in both Simplified and Traditional — though the Chinese is
          still as the machine rendered it. A friend has promised to edit it one
          day; until then, the <Link href="/contribute">contributors page</Link>{" "}
          is wide open.
        </p>

        <div className="not-prose my-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ZoomableImage
            src="/how-it-was-made/app-home.jpg"
            alt="The Plain Dharma mobile app — home screen."
            className="w-full rounded-lg border border-divider/60 shadow-sm"
          />
          <ZoomableImage
            src="/how-it-was-made/app-read.jpg"
            alt="The Plain Dharma mobile app — reading a talk, with a Listen button."
            className="w-full rounded-lg border border-divider/60 shadow-sm"
          />
          <ZoomableImage
            src="/how-it-was-made/app-audio.jpg"
            alt="The Plain Dharma mobile app — the audio player with offline download."
            className="w-full rounded-lg border border-divider/60 shadow-sm"
          />
          <ZoomableImage
            src="/how-it-was-made/app-settings.jpg"
            alt="The Plain Dharma mobile app — reading settings, light and dark themes."
            className="w-full rounded-lg border border-divider/60 shadow-sm"
          />
        </div>
        <p className="font-sans text-sm leading-relaxed text-ink/60 not-prose">
          The app: read, listen, adjust, take it offline — light or dark.
        </p>

        <h2>Two receipts</h2>
        <Doodle
          src="/how-it-was-made/key.png"
          className="not-prose mx-auto my-4 w-40"
        />
        <p>
          None of this asks you to take my word for it either. There are two
          trails. The revision history is public on{" "}
          <a
            href="https://github.com/fotoflo/plain-dharma"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>{" "}
          — every Pāli-faithfulness pass is a commit you can open and read. And
          the human finishing is here: the working sessions and the marked-up
          proof. The diffs prove the work was real; the manuscript proves it was
          cared for.
        </p>
        <p>
          The translation was first drafted from the Pāli with the help of
          Claude; the illustrations began with Gemini; the first narration with
          ElevenLabs. Almost none of it was left as the machine made it — the
          Chinese still is, for now. And all of it is released into the public
          domain under{" "}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC0
          </a>{" "}
          — copy it, print it, translate it, make it more human. That part’s up
          to you now.
        </p>

        <p className="mt-12 border-t border-divider/50 pt-10">
          So, dear reader: would you forgive this text its faults — and check it
          for yourself?
        </p>

        <p className="mt-12 border-t border-divider/50 pt-10">
          Just sit and listen to six short sutras. We think you will greatly
          enjoy them.
        </p>

        {combinedAudio && (
          <div className="not-prose my-8 flex justify-center">
            <div className="w-[320px] max-w-full">
              <AudioPlayer
                manifest={combinedAudio}
                audioBaseUrl=""
                locale="en"
                compact
              />
            </div>
          </div>
        )}

        <p className="mt-12 border-t border-divider/50 pt-10">
          Turn them over in your mind. Sleep on them, wake on them, and fully
          get them.
        </p>
        <p className="mt-12 border-t border-divider/50 pt-10">
          Or let them be a jumping-off point, to further reading, further
          meditations and further understanding. Or give some new translations a
          go yourself. I’m happy to publish more on-topic work.
        </p>

        <Doodle
          src="/how-it-was-made/dawn.png"
          className="not-prose mx-auto my-4 w-40"
        />
        <p>
          One last strange thing. All of this was written over Eid al-Adha, the
          Festival of Sacrifice — the story of Abraham, the one that parts Isaac
          from Ishmael. Jews and Christians trace themselves to one son, Muslims
          to the other, and each has made the story about itself. That is how it
          divides us. To me it should mean the opposite: that we are all
          brothers — and that we might love one another the way{" "}
          <Link href="/loving-kindness">a mother loves her only child</Link>.
          Not the way Abraham loved his.
        </p>
        <p>
          Though maybe that’s unfair to Abraham. Maybe God makes it hard for us
          on purpose — so we can taste how sweet the good parts are.
        </p>
      </article>

      <div className="mt-16 text-center">
        <Link
          href="/read"
          className="font-sans text-sm text-link hover:text-accent"
        >
          Read the six teachings →
        </Link>
      </div>
    </div>
  );
}
