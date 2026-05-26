import { PREFACE } from "@/content/drops";

/**
 * Editorial preface for the /read page — italic Garamond, multi-paragraph,
 * generous whitespace. Splits on \n\n into paragraphs.
 */
export function Preface() {
  const paragraphs = PREFACE.split(/\n\n+/);
  return (
    <div className="my-16 max-w-[68ch] space-y-6 font-serif italic leading-relaxed text-ink/85">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
