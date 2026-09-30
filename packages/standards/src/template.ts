import { cpSync, readdirSync, rmSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";

// npm and bun drop files named .gitignore and .npmrc from tarballs
// (https://docs.npmjs.com/cli/configuring-npm/package-json#files), so the built template stores them renamed.
export const TARBALL_SAFE_NAMES: Record<string, string> = {
  ".gitignore": "_gitignore",
  ".npmrc": "_npmrc",
};

const EXCLUDED_TOP_LEVEL = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "coverage",
  ".vercel",
  ".DS_Store",
  "next-env.d.ts",
]);

export function restoreDotfileName(name: string): string {
  return Object.entries(TARBALL_SAFE_NAMES).find(([, safe]) => safe === name)?.[0] ?? name;
}

export function isExcluded(relativePath: string): boolean {
  const [topLevel] = relativePath.split(sep);
  const name = basename(relativePath);
  const isSecret = name.startsWith(".env") && name !== ".env.example";
  return EXCLUDED_TOP_LEVEL.has(topLevel) || name.endsWith(".tsbuildinfo") || isSecret;
}

function assertNoPackCollisions(source: string, shipped: string[]): void {
  const collisions = shipped.filter((path) => {
    const name = basename(path);
    const isNested = path !== name;
    return (
      Object.values(TARBALL_SAFE_NAMES).includes(name) || (isNested && name in TARBALL_SAFE_NAMES)
    );
  });
  if (collisions.length > 0) {
    throw new Error(
      `${source} contains paths the tarball would drop or collide with:\n  ${collisions.join("\n  ")}`,
    );
  }
}

export function buildTemplate(source: string, destination: string): void {
  const shipped = readdirSync(source, { recursive: true, encoding: "utf8" }).filter(
    (path) => !isExcluded(path),
  );
  assertNoPackCollisions(source, shipped);
  rmSync(destination, { recursive: true, force: true });
  for (const entry of readdirSync(source).filter((name) => !isExcluded(name))) {
    cpSync(join(source, entry), join(destination, TARBALL_SAFE_NAMES[entry] ?? entry), {
      recursive: true,
      filter: (path) => !isExcluded(relative(source, path)),
    });
  }
}
