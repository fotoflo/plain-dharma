import Link from "next/link";
import { Wash } from "@/components/Wash";

// The full Gen-Z First Talk — the register experiment from the first night,
// kept on its own page (noindex) and linked from /how-it-was-made. Not the book.
export function GenZEditionView() {
  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-8">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          AI slop from the first night
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          The Buddha’s First Talk
        </h1>
        <p className="mt-3 font-serif text-lg italic leading-relaxed text-ink/70">
          Gen-Z Edition
        </p>
      </header>

      <div className="mb-10 rounded-lg border border-divider/80 bg-paper/60 p-5 font-sans text-sm leading-relaxed text-ink/70">
        This is AI slop from the very first night — not the book, and barely even
        “made.” It was my second-ever prompt, before there was a second teaching,
        before I had any idea this would become anything. I was just curious what
        the machine would do if the voice got cranked all the way up. This is what
        it did. It’s funny, and it’s unworked AI output — kept here for exactly
        that reason: the raw starting material, before any of the real work. The
        actual book is plain and dignified, and the gap between the two is the
        whole point — <Link href="/read">read the six teachings</Link>, or see{" "}
        <Link href="/how-it-was-made">how it was made</Link>.
      </div>

      <p className="mb-8 font-serif text-base italic leading-relaxed text-ink/70">
        The OG dropped his first teaching to five former gym buddies in a deer
        park near Varanasi. Real ones only.
      </p>

      <article className="prose-dharma">
        <p>
          Okay so here’s the lore. The Buddha’s posted up in the deer park at
          Isipatana near Varanasi, and he turns to the five seekers like:
        </p>
        <blockquote>
          “If you actually left your whole life behind to find the truth, lemme
          save you some time — there’s two ways to fumble this completely.”
        </blockquote>
        <ol>
          <li>
            <strong>Sending it on pleasure 24/7</strong> — it’s mid, it’s empty,
            it leads nowhere.
          </li>
          <li>
            <strong>Beating yourself up to prove a point</strong> — it hurts,
            it’s pointless, also leads nowhere.
          </li>
        </ol>
        <p>
          I found the path that splits the difference. It clears the brain fog
          and actually gets you somewhere — peace, real understanding, freedom.
          No cap.
        </p>
        <p>So what’s the move? It’s these eight:</p>
        <ol>
          <li>See things for what they are</li>
          <li>Want the right stuff</li>
          <li>Keep it real when you talk</li>
          <li>Don’t be a menace</li>
          <li>Make your money clean</li>
          <li>Lock in, consistently</li>
          <li>Stay present</li>
          <li>Get your mind right</li>
        </ol>
        <p>
          That’s the path down the middle. Opens your eyes and takes you all the
          way.
        </p>

        <h2>Four Things That Are Just True</h2>
        <p>
          <strong>One — life hits different, and not always good.</strong>{" "}
          Getting born? Rough. Getting old? Rough. Getting sick, dying? Rough.
          Stuck with stuff you can’t stand — pain. Losing what you love — pain.
          Not getting what you want — pain. The whole habit of clinging to
          everything? That’s where it all lives.
        </p>
        <p>
          <strong>Two — there’s a reason it hurts.</strong> It’s the wanting.
          That itch that never quits, always chasing the next dopamine hit
          wherever it can get one. Wanting the good feelings. Wanting to stick
          around forever. Wanting to just not exist. All of it.
        </p>
        <p>
          <strong>Three — it can actually stop.</strong> When that wanting burns
          all the way out — when you finally unclench and let it go — the hurting
          stops too. It’s giving freedom.
        </p>
        <p>
          <strong>Four — and yes there’s a how.</strong> Same eight things from
          before: see clearly, want right, talk real, act decent, earn clean,
          lock in, stay present, mind right. That’s the whole playbook.
        </p>

        <h2>Knowing Each One On Three Levels</h2>
        <p>
          For all four, my understanding leveled up in three stages. Like with
          suffering:
        </p>
        <ol>
          <li>
            First: <em>oh, this is suffering.</em> Noticed.
          </li>
          <li>
            Then: <em>this is something I gotta fully get.</em>
          </li>
          <li>
            Then: <em>yeah, I fully got it.</em>
          </li>
        </ol>
        <p>Same three stages, all four:</p>
        <ol>
          <li>
            <strong>The hurt</strong> — clock it; get it; got it.
          </li>
          <li>
            <strong>The cause</strong> — clock it; drop it; dropped it.
          </li>
          <li>
            <strong>The end of it</strong> — clock it; live it; lived it.
          </li>
          <li>
            <strong>The path</strong> — clock it; build it; built it.
          </li>
        </ol>
        <p>
          As long as I hadn’t fully unlocked all four truths — all three stages,
          all twelve checkpoints — I wasn’t about to claim I was awake. But once
          it all clicked? Then I knew. Fully woke, nothing above it. And it just
          settled in me, dead certain: <em>My freedom can’t be shaken. This is
          the last time I do this. There’s no round two.</em>
        </p>

        <h2>One of Them Lowkey Gets It</h2>
        <p>So that’s the talk, and the five of them were vibing with it.</p>
        <p>
          And right while he’s still talking, something just <em>clicks</em> for
          one of them — Kondañña. Clean realization, straight through:
        </p>
        <blockquote>
          <em>Everything that starts is something that ends.</em>
        </blockquote>
        <p>
          The second the Buddha set this whole thing in motion, you could feel it
          ripple out and up and out, like the whole world caught the moment. And
          the Buddha goes, genuinely hyped:
        </p>
        <p>
          <strong>“Kondañña gets it. He actually gets it.”</strong>
        </p>
        <p>
          And that’s the origin story of how he got the name Kondañña Who Knows.
        </p>
      </article>

      <div className="mt-16 text-center">
        <Link
          href="/how-it-was-made"
          className="font-sans text-sm text-link hover:text-accent"
        >
          ← Back to how it was made
        </Link>
      </div>
    </div>
  );
}
