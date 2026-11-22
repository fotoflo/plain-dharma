import { QUOTES, getQuote } from "@/content/quotes";
import { renderQuotePhotoCard, quotePhoto } from "@/lib/quote-card";

// plaindharma.com/quotes/<id>/buddha-quote-photo.png — the photo variant of
// the quote graphic (a Buddha photo behind the words), A/B partner of
// buddha-quote.png. 1080×1080, built once per quote at build time.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return QUOTES.map((q) => ({ id: q.id }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const quote = getQuote((await params).id);
  if (!quote) return new Response("Not found", { status: 404 });
  return renderQuotePhotoCard(quote, quotePhoto(quote, QUOTES.indexOf(quote)), "square");
}
