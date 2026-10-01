import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  create,
  findConflicts,
  findToolkitRoot,
  locationStep,
  projectName,
  rewriteManifest,
  validateProjectName,
} from "./create";
import { restoreDotfileName } from "./template";

const manifest = {
  name: "@inbeat/template",
  version: "0.0.0",
  private: true,
  dependencies: { "@inbeat/core": "workspace:^", next: "16.1.6" },
  devDependencies: { "@inbeat/standards": "workspace:^", vitest: "^4.1.1" },
};

describe("projectName", () => {
  it.each([
    ["/tmp/My Cool_App", "my-cool-app"],
    ["./acme.Dashboard/", "acme-dashboard"],
    ["already-kebab", "already-kebab"],
  ])("derives %s -> %s", (dir, expected) => {
    expect(projectName(dir)).toBe(expected);
  });
});

describe("restoreDotfileName", () => {
  it("renames tarball-safe names back to dotfiles", () => {
    expect(restoreDotfileName("_gitignore")).toBe(".gitignore");
    expect(restoreDotfileName("_npmrc")).toBe(".npmrc");
  });

  it("leaves other names alone", () => {
    expect(restoreDotfileName("package.json")).toBe("package.json");
    expect(restoreDotfileName(".claude")).toBe(".claude");
  });
});

describe("findConflicts", () => {
  const entries = ["package.json", "_gitignore", "src"];

  it("reports nothing for a missing folder", () => {
    expect(findConflicts(join(tmpdir(), "ib-missing-folder"), entries)).toEqual([]);
  });

  it("allows folders holding only unrelated files", () => {
    const dir = mkdtempSync(join(tmpdir(), "ib-create-"));
    mkdirSync(join(dir, ".git"));
    writeFileSync(join(dir, "brief.md"), "notes");
    expect(findConflicts(dir, entries)).toEqual([]);
  });

  it("lists every conflict under its project name", () => {
    const dir = mkdtempSync(join(tmpdir(), "ib-create-"));
    writeFileSync(join(dir, "package.json"), "{}");
    writeFileSync(join(dir, ".gitignore"), "");
    expect(findConflicts(dir, entries)).toEqual(["package.json", ".gitignore"]);
  });
});

describe("rewriteManifest", () => {
  it("names the project and pins workspace ranges to the standards version", () => {
    const rewritten = rewriteManifest(manifest, { name: "acme", version: "0.1.2" });
    expect(rewritten.name).toBe("acme");
    expect(rewritten.dependencies).toEqual({ "@inbeat/core": "^0.1.2", next: "16.1.6" });
    expect(rewritten.devDependencies).toEqual({ "@inbeat/standards": "^0.1.2", vitest: "^4.1.1" });
    expect(rewritten).not.toHaveProperty("overrides");
  });

  it("points workspace deps at local tarballs and overrides every package", () => {
    const tarballs = {
      "@inbeat/core": "file:/toolkit/.packs/inbeat-core.tgz",
      "@inbeat/next": "file:/toolkit/.packs/inbeat-next.tgz",
      "@inbeat/standards": "file:/toolkit/.packs/inbeat-standards.tgz",
    };
    const rewritten = rewriteManifest(manifest, { name: "acme", version: "0.1.2", tarballs });
    expect(rewritten.dependencies?.["@inbeat/core"]).toBe(tarballs["@inbeat/core"]);
    expect(rewritten.dependencies?.next).toBe("16.1.6");
    expect(rewritten.devDependencies?.["@inbeat/standards"]).toBe(tarballs["@inbeat/standards"]);
    expect(rewritten.overrides).toEqual(tarballs);
  });

  it("does not mutate the input", () => {
    rewriteManifest(manifest, { name: "acme", version: "0.1.2" });
    expect(manifest.name).toBe("@inbeat/template");
    expect(manifest.dependencies["@inbeat/core"]).toBe("workspace:^");
  });
});

describe("validateProjectName", () => {
  it.each(["acme", "a1-b2"])("accepts %s", (name) => {
    expect(() => validateProjectName(name)).not.toThrow();
  });

  it.each(["", "-x", "node_modules", "favicon.ico", "a".repeat(215), "Has Caps"])(
    "rejects %j with a folder name suggestion",
    (name) => {
      expect(() => validateProjectName(name)).toThrow(/folder/);
    },
  );
});

