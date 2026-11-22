import { QUOTES, getQuote } from "@/content/quotes";
import { renderQuoteCard } from "@/lib/quote-card";

// plaindharma.com/quotes/<id>/buddha-quote.png — the 1080×1080 quote graphic to
// post anywhere. Built once per quote at build time.
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
  return renderQuoteCard(quote, "square");
}
