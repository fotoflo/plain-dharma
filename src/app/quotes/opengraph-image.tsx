import { getQuote } from "@/content/quotes";
import { renderQuoteCard, QUOTE_OG } from "@/lib/quote-card";

export const size = QUOTE_OG;
export const contentType = "image/png";
export const alt = "Quotes from the Buddha, in plain English — Plain Dharma";

export default async function OgImage() {
  return renderQuoteCard(getQuote("you-looked")!, "og");
}
