// Sutta content `.mdx`/`.md` files are imported as raw Markdown strings
// (babel-plugin-inline-import inlines the file contents at build time).
declare module "*.mdx" {
  const content: string;
  export default content;
}

declare module "*.md" {
  const content: string;
  export default content;
}
