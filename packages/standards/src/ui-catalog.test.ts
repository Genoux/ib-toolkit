import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const UI_SRC = join(import.meta.dirname, "..", "..", "ui", "src");
const SKILL = join(import.meta.dirname, "..", "skills", "ib-ui", "SKILL.md");
const MODULE_DIRECTORIES = ["components", "hooks", "lib"];

function exportedModules(): string[] {
  return MODULE_DIRECTORIES.flatMap((directory) =>
    readdirSync(join(UI_SRC, directory)).map(
      (file) => `${directory}/${file.replace(/\.tsx?$/, "")}`,
    ),
  ).sort();
}

function cataloguedModules(): string[] {
  const skill = readFileSync(SKILL, "utf8");
  const catalog = skill.split(/^## /m).find((section) => section.startsWith("Catalog")) ?? "";
  return [...catalog.matchAll(/^- `((?:components|hooks|lib)\/[a-z-]+)`/gm)]
    .map(([, name]) => name)
    .sort();
}

describe("ib-ui catalog", () => {
  it("lists every @inbeat/ui module exactly once", () => {
    const catalogued = cataloguedModules();
    expect(new Set(catalogued).size).toBe(catalogued.length);
    const modules = exportedModules();
    expect({
      missingFromCatalog: modules.filter((name) => !catalogued.includes(name)),
      unknownInCatalog: catalogued.filter((name) => !modules.includes(name)),
    }).toEqual({ missingFromCatalog: [], unknownInCatalog: [] });
  });
});
