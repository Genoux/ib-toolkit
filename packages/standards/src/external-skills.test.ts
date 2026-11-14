import { spawnSync } from "node:child_process";
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
  CLAUDE_SKILLS_DIR,
  EXTERNAL_SKILLS_LIST,
  installExternalSkills,
  MARKER,
  parseList,
  SKILLS_DIR,
} from "./external-skills";

function git(cwd: string, ...args: string[]): void {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "t",
      GIT_AUTHOR_EMAIL: "t@localhost",
      GIT_COMMITTER_NAME: "t",
      GIT_COMMITTER_EMAIL: "t@localhost",
    },
  });
  if (result.status !== 0) throw new Error(result.stderr);
}

/** A local repo standing in for GitHub, with files at the given paths. */
function upstream(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "ib-upstream-"));
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), contents);
  }
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "init");
  return `file://${dir}`;
}

function list(lines: string[]): string {
  const path = join(mkdtempSync(join(tmpdir(), "ib-list-")), "external-skills.txt");
  writeFileSync(path, `# comment\n\n${lines.join("\n")}\n`);
  return path;
}

const skill = (name: string) => `---\nname: ${name}\ndescription: d\n---\n`;

describe("parseList", () => {
  it("reads the shipped list", () => {
    const entries = parseList(readFileSync(EXTERNAL_SKILLS_LIST, "utf8"));
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.find((entry) => entry.path === ".")?.name).toBe("task-observer");
  });

  it("refuses a whole-repo entry without a name", () => {
    expect(() => parseList("a/b .")).toThrow(/expected/);
  });
});

describe("installExternalSkills", () => {
  const repo = upstream({
    "skills/one/SKILL.md": skill("one"),
    "skills/one/references/r.md": "ref",
    "skills/two/SKILL.md": skill("two"),
    "skills/notes.md": "not a skill",
    "agents/helper.md": skill("helper"),
    ".github/workflows/ci.yml": "x",
    "SKILL.md": skill("whole"),
  });

  it("installs folders, globs, single files and whole repos under .claude/skills", () => {
    const app = mkdtempSync(join(tmpdir(), "ib-app-"));
    const report = installExternalSkills(
      app,
      list([`${repo} skills/*`, `${repo} agents/helper.md`, `${repo} . whole`]),
    );
    expect(report.failed).toEqual([]);
    expect(report.installed.sort()).toEqual(["helper", "one", "two", "whole"]);
    const dir = join(app, SKILLS_DIR);
    expect(readFileSync(join(dir, "one", "references", "r.md"), "utf8")).toBe("ref");
    expect(readFileSync(join(dir, "helper", "SKILL.md"), "utf8")).toBe(skill("helper"));
    expect(existsSync(join(dir, "whole", ".git"))).toBe(false);
    expect(existsSync(join(dir, "whole", ".github"))).toBe(false);
    for (const name of report.installed) {
      expect(readFileSync(join(dir, name, ".gitignore"), "utf8")).toBe("*\n");
      expect(readFileSync(join(dir, name, MARKER), "utf8")).toContain(repo);
    }
  });

  it("links every skill for Claude Code and leaves git nothing to commit", () => {
    const app = mkdtempSync(join(tmpdir(), "ib-app-"));
    git(app, "init", "-q");
    const report = installExternalSkills(app, list([`${repo} skills/*`]));
    for (const name of report.installed) {
      expect(readFileSync(join(app, CLAUDE_SKILLS_DIR, name, "SKILL.md"), "utf8")).toBe(
        skill(name),
      );
    }
    const status = spawnSync("git", ["status", "--porcelain", "--untracked-files=all"], {
      cwd: app,
      encoding: "utf8",
    });
    expect(status.stdout).toBe("");
  });

  it("keeps the app's own Claude skill and still installs the shared one", () => {
    const app = mkdtempSync(join(tmpdir(), "ib-app-"));
    mkdirSync(join(app, CLAUDE_SKILLS_DIR, "one"), { recursive: true });
    writeFileSync(join(app, CLAUDE_SKILLS_DIR, "one", "SKILL.md"), "mine");
    const report = installExternalSkills(app, list([`${repo} skills/one`]));
    expect(report.kept).toEqual(["one"]);
    expect(readFileSync(join(app, CLAUDE_SKILLS_DIR, "one", "SKILL.md"), "utf8")).toBe("mine");
    expect(existsSync(join(app, SKILLS_DIR, "one", MARKER))).toBe(true);
  });

  it("keeps the app's own skill with the same name", () => {
    const app = mkdtempSync(join(tmpdir(), "ib-app-"));
    mkdirSync(join(app, SKILLS_DIR, "one"), { recursive: true });
    writeFileSync(join(app, SKILLS_DIR, "one", "SKILL.md"), "mine");
    const report = installExternalSkills(app, list([`${repo} skills/one`]));
    expect(report.kept).toEqual(["one"]);
    expect(readFileSync(join(app, SKILLS_DIR, "one", "SKILL.md"), "utf8")).toBe("mine");
  });

  it("removes skills that left the list and leaves the app's own", () => {
    const app = mkdtempSync(join(tmpdir(), "ib-app-"));
    installExternalSkills(app, list([`${repo} skills/*`]));
    mkdirSync(join(app, SKILLS_DIR, "mine"));
    const report = installExternalSkills(app, list([`${repo} skills/one`]));
    expect(report.removed).toEqual(["two"]);
    expect(readdirSync(join(app, SKILLS_DIR)).sort()).toEqual(["mine", "one"]);
    expect(readdirSync(join(app, CLAUDE_SKILLS_DIR)).sort()).toEqual([".gitignore", "one"]);
  });

  it("reports a failed download and deletes nothing", () => {
    const app = mkdtempSync(join(tmpdir(), "ib-app-"));
    installExternalSkills(app, list([`${repo} skills/*`]));
    const missing = `file://${join(tmpdir(), "ib-no-such-repo")}`;
    const report = installExternalSkills(app, list([`${missing} skills/one`]));
    expect(report.failed).toHaveLength(1);
    expect(report.removed).toEqual([]);
    expect(readdirSync(join(app, SKILLS_DIR)).sort()).toEqual(["one", "two"]);
  });

  it("reports a listed folder that holds no skill", () => {
    const app = mkdtempSync(join(tmpdir(), "ib-app-"));
    const report = installExternalSkills(app, list([`${repo} skills/missing`]));
    expect(report.failed).toEqual([`${repo}: no skill at skills/missing`]);
  });
});