describe("findToolkitRoot", () => {
  function fixtureToolkit(packLocal: boolean): string {
    const root = mkdtempSync(join(tmpdir(), "ib-toolkit-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "ib-toolkit" }));
    mkdirSync(join(root, "scripts"));
    if (packLocal) writeFileSync(join(root, "scripts", "pack-local.ts"), "");
    mkdirSync(join(root, "packages", "standards"), { recursive: true });
    return root;
  }

  it("finds the root from a nested folder", () => {
    const root = fixtureToolkit(true);
    expect(findToolkitRoot(join(root, "packages", "standards"))).toBe(root);
  });

  it("requires scripts/pack-local.ts", () => {
    expect(findToolkitRoot(fixtureToolkit(false))).toBeNull();
  });
});

describe("create", () => {
  function fixtureTemplate(): string {
    const template = mkdtempSync(join(tmpdir(), "ib-create-tpl-"));
    mkdirSync(join(template, "src"));
    writeFileSync(join(template, "src", "page.ts"), "page");
    writeFileSync(join(template, "_gitignore"), "node_modules");
    writeFileSync(join(template, ".env.example"), "KEY=");
    writeFileSync(
      join(template, "package.json"),
      JSON.stringify({ name: "@inbeat/template", dependencies: { "@inbeat/core": "workspace:^" } }),
    );
    return template;
  }

  const env = { NODE_AUTH_TOKEN: "token" };
  const succeed = () => {};
  const failInstall = (command: string) => {
    if (command === "bun") throw new Error("`bun install` failed");
  };

  it("copies the template, restores dotfiles, rewrites the manifest and seeds .env.local", async () => {
    const target = join(mkdtempSync(join(tmpdir(), "ib-create-")), "My App");
    await create(target, { local: false, templateDir: fixtureTemplate(), run: succeed, env });
    expect(readFileSync(join(target, ".gitignore"), "utf8")).toBe("node_modules");
    expect(existsSync(join(target, "_gitignore"))).toBe(false);
    expect(readFileSync(join(target, ".env.local"), "utf8")).toBe("KEY=");
    const manifest = JSON.parse(readFileSync(join(target, "package.json"), "utf8"));
    expect(manifest.name).toBe("my-app");
    expect(manifest.dependencies["@inbeat/core"]).toMatch(/^\^\d/);
  });

  it("leaves dev output and secrets of a checkout's template folder behind", async () => {
    const template = fixtureTemplate();
    for (const file of [
      ".next/cache",
      "node_modules/a/index.js",
      "src/app.tsbuildinfo",
      ".env.local",
    ]) {
      mkdirSync(dirname(join(template, file)), { recursive: true });
      writeFileSync(join(template, file), "dev");
    }
    const target = join(mkdtempSync(join(tmpdir(), "ib-create-")), "clean");
    await create(target, { local: false, templateDir: template, run: succeed, env });
    const written = readdirSync(target, { recursive: true });
    expect(written).toEqual(expect.arrayContaining(["src/page.ts", ".gitignore"]));
    expect(written).not.toContain(".next");
    expect(written).not.toContain("node_modules");
    expect(written).not.toContain("src/app.tsbuildinfo");
    expect(readFileSync(join(target, ".env.local"), "utf8")).toBe("KEY=");
  });

  it("writes no toolkit bookkeeping into the manifest", async () => {
    const target = join(mkdtempSync(join(tmpdir(), "ib-create-")), "plain");
    await create(target, { local: false, templateDir: fixtureTemplate(), run: succeed, env });
    expect(JSON.parse(readFileSync(join(target, "package.json"), "utf8"))).not.toHaveProperty("ib");
  });

  it("prints the location and next steps", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const target = join(mkdtempSync(join(tmpdir(), "ib-create-")), "plain");
    await create(target, { local: false, templateDir: fixtureTemplate(), run: succeed, env });
    const printed = info.mock.calls.map(([message]) => message).join("\n");
    expect(printed).toMatch(
      /Success! Created plain at .*plain\n\nNext steps:\n {2}cd .*plain\n {2}bun dev/,
    );
    expect(printed).not.toContain("Clerk");
  });

  it("refuses conflicts without writing anything", async () => {
    const target = mkdtempSync(join(tmpdir(), "ib-create-"));
    writeFileSync(join(target, "package.json"), "{}");
    await expect(
      create(target, { local: false, templateDir: fixtureTemplate(), run: succeed, env }),
    ).rejects.toThrow("package.json");
    expect(readdirSync(target)).toEqual(["package.json"]);
  });

  it("refuses without NODE_AUTH_TOKEN in registry mode", async () => {
    const target = join(mkdtempSync(join(tmpdir(), "ib-create-")), "app");
    await expect(
      create(target, { local: false, templateDir: fixtureTemplate(), run: succeed, env: {} }),
    ).rejects.toThrow("NODE_AUTH_TOKEN");
    expect(existsSync(target)).toBe(false);
  });

  it("refuses targets inside an ib-toolkit checkout", async () => {
    const root = mkdtempSync(join(tmpdir(), "ib-toolkit-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "ib-toolkit" }));
    mkdirSync(join(root, "scripts"));
    writeFileSync(join(root, "scripts", "pack-local.ts"), "");
    const target = join(root, "apps", "x");
    await expect(
      create(target, { local: false, templateDir: fixtureTemplate(), run: succeed, env }),
    ).rejects.toThrow("ib-toolkit");
    expect(existsSync(target)).toBe(false);
  });

  it("removes a directory it created when a later step fails", async () => {
    const target = join(mkdtempSync(join(tmpdir(), "ib-create-")), "app");
    await expect(
      create(target, { local: false, templateDir: fixtureTemplate(), run: failInstall, env }),
    ).rejects.toThrow("bun install");
    expect(existsSync(target)).toBe(false);
  });

  it("removes only what it wrote from a pre-existing directory", async () => {
    const target = mkdtempSync(join(tmpdir(), "ib-create-"));
    mkdirSync(join(target, ".git"));
    writeFileSync(join(target, "brief.md"), "notes");
    await expect(
      create(target, { local: false, templateDir: fixtureTemplate(), run: failInstall, env }),
    ).rejects.toThrow("bun install");
    expect(readdirSync(target).sort()).toEqual([".git", "brief.md"]);
  });
});

describe("locationStep", () => {
  it("uses a relative path below the working directory", () => {
    expect(locationStep("/work", "/work/apps/new")).toBe("cd apps/new");
  });

  it("uses the absolute path when the target is outside the working directory", () => {
    expect(locationStep("/work/a", "/work/b")).toBe("cd /work/b");
    expect(locationStep("/work/a", "/tmp/x")).toBe("cd /tmp/x");
  });

  it("needs no step when already in the target", () => {
    expect(locationStep("/work", "/work")).toBeNull();
  });
});
