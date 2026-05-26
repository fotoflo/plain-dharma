import { statSync } from "node:fs";
import path from "node:path";

function versioned(publicPath: string): string {
  const filePath = path.join(process.cwd(), "public", publicPath);
  try {
    const mtime = statSync(filePath).mtimeMs;
    return `/${publicPath}?v=${Math.floor(mtime / 1000)}`;
  } catch {
    return `/${publicPath}`;
  }
}

export function getLogoUrl(): string {
  return versioned("logo/plain-dharma-logo.png");
}

export function getLogoDarkUrl(): string {
  return versioned("logo/plain-dharma-logo-dark.png");
}
