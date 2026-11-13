import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { typeScaleProblems } from "./type-scale";

const appDirs: string[] = [];

function appWith(files: Record<string, string>): string {
  const appDir = mkdtempSync(join(tmpdir(), "ib-type-scale-"));
  appDirs.push(appDir);
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(appDir, path, ".."), { recursive: true });
    writeFileSync(join(appDir, path), contents);
  }
  return appDir;
}

afterEach(() => {
  for (const appDir of appDirs.splice(0)) rmSync(appDir, { recursive: true, force: true });
});

describe("typeScaleProblems", () => {
  it("accepts the roles of the scale, display sizes included", () => {
    const appDir = appWith({
      "src/page.tsx":
        '<h1 className="text-xl font-semibold">Title</h1>\n<p className="text-sm text-[var(--brand)]">Body</p>\n<p className="text-3xl font-medium">Hero</p>\n<code className="text-[0.85em]">x</code>',
    });

    expect(typeScaleProblems(appDir)).toEqual([]);
  });

  it("reports each hand-set size and weight with its file and line", () => {
    const appDir = appWith({
      "src/features/list.tsx": '<p>ok</p>\n<p className="text-[13px] font-bold">Name</p>',
      "src/card.tsx": '<span className="text-[0.8rem] font-[510]">x</span>',
    });

    expect(typeScaleProblems(appDir).sort()).toEqual([
      "src/card.tsx:1 font-[510] (hand-set font weight)",
      "src/card.tsx:1 text-[0.8rem] (hand-set font size)",
      "src/features/list.tsx:2 font-bold (weight outside regular, medium, semibold)",
      "src/features/list.tsx:2 text-[13px] (hand-set font size)",
    ]);
  });

  it("ignores files that are not components and apps without a src folder", () => {
    expect(typeScaleProblems(appWith({ "src/notes.md": "text-[13px]" }))).toEqual([]);
    expect(typeScaleProblems(appWith({ "README.md": "x" }))).toEqual([]);
  });
});
