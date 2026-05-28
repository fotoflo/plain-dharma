type DropProps = {
  text: string;
};

/**
 * An editorial "drop" — a quiet italic note in the editor's voice, placed
 * after a teaching. Renders as italic Garamond at slightly smaller than body
 * size, with a thin saffron rule above and generous whitespace around. No
 * background, no border box — think NYRB editor's note, not a callout.
 */
export function Drop({ text }: DropProps) {
  return (
    <div className="my-12 flex flex-col items-center">
      <div
        aria-hidden="true"
        className="h-px w-12 bg-accent/70"
      />
      <p className="drop-dharma mt-8 max-w-[50ch] text-center font-serif italic leading-relaxed">
        {text}
      </p>
    </div>
  );
}
