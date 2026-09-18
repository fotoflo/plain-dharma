/**
 * Thai subtree. Only /th/print lives here — Thai is not a site locale, and the
 * root layout owns <html lang>, so this wrapper is what tells assistive tech
 * and search engines the subtree is Thai. Mirrors src/app/zh/layout.tsx.
 */
export default function ThLayout({ children }: { children: React.ReactNode }) {
  return <div lang="th">{children}</div>;
}
