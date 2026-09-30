import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { applyAddon, listAddons, planOverlay } from "./addons";

function write(root: string, file: string, contents: string): void {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), contents);
}

function fixtureAddons(): string {
  const addons = mkdtempSync(join(tmpdir(), "ib-addons-"));
  write(addons, "demo/files/src/app/layout.tsx", "demo layout");
  write(addons, "demo/files/src/app/demo/page.tsx", "demo page");
  write(addons, "demo/files/.env.example", "DEMO_KEY=");
  write(
    addons,
    "demo/addon.json",
    JSON.stringify({
      dependencies: { "demo-sdk": "^1.0.0" },
      devDependencies: { "demo-types": "^2.0.0" },
    }),
  );
  return addons;
}

function fixtureBase(): string {
  const base = mkdtempSync(join(tmpdir(), "ib-base-"));
  write(base, "src/app/layout.tsx", "base layout");
  write(base, "src/app/page.tsx", "base page");
  return base;
}

function fixtureProject(): string {
  const project = mkdtempSync(join(tmpdir(), "ib-project-"));
  write(project, "src/app/layout.tsx", "base layout");
  write(project, "src/app/page.tsx", "base page");
  write(
    project,
    "package.json",
    JSON.stringify({ name: "app", dependencies: { next: "16.0.0" }, devDependencies: {} }),
  );
  return project;
}

describe("listAddons", () => {
  it("lists addon folders", () => {
    expect(listAddons(fixtureAddons())).toEqual(["demo"]);
  });
});

describe("planOverlay", () => {
  const addonDir = () => join(fixtureAddons(), "demo");

  it("writes new files and base-identical replacements", () => {
    const plan = planOverlay(fixtureProject(), addonDir(), fixtureBase());
    expect(plan.write.sort()).toEqual(
      [
        ".env.example",
        join("src", "app", "demo", "page.tsx"),
        join("src", "app", "layout.tsx"),
      ].sort(),
    );
    expect(plan.satisfied).toEqual([]);
    expect(plan.blocked).toEqual([]);
  });

  it("treats files already equal to the addon version as satisfied", () => {
    const project = fixtureProject();
    write(project, "src/app/layout.tsx", "demo layout");
    const plan = planOverlay(project, addonDir(), fixtureBase());
    expect(plan.satisfied).toEqual([join("src", "app", "layout.tsx")]);
    expect(plan.write).not.toContain(join("src", "app", "layout.tsx"));
  });

  it("blocks modified replacements and pre-existing new files", () => {
    const project = fixtureProject();
    write(project, "src/app/layout.tsx", "hand edited");
    write(project, "src/app/demo/page.tsx", "mine");
    expect(planOverlay(project, addonDir(), fixtureBase()).blocked.sort()).toEqual(
      [join("src", "app", "demo", "page.tsx"), join("src", "app", "layout.tsx")].sort(),
    );
  });
});

describe("applyAddon", () => {
  it("writes and replaces exactly the overlay files, merges dependencies and records the addon", () => {
    const project = fixtureProject();
    const written = applyAddon(project, join(fixtureAddons(), "demo"), fixtureBase());

    expect(written.sort()).toEqual(
      [
        join("src", "app", "demo", "page.tsx"),
        join("src", "app", "layout.tsx"),
        ".env.example",
        "package.json",
      ].sort(),
    );
    expect(readFileSync(join(project, "src/app/layout.tsx"), "utf8")).toBe("demo layout");
    expect(readFileSync(join(project, "src/app/page.tsx"), "utf8")).toBe("base page");
    expect(readdirSync(join(project, "src/app")).sort()).toEqual([
      "demo",
      "layout.tsx",
      "page.tsx",
    ]);

    const manifest = JSON.parse(readFileSync(join(project, "package.json"), "utf8"));
    expect(manifest.dependencies).toEqual({ "demo-sdk": "^1.0.0", next: "16.0.0" });
    expect(manifest.devDependencies).toEqual({ "demo-types": "^2.0.0" });
    expect(manifest.ib.addons).toEqual(["demo"]);
  });

  it("writes nothing and names the addon version path when a file needs merging", () => {
    const project = fixtureProject();
    write(project, "src/app/layout.tsx", "hand edited");
    const addonDir = join(fixtureAddons(), "demo");
    expect(() => applyAddon(project, addonDir, fixtureBase())).toThrow(
      new RegExp(
        `layout\\.tsx[\\s\\S]*${join(addonDir, "files", "src", "app", "layout.tsx").replaceAll("\\", "\\\\")}`,
      ),
    );
    expect(readFileSync(join(project, "src/app/layout.tsx"), "utf8")).toBe("hand edited");
    expect(readdirSync(join(project, "src/app")).sort()).toEqual(["layout.tsx", "page.tsx"]);
    expect(readFileSync(join(project, "package.json"), "utf8")).not.toContain("demo-sdk");
  });
});
