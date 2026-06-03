import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code agent worktrees are isolated branches (e.g. the RN mobile
    // port) — not part of this project's lint surface.
    ".claude/worktrees/**",
    // Expo's generated types (regenerated on every build).
    "apps/mobile/.expo/**",
  ]),
  // CommonJS tooling — the Metro config and the reset-project node script are
  // CommonJS by necessity, so `require()` is correct there, not a smell.
  {
    files: [
      "**/*.config.{js,cjs}",
      "apps/mobile/metro.config.js",
      "apps/mobile/scripts/**/*.js",
    ],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // React Native / Expo bundle static assets (fonts, images) through
  // `require()` — Metro has no ESM equivalent (e.g. `useFonts({ … require(…) })`
  // in _layout.tsx), so allow it in the mobile app sources.
  {
    files: ["apps/mobile/**/*.{ts,tsx}"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]);

export default eslintConfig;
