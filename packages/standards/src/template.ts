import { readdirSync } from "node:fs";
import { basename, sep } from "node:path";

// npm and bun drop files named .gitignore from tarballs
// (https://docs.npmjs.com/cli/configuring-npm/package-json#files), so the template commits them renamed.
export const TARBALL_SAFE_NAMES: Record<string, string> = {
  ".gitignore": "_gitignore",
};

export function restoreDotfileName(name: string): string {
  return Object.entries(TARBALL_SAFE_NAMES).find(([, safe]) => safe === name)?.[0] ?? name;
}

// A checkout's template folder collects dev output; the published tarball never has these (see "files" in package.json).
const UNSHIPPED_TOP_LEVEL = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "coverage",
  ".vercel",
  ".DS_Store",
  "next-env.d.ts",
]);

export function isShipped(relativePath: string): boolean {
  const [topLevel] = relativePath.split(sep);
  const name = basename(relativePath);
  const isSecret = name.startsWith(".env") && name !== ".env.example";
  return !(UNSHIPPED_TOP_LEVEL.has(topLevel) || name.endsWith(".tsbuildinfo") || isSecret);
}

export function templateEntries(templateDir: string): string[] {
  return readdirSync(templateDir).filter(isShipped);
}
