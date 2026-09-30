import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyManagedBlock,
  BLOCK_END,
  BLOCK_START,
  claudeFilesIgnoringAgents,
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
  it("syncs everything, then reports clean, then detects drift", () => {
    const dir = mkdtempSync(join(tmpdir(), "ib-std-"));
    expect(staleFiles(dir).length).toBeGreaterThan(0);
    write(dir);
    expect(staleFiles(dir)).toEqual([]);
    expect(readFileSync(join(dir, ".cursor/rules/ib-ui.mdc"), "utf8")).toContain(
      "alwaysApply: false",
    );

    writeFileSync(join(dir, ".cursor/skills/ib-ui/SKILL.md"), "edited");
    expect(staleFiles(dir)).toEqual([join(".cursor", "skills", "ib-ui", "SKILL.md")]);
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
