import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyManagedBlock,
  BLOCK_END,
  BLOCK_START,
  claudeFilesIgnoringAgents,
  PACKAGE_ROOT,
  staleFiles,
  write,
} from "./sync";

describe("applyManagedBlock", () => {
  it("creates AGENTS.md with the block and an app section", () => {
    const created = applyManagedBlock(null);
    expect(created).toContain(BLOCK_START);
    expect(created).toContain("## This app");
  });

  it("replaces only the managed block and keeps app facts", () => {
    const existing = `# AGENTS.md\n\n${BLOCK_START} v0.0.1 -->\nold\n${BLOCK_END}\n\n## This app\n- fact\n`;
    const updated = applyManagedBlock(existing);
    expect(updated).not.toContain("\nold\n");
    expect(updated).toContain("## inBeat toolkit standard");
    expect(updated).toContain("## This app\n- fact");
  });

  it("keeps the version out of the block so a release alone never makes apps stale", () => {
    const header = applyManagedBlock(null)
      .split("\n")
      .find((line) => line.startsWith(BLOCK_START));
    expect(header).not.toMatch(/v\d+\.\d+\.\d+/);
  });

  it("prepends the block when markers are missing", () => {
    expect(applyManagedBlock("# mine\n").endsWith("# mine\n")).toBe(true);
  });
});

describe("write / staleFiles", () => {
  const skillPath = (name: string) => join(".agents", "skills", name, "SKILL.md");

  it("syncs everything, then reports clean, then detects drift", () => {
    const dir = mkdtempSync(join(tmpdir(), "ib-std-"));
    expect(staleFiles(dir).length).toBeGreaterThan(0);
    write(dir);
    expect(staleFiles(dir)).toEqual([]);

    writeFileSync(join(dir, skillPath("ib-ui")), "edited");
    expect(staleFiles(dir)).toEqual([skillPath("ib-ui")]);
  });

  it("writes skills only under .agents/skills", () => {
    const dir = mkdtempSync(join(tmpdir(), "ib-std-"));
    write(dir);
    expect(readdirSync(dir).sort()).toEqual([".agents", "AGENTS.md"]);
    expect(readdirSync(join(dir, ".agents", "skills")).sort()).toEqual([
      "ib-feature",
      "ib-toolkit",
      "ib-ui",
    ]);
  });

  describe("legacy files", () => {
    const legacyPaths = [
      ...["ib-ui", "ib-feature", "ib-toolkit"].flatMap((name) => [
        join(".claude", "skills", name, "SKILL.md"),
        join(".cursor", "skills", name, "SKILL.md"),
        join(".cursor", "rules", `${name}.mdc`),
      ]),
    ];

    function legacyApp(extra: Record<string, string> = {}): string {
      const dir = mkdtempSync(join(tmpdir(), "ib-legacy-"));
      write(dir);
      for (const path of [...legacyPaths, ...Object.keys(extra)]) {
        mkdirSync(join(dir, path, ".."), { recursive: true });
        writeFileSync(join(dir, path), extra[path] ?? "old");
      }
      return dir;
    }

    it("reports them as stale", () => {
      expect(staleFiles(legacyApp()).sort()).toEqual([...legacyPaths].sort());
    });

    it("removes exactly them and the directories they leave empty", () => {
      const dir = legacyApp();
      expect(write(dir).sort()).toEqual([...legacyPaths].sort());
      expect(staleFiles(dir)).toEqual([]);
      expect(existsSync(join(dir, ".claude"))).toBe(false);
      expect(existsSync(join(dir, ".cursor"))).toBe(false);
    });

    it("keeps user files and the directories that hold them", () => {
      const mine = {
        [join(".claude", "skills", "mine", "SKILL.md")]: "mine",
        [join(".cursor", "rules", "mine.mdc")]: "mine",
        [join(".claude", "CLAUDE.md")]: "@AGENTS.md",
      };
      const dir = legacyApp(mine);
      write(dir);
      for (const path of Object.keys(mine)) expect(existsSync(join(dir, path))).toBe(true);
      expect(existsSync(join(dir, ".claude", "skills", "ib-ui"))).toBe(false);
      expect(existsSync(join(dir, ".cursor", "skills"))).toBe(false);
    });
  });
});

describe("claudeFilesIgnoringAgents", () => {
  function app(files: Record<string, string>): string {
    const dir = mkdtempSync(join(tmpdir(), "ib-claude-"));
    for (const [path, contents] of Object.entries(files)) {
      mkdirSync(join(dir, path, ".."), { recursive: true });
      writeFileSync(join(dir, path), contents);
    }
    return dir;
  }

  it("is empty without CLAUDE files", () => {
    expect(claudeFilesIgnoringAgents(app({ "AGENTS.md": "x" }))).toEqual([]);
  });

  it("accepts CLAUDE files that import AGENTS.md", () => {
    const dir = app({ "CLAUDE.md": "# Claude\n@AGENTS.md\n", ".claude/CLAUDE.md": "@AGENTS.md" });
    expect(claudeFilesIgnoringAgents(dir)).toEqual([]);
  });

  it("lists every CLAUDE file that lacks the import", () => {
    const dir = app({
      "CLAUDE.md": "see AGENTS.md",
      ".claude/CLAUDE.md": "@AGENTS.md",
      "CLAUDE.local.md": "mine",
    });
    expect(claudeFilesIgnoringAgents(dir)).toEqual(["CLAUDE.md", "CLAUDE.local.md"]);
  });
});

describe("standard guide pointers", () => {
  it("points only at skills the package ships", () => {
    const standard = readFileSync(join(PACKAGE_ROOT, "agents", "standard.md"), "utf8");
    const referenced = [...standard.matchAll(/\.agents\/skills\/([\w-]+)\/SKILL\.md/g)].map(
      ([, name]) => name,
    );
    expect(referenced.length).toBeGreaterThan(0);
    for (const name of referenced) {
      expect(existsSync(join(PACKAGE_ROOT, "skills", name, "SKILL.md"))).toBe(true);
    }
  });
});
