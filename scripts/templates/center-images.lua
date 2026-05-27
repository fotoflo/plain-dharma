-- Center standalone-paragraph images in the PDF.
--
-- Pandoc renders `![](path)` as `\includegraphics{path}` inside a paragraph,
-- which left-aligns. This filter detects paragraphs containing only an image
-- and replaces them with a raw LaTeX block that wraps in \begin{center}.
--
-- Width comes from preamble's \setkeys{Gin}{width=0.7\linewidth} default.

function Para(elem)
  if #elem.content == 1 and elem.content[1].t == "Image" then
    local img = elem.content[1]
    local src = img.src
    return pandoc.RawBlock(
      'latex',
      '\\begin{center}\\includegraphics{' .. src .. '}\\end{center}'
    )
  end
  return elem
end
