# Deployment — Plain Dharma

*Last updated: 2026-05-28*

## Stack

| Layer | Choice |
|---|---|
| Host | Vercel (project: `fastmonitor/plain-dharma`) |
| Domain | `plaindharma.com` (apex + www) |
| DNS | Spaceship registrar, configured via Spaceship DNS API |
| Build | `pnpm build` → `next build` (static + RSC, no `output: 'export'`) |

## Vercel project

- Connected to the GitHub repo; main branch auto-deploys to production.
- Preview deployments on every PR branch.
- `GOOGLE_GENERATIVE_AI_KEY` is set as a Vercel environment variable (used only
  at dev time for illustration generation; not needed at build/runtime).

## DNS

Apex domain and www both point to Vercel's shared IP via A records:

```
A  @    76.76.21.21
A  www  76.76.21.21
```

Mail is sent through Resend via `POST /api/subscribe` (sends a welcome email to
the subscriber and a notification email to the owner; no contact list). Resend
verifies the `plaindharma.com` sending domain using DNS records managed via the
Spaceship DNS API:

```
TXT  resend._domainkey  p=MIGf…QAB                          (DKIM)
TXT  send               v=spf1 include:amazonses.com ~all   (SPF)
MX   send               feedback-smtp.ap-northeast-1.amazonses.com
TXT  _dmarc             v=DMARC1; p=none;
```

Only required env: `RESEND_API_KEY` (server-only, never sent to browser). The
API route returns 503 if the key is missing, 502 if Resend rejects the send
(e.g. domain not yet verified in Resend console).

Vercel handles SSL automatically once the A records propagate.

## `next.config.ts` production-relevant settings

```ts
// MDX support
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: { remarkPlugins: [["remark-frontmatter", ["yaml"]]] },
});

// Cache-busting query strings on local illustration paths
images: {
  localPatterns: [
    { pathname: "/illustrations/**" },
    { pathname: "/logo/**" },
  ],
}
```

`allowedDevOrigins` is dev-only and has no effect in production.

## Routing

English is served at `/` (no locale prefix). Per-teaching routes are fully
statically generated:

```ts
// src/app/[slug]/page.tsx
export function generateStaticParams() {
  return SUTTAS.map((slug) => ({ slug }));
}
export const dynamicParams = false;
```

`dynamicParams = false` means any slug not in `SUTTAS` returns a 404 at build
time — no server-side fallback.

## Static export compatibility

The site is built as a hybrid static/RSC app on Vercel. A full static export
(`output: 'export'` in `next.config.ts`) is viable as a fallback for hosting
elsewhere — the site uses no server-only features (no API routes, no
middleware, no server actions). Keep new code compatible with this constraint.

## Adding a new page

1. Create `src/app/{route}/page.tsx`.
2. If it depends on the sutta registry, import from `@/content`.
3. If it should be statically generated, export `generateStaticParams` and
   set `dynamicParams = false`.
4. Push to a branch; Vercel previews it automatically.
5. Merge to main; Vercel deploys to production.

## Future: localization routing

When translations land, the plan is `app/[locale]/...` wrapping the whole
route tree with English served from `/` via a rewrite. See `docs/sitemap.md`
for the full locale routing design and the open English-at-root vs. `/en`
decision.

## Important gotchas

**`getIllustrationUrl` uses `fs.statSync`** — safe in Next.js RSC/SSG at build
time on Vercel, but incompatible with edge runtime. Do not move illustration
URL generation into middleware or edge functions.

**Image `localPatterns` is required** — omitting the `localPatterns` entry
causes Next.js `<Image>` to refuse to serve any local path that includes a
query string (`?v=...`), resulting in broken illustrations in production.

**pnpm lockfile** — Vercel auto-detects pnpm and uses the lockfile for
deterministic installs. Do not commit a mixed yarn/npm lockfile alongside
`pnpm-lock.yaml`.

**Monorepo / hoisted workspace** — the repo is a pnpm workspace (the web app at
the root, plus `apps/mobile` and `packages/content`). `pnpm-workspace.yaml` sets
`nodeLinker: hoisted` (required for React Native under pnpm; workspace-wide).
`next build` only compiles the Next app graph, so the mobile app doesn't affect
the web build — but Vercel installs the whole workspace (including Expo deps), a
heavier install. The web has not moved to `apps/web/` yet; if install weight
becomes a problem, set the Vercel root directory to the web app or exclude
`apps/mobile` from the production install. See [mobile.md](mobile.md).
