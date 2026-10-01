import { readdirSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const UI_DIR = join(import.meta.dirname, "..", "..", "ui");
const TEMPLATE_MANIFEST = join(import.meta.dirname, "..", "template", "package.json");

function packageName(specifier: string): string {
  const [scopeOrName, scopedName] = specifier.split("/");
  return scopeOrName.startsWith("@") ? `${scopeOrName}/${scopedName}` : scopeOrName;
}

function importedPackages(): Map<string, string[]> {
  const srcDir = join(UI_DIR, "src");
  const importers = new Map<string, string[]>();
  for (const file of readdirSync(srcDir, { recursive: true, encoding: "utf8" })) {
    if (!/\.tsx?$/.test(file) || file.endsWith(".d.ts")) continue;
    const source = readFileSync(join(srcDir, file), "utf8");
    for (const [, specifier] of source.matchAll(/(?:from|import)\s+["']([^"'.][^"']*)["']/g)) {
      const name = packageName(specifier);
      if (name.startsWith("node:") || builtinModules.includes(name)) continue;
      importers.set(name, [...(importers.get(name) ?? []), file]);
    }
  }
  return importers;
}

describe("@inbeat/ui dependencies", () => {
  const uiManifest = JSON.parse(readFileSync(join(UI_DIR, "package.json"), "utf8"));
  const templateManifest = JSON.parse(readFileSync(TEMPLATE_MANIFEST, "utf8"));
  const installedInTemplate = new Set([
    ...Object.keys(templateManifest.dependencies),
    ...Object.keys(templateManifest.devDependencies),
    ...Object.keys(uiManifest.dependencies),
  ]);

  it("lets every component import resolve in a new project", () => {
    const missing = [...importedPackages()]
      .filter(([name]) => !installedInTemplate.has(name))
      .map(([name, files]) => `${name} (${files.join(", ")})`);
    expect(missing).toEqual([]);
  });

  it("declares every imported package as a peer or dependency of @inbeat/ui", () => {
    const declared = new Set([
      ...Object.keys(uiManifest.dependencies),
      ...Object.keys(uiManifest.peerDependencies),
    ]);
    const undeclared = [...importedPackages().keys()].filter((name) => !declared.has(name));
    expect(undeclared).toEqual([]);
  });

  it("ships no .d.ts under src; consumers type-check the source and never load it", () => {
    const declarationFiles = readdirSync(join(UI_DIR, "src"), {
      recursive: true,
      encoding: "utf8",
    }).filter((file) => file.endsWith(".d.ts"));
    expect(declarationFiles).toEqual([]);
  });

  it("requires the peers that core components always import", () => {
    expect(uiManifest.peerDependenciesMeta).not.toHaveProperty("motion");
  });
});
