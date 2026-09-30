import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const ROOT = join(import.meta.dir, "..");

export type ToolkitPackage = {
  dir: string;
  name: string;
  shortName: string;
  version: string;
  files: string[];
};

export function toolkitPackages(): ToolkitPackage[] {
  const packagesDir = join(ROOT, "packages");
  return readdirSync(packagesDir).map((entry) => {
    const dir = join(packagesDir, entry);
    const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    return {
      dir,
      name: manifest.name,
      shortName: entry,
      version: manifest.version,
      files: (manifest.files as string[]).filter((pattern) => !pattern.startsWith("!")),
    };
  });
}

const DEPENDENCY_FIELDS = ["dependencies", "peerDependencies", "devDependencies"] as const;

// Bun 1.3 resolves `workspace:` ranges from the versions recorded in bun.lock, which
// release-please never bumps, so 0.1.1 of next shipped pinned to core 0.1.0. Resolve them
// from the manifests instead, as caret ranges so apps dedupe to a single copy.
export async function withWorkspaceRanges<T>(
  pkg: ToolkitPackage,
  run: () => Promise<T>,
): Promise<T> {
  const manifestPath = join(pkg.dir, "package.json");
  const original = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(original);
  const versions = new Map(toolkitPackages().map((sibling) => [sibling.name, sibling.version]));
  const resolveRanges = (ranges: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(ranges).map(([name, range]) => [
        name,
        range.startsWith("workspace:") ? `^${versions.get(name)}` : range,
      ]),
    );
  const resolved = Object.fromEntries(
    DEPENDENCY_FIELDS.filter((field) => field in manifest).map((field) => [
      field,
      resolveRanges(manifest[field]),
    ]),
  );
  writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, ...resolved }, null, 2)}\n`);
  try {
    return await run();
  } finally {
    writeFileSync(manifestPath, original);
  }
}
