import { QUOTES, getQuote } from "@/content/quotes";
import { renderQuoteCard, QUOTE_OG } from "@/lib/quote-card";

// The link preview of plaindharma.com/quotes/<id> is the quote itself, so a
// shared link shows the words before anyone clicks.
export const size = QUOTE_OG;
export const contentType = "image/png";
export const alt = "A quote from the Buddha, in plain English";

export function generateStaticParams() {
  return QUOTES.map((q) => ({ id: q.id }));
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const quote = getQuote((await params).id) ?? QUOTES[0];
  return renderQuoteCard(quote, "og");
}
