import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-32 text-center">
      <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
        404
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-ink">
        Not found
      </h1>
      <p className="mt-4 font-serif text-lg italic text-ink/70">
        The page you were looking for isn&apos;t here.
      </p>
      <div className="mt-10">
        <Link
          href="/"
          className="font-sans inline-flex items-center justify-center rounded-full bg-accent-strong px-6 py-2.5 text-sm font-medium text-white no-underline hover:no-underline hover:opacity-90"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
