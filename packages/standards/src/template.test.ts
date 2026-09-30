import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildTemplate } from "./template";

function fixtureSource(files: string[]): string {
  const source = mkdtempSync(join(tmpdir(), "ib-tpl-src-"));
  for (const file of files) {
    mkdirSync(dirname(join(source, file)), { recursive: true });
    writeFileSync(join(source, file), "x");
  }
  return source;
}

function build(files: string[]): string {
  const destination = join(mkdtempSync(join(tmpdir(), "ib-tpl-out-")), "template");
  buildTemplate(fixtureSource(files), destination);
  return destination;
}

describe("buildTemplate", () => {
  it("ships sources and renames tarball-unsafe dotfiles", () => {
    const out = build(["package.json", ".gitignore", ".npmrc", ".env.example", "src/app.ts"]);
    expect(readdirSync(out, { recursive: true }).sort()).toEqual(
      [".env.example", "_gitignore", "_npmrc", "package.json", "src", "src/app.ts"].sort(),
    );
  });

  it("drops secrets, dependencies and build output", () => {
    const out = build([
      "package.json",
      ".env",
      ".env.local",
      ".env.development",
      ".env.production.local",
      "src/.env",
      "node_modules/a/index.js",
      ".next/cache/x",
      ".turbo/log",
      "coverage/lcov",
      "tsconfig.tsbuildinfo",
      "src/nested.tsbuildinfo",
      "next-env.d.ts",
      "src/keep.ts",
    ]);
    expect(readdirSync(out, { recursive: true }).sort()).toEqual(
      ["package.json", "src", "src/keep.ts"].sort(),
    );
    expect(existsSync(join(out, ".env"))).toBe(false);
  });

  it.each([["_gitignore"], ["_npmrc"], ["src/.gitignore"], ["src/.npmrc"]])(
    "refuses a source containing %s",
    (file) => {
      expect(() => build(["package.json", file])).toThrow(file);
    },
  );
});
