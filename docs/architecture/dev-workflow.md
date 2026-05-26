# Dev Workflow — Plain Dharma

*Last updated: 2026-05-26*

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server on port 3000 |
| `pnpm dev:tunnel` | Next.js + ngrok tunnel in parallel; QR auto-printed |
| `pnpm ngrok` | ngrok tunnel only (useful if dev server is already running) |
| `pnpm ngrok:qr` | Print QR for the current running tunnel |
| `pnpm ngrok:status` | Show tunnel URL and status |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm generate-illustrations` | Generate illustration PNGs via Gemini API |
| `pnpm transparentize-illustrations` | Alpha-fade backgrounds in-place via ImageMagick / sharp |

## Phone-on-LAN and ngrok dev

`pnpm dev:tunnel` sets `NGROK=1`, which the `dev` script detects to fork
`ngrok-dev.sh` in the background alongside `next dev`.

`ngrok-dev.sh` behavior:
- Prefers system `ngrok` binary (v3 config format); falls back to
  `./node_modules/.bin/ngrok` (v2 format — different YAML syntax).
- Kills any existing `ngrok http` process before starting.
- Polls the ngrok agent API at `http://127.0.0.1:4040/api/tunnels` for the
  public URL (up to 500ms, fails fast if auth is broken).
- Prints the URL and an inline ANSI QR code via `qrencode` so a phone can
  scan immediately.

`pnpm ngrok:qr` re-prints the QR for the currently running tunnel — useful
when switching between browser and phone without restarting.

## Key files

| File | Role |
|---|---|
| `package.json` | All npm scripts |
| `scripts/shell/ngrok-dev.sh` | Start ngrok, poll for URL, print QR |
| `scripts/shell/ngrok-qr.sh` | Print QR for running tunnel |
| `scripts/shell/ngrok-status.sh` | Show tunnel status from agent API |
| `next.config.ts` | `allowedDevOrigins` — lets phone + ngrok hostnames load HMR |

## `allowedDevOrigins`

Next.js 16 blocks cross-origin requests to `/_next/*` by default. These
origins are allowlisted in `next.config.ts`:

```ts
allowedDevOrigins: [
  "192.168.1.140",   // local LAN IP (phone on same wifi)
  "*.ngrok.app",
  "*.ngrok.io",
  "*.ngrok-free.app",
]
```

Update the LAN IP if your network changes.

## MDX content authoring

Edit files directly in `src/content/en/`. HMR picks up changes instantly.
Frontmatter is stripped by `remark-frontmatter` — to update metadata (title,
subtitle, etc.) edit `SUTTA_META` in `src/content/index.ts`.

## Illustration workflow

1. Edit the `JOBS` array in `scripts/generate-illustrations.ts` if you want
   to change a prompt.
2. Delete `public/illustrations/{slug}.png` to force regeneration.
3. Run `pnpm generate-illustrations` (needs `GOOGLE_GENERATIVE_AI_KEY` in
   `.env.local`).
4. Run `pnpm transparentize-illustrations` to strip the white background.
5. For dark-mode: repeat with a re-tinted prompt, save as `{slug}-dark.png`,
   then transparentize again.

## Important gotchas

**System ngrok vs. npm ngrok** — system ngrok uses v3 config format
(`~/.config/ngrok/ngrok.yml`); the npm-installed `ngrok@5.0.0-beta.2` uses v2
format. The shell script prefers system, which is the right default. If you
must use the npm version, ensure the auth token is set via the v2 config path.

**`NGROK=1` env var** — the dev script checks `$NGROK` (set by `dev:tunnel`)
to decide whether to fork ngrok. Running `pnpm dev` directly never starts
ngrok, even if `ngrok-dev.sh` is on PATH.

**`tsx` for scripts** — one-off TypeScript scripts under `scripts/` run via
`tsx` (or `node --import tsx` for `.env.local` support). They are not part of
the Next.js compile graph; changes to them require re-running the script
manually.
