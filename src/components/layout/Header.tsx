import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="w-full border-b border-divider/80">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-8 px-6 py-5">
        <Logo size={36} />
        <nav className="font-sans flex items-center gap-6 text-sm sm:gap-8">
          <Link
            href="/read"
            className="text-ink hover:text-accent no-underline hover:no-underline"
          >
            Read
          </Link>
          <Link
            href="/about"
            className="text-ink hover:text-accent no-underline hover:no-underline"
          >
            About
          </Link>
          <Link
            href="/glossary"
            className="text-ink hover:text-accent no-underline hover:no-underline"
          >
            Glossary
          </Link>
          <Link
            href="/download"
            className="text-ink hover:text-accent no-underline hover:no-underline"
          >
            Download
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
