# Bug 018: Next.js Build Fails on Deno Edge Function URL Imports

**Date:** 2026-06-08  
**Severity:** High — silently blocked all production deploys for ~11 hours  
**Status:** Fixed

## Symptom

Production builds on Vercel failed with:

```
Failed to type check. Type error: Cannot find module 'https://esm.sh/@supabase/supabase-js@2' 
or its corresponding type declarations.
Error: Command 'pnpm run build' exited with 1
```

Every `next build` errored at approximately 30 seconds. The error occurred silently in the build pipeline — failing deploys were never promoted, so the live site remained on the last good build from ~11 hours prior. While Vercel's UI showed a "Failed" deploy, the user-facing site looked fine, making the outage nearly invisible.

## Root Cause

Three days prior, the Supabase Edge Function at `supabase/functions/delete-account/index.ts` was added to support the in-app account-deletion feature (App Store Guideline 5.1.1(v)). This Deno code uses URL imports:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
```

The Next.js project's `tsconfig.json` had:
```json
"include": ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
"exclude": ["node_modules", "scripts", "apps"]
```

**The `supabase/` directory was not excluded.** When `next build` ran, it type-checked every TypeScript file in the project, including the Deno edge function. The Node/Next TypeScript resolver cannot resolve Deno URL imports (`https://esm.sh/...`), causing the build to fail. Deno edge functions are meant to be type-checked by Supabase's Deno toolchain, not by Next.

## Why It Was Hard to Find

- **Silent promotion:** Vercel showed a red "Deploy Failed" status, but the previous build remained live (no interruption visible to users).
- **Delayed symptom appearance:** The edge function was added 3 days prior, but the build only failed once someone tried to deploy the next change.
- **Generic error message:** The TypeScript error pointed at the URL import, not at the root cause (tsconfig exclusion).
- **No local reproducer:** The developer's local `next build` likely passed because their machine's Node modules or TypeScript cache masked the issue, or they had not run a clean build since the edge function was added.

## The Fix

Added `"supabase"` to the `exclude` array in `tsconfig.json`:

**Before:**
```json
"exclude": ["node_modules", "scripts", "apps"]
```

**After:**
```json
"exclude": ["node_modules", "scripts", "apps", "supabase"]
```

After the fix, `npx tsc -p tsconfig.json --noEmit` passes cleanly, and production deploys succeed. The edge function is still deployed via Supabase's `supabase functions deploy` command (separate from the Next build) and is type-checked by Deno's resolver, which understands URL imports.

## Key Rule

**Exclude Deno/edge-function directories from the Next/Node tsconfig — they use URL imports that the Node resolver cannot follow.**

Deno has its own type-checking system. Edge functions should be validated by Supabase tooling, not by Next.js. Add any Deno-only directories (e.g., `supabase/`, `functions/`) to tsconfig's `exclude` array immediately after they are created.

## Files Involved

- `/Users/fotoflo/dev/plain-dharma/tsconfig.json` — added `"supabase"` to `exclude`
- `/Users/fotoflo/dev/plain-dharma/supabase/functions/delete-account/index.ts` — the triggering edge function (unchanged)

## Verification

Before fix:
```bash
$ npx tsc -p tsconfig.json --noEmit
src/app/api/subscribe/route.ts:28:31 - error TS2307: Cannot find module 'https://esm.sh/@supabase/supabase-js@2' or its corresponding type declarations.
```

After fix:
```bash
$ npx tsc -p tsconfig.json --noEmit
# (no errors)
$ pnpm build
# ✓ Production build completes successfully
```
