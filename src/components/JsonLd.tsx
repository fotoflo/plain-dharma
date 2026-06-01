/**
 * Renders a JSON-LD graph as a <script type="application/ld+json"> tag.
 *
 * Server component; the markup is prerendered into the static HTML, so it's
 * fully `output: 'export'`-compatible. The `<` escape is defensive — our graph
 * contains no user input, but it cheaply forecloses any `</script>` break-out.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
