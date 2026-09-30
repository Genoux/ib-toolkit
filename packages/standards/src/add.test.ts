import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { add } from "./add";
import { create } from "./create";
import { fixtureAddons, fixtureTemplate } from "./test/fixtures";

const env = { NODE_AUTH_TOKEN: "token" };
const succeed = () => {};
const failInstall = (command: string) => {
  if (command === "bun") throw new Error("`bun install` failed");
};

function tree(dir: string): Record<string, string> {
  return Object.fromEntries(
    readdirSync(dir, { recursive: true, encoding: "utf8" })
      .filter((path) => !path.startsWith(".git") && path !== ".env.local")
      .flatMap((path) => {
        try {
          return [[path, readFileSync(join(dir, path), "utf8")]];
        } catch {
          return [];
        }
      }),
  );
}

async function plainProject() {
  const templateDir = fixtureTemplate();
  const addonsDir = fixtureAddons();
  const projectDir = join(mkdtempSync(join(tmpdir(), "ib-add-")), "app");
  await create(projectDir, { local: false, templateDir, run: succeed, env });
  return { templateDir, addonsDir, projectDir, options: { templateDir, addonsDir, run: succeed } };
}

describe("add", () => {
  it("applies the addon to a freshly created project", async () => {
    const { projectDir, options } = await plainProject();
    await add("demo", { projectDir, ...options });

    expect(readFileSync(join(projectDir, "src/app/layout.tsx"), "utf8")).toBe("demo layout");
    expect(readFileSync(join(projectDir, "src/app/demo/page.tsx"), "utf8")).toBe("demo page");
    expect(readFileSync(join(projectDir, ".env.example"), "utf8")).toContain("DEMO_KEY");
    const manifest = JSON.parse(readFileSync(join(projectDir, "package.json"), "utf8"));
    expect(manifest.dependencies["demo-sdk"]).toBe("^1.0.0");
    expect(manifest.ib.addons).toEqual(["demo"]);
  });

  it("appends the addon's new env keys to .env.local without touching existing values", async () => {
    const { projectDir, options } = await plainProject();
    writeFileSync(join(projectDir, ".env.local"), "APP_URL=http://mine\n");
    await add("demo", { projectDir, ...options });
    expect(readFileSync(join(projectDir, ".env.local"), "utf8")).toBe(
      "APP_URL=http://mine\nDEMO_KEY=\n",
    );
  });

  it("prints the addon's next steps", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const { projectDir, options } = await plainProject();
    await add("demo", { projectDir, ...options });
    expect(info.mock.calls.flat().join("\n")).toMatch(
      /Added demo\.\n\nNext steps:\n {2}fill the demo keys in \.env\.local\n {2}bun dev/,
    );
  });

  it("refuses a modified replacement and writes nothing", async () => {
    const { projectDir, options } = await plainProject();
    writeFileSync(join(projectDir, "src/app/layout.tsx"), "hand edited");
    const before = tree(projectDir);
    await expect(add("demo", { projectDir, ...options })).rejects.toThrow("src/app/layout.tsx");
    expect(tree(projectDir)).toEqual(before);
  });

  it("treats a file already merged to the addon version as satisfied", async () => {
    const { projectDir, options } = await plainProject();
    writeFileSync(join(projectDir, "src/app/layout.tsx"), "demo layout");
    await add("demo", { projectDir, ...options });
    expect(readFileSync(join(projectDir, "src/app/demo/page.tsx"), "utf8")).toBe("demo page");
  });

  it("refuses an addon that is already applied", async () => {
    const { projectDir, options } = await plainProject();
    await add("demo", { projectDir, ...options });
    await expect(add("demo", { projectDir, ...options })).rejects.toThrow("already");
  });

  it("refuses unknown addons and directories that are not inBeat apps", async () => {
    const { projectDir, options } = await plainProject();
    await expect(add("nope", { projectDir, ...options })).rejects.toThrow("nope");

    const empty = mkdtempSync(join(tmpdir(), "ib-add-"));
    await expect(add("demo", { projectDir: empty, ...options })).rejects.toThrow("inBeat app");

    const foreign = mkdtempSync(join(tmpdir(), "ib-add-"));
    writeFileSync(join(foreign, "package.json"), JSON.stringify({ name: "other" }));
    await expect(add("demo", { projectDir: foreign, ...options })).rejects.toThrow("inBeat app");
  });

  it("restores what it touched when a later step fails", async () => {
    const { projectDir, options } = await plainProject();
    const before = tree(projectDir);
    await expect(add("demo", { projectDir, ...options, run: failInstall })).rejects.toThrow(
      "bun install",
    );
    expect(tree(projectDir)).toEqual(before);
  });
});
