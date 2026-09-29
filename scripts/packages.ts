import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const ROOT = join(import.meta.dir, "..");

export type ToolkitPackage = {
  dir: string;
  name: string;
  shortName: string;
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
      files: (manifest.files as string[]).filter((pattern) => !pattern.startsWith("!")),
    };
  });
}
