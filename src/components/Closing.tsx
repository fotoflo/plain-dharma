import { CLOSING } from "@/content/drops";
import { DEFAULT_LOCALE, type Locale } from "@/content";

/**
 * Editorial closing for the /read page — italic Garamond, multi-paragraph,
 * generous whitespace. Splits on \n\n into paragraphs.
 */
export function Closing({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  const paragraphs = CLOSING[locale].split(/\n\n+/);
  return (
    <div className="closing-dharma my-16 max-w-[68ch] space-y-6 font-serif italic leading-relaxed">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
