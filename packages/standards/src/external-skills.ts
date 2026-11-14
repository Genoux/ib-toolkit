import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { PACKAGE_ROOT } from "./sync";

// Third-party skills every app gets, downloaded fresh on each `ib sync` and
// never committed. The files go in .agents/skills/, which Codex, Cursor,
// Gemini CLI, Copilot and OpenCode read; Claude Code reads only
// .claude/skills/, so each skill is linked there too (copied where links fail).

export const EXTERNAL_SKILLS_LIST = join(PACKAGE_ROOT, "external-skills.txt");
export const SKILLS_DIR = join(".agents", "skills");
export const CLAUDE_SKILLS_DIR = join(".claude", "skills");
// Present in every folder this installer wrote; a folder without it is the app's own.
export const MARKER = ".toolkit-source";
const CLAUDE_IGNORE_HEADER = "# Written by ib sync: links to the shared skills in .agents/skills.";

export type ExternalSkill = { repo: string; path: string; name?: string };

export type InstallReport = {
  installed: string[];
  removed: string[];
  /** Folders kept because the app owns a skill with that name. */
  kept: string[];
  /** Repos or entries that could not be fetched, with the reason. */
  failed: string[];
};

export function parseList(text: string): ExternalSkill[] {
  return text
    .split("\n")
    .map((line) => line.replace(/#.*/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const [repo, path, name] = line.split(/\s+/);
      if (!repo || !path || (path === "." && !name)) {
        throw new Error(
          `external-skills.txt: expected "<owner/repo> <folder> [name]", got "${line}"`,
        );
      }
      return { repo, path, name };
    });
}

function repoUrl(repo: string): string {
  return repo.includes(":") || repo.startsWith("/") ? repo : `https://github.com/${repo}.git`;
}

function git(args: string[]): { ok: boolean; out: string } {
  // An empty askpass answer makes a private or missing repo fail instead of prompting.
  const result = spawnSync("git", ["-c", "core.askPass=true", ...args], { encoding: "utf8" });
  return { ok: result.status === 0, out: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim() };
}

function sparseDir(path: string): string {
  if (path.endsWith("/*")) return path.slice(0, -2);
  if (path.endsWith(".md")) return dirname(path);
  return path;
}

type Source = { name: string; from: string; file: boolean };

function sources(checkout: string, entry: ExternalSkill): Source[] {
  const at = join(checkout, entry.path === "." ? "" : entry.path);
  if (entry.path.endsWith("/*")) {
    const dir = join(checkout, sparseDir(entry.path));
    return readdirSync(dir)
      .filter((child) => existsSync(join(dir, child, "SKILL.md")))
      .map((child) => ({ name: child, from: join(dir, child), file: false }));
  }
  if (entry.path.endsWith(".md")) {
    return [{ name: entry.name ?? basename(entry.path, ".md"), from: at, file: true }];
  }
  return [{ name: entry.name ?? basename(entry.path), from: at, file: false }];
}

/** What sits at a skill path: nothing, something this installer wrote, or the app's own. */
function ownerOf(path: string): "none" | "ours" | "app" {
  try {
    const stat = lstatSync(path);
    return stat.isSymbolicLink() || existsSync(join(path, MARKER)) ? "ours" : "app";
  } catch {
    return "none";
  }
}

function place(skillsDir: string, source: Source, provenance: string): "installed" | "kept" {
  const dest = join(skillsDir, source.name);
  if (ownerOf(dest) === "app") return "kept";
  rmSync(dest, { recursive: true, force: true });
  if (source.file) {
    mkdirSync(dest, { recursive: true });
    cpSync(source.from, join(dest, "SKILL.md"));
  } else {
    cpSync(source.from, dest, {
      recursive: true,
      filter: (path) => !/^\.git(hub)?$/.test(relative(source.from, path).split(sep)[0] ?? ""),
    });
  }
  writeFileSync(join(dest, ".gitignore"), "*\n");
  writeFileSync(join(dest, MARKER), `${provenance}\n`);
  return "installed";
}

/** Points .claude/skills/<name> at .agents/skills/<name>; false when the app owns that name. */
function linkForClaude(appDir: string, name: string): boolean {
  const target = join(appDir, SKILLS_DIR, name);
  const link = join(appDir, CLAUDE_SKILLS_DIR, name);
  if (ownerOf(link) === "app") return false;
  rmSync(link, { recursive: true, force: true });
  mkdirSync(dirname(link), { recursive: true });
  try {
    // A junction needs no admin rights on Windows and wants an absolute target;
    // elsewhere a relative link keeps working when the app folder moves.
    if (process.platform === "win32") symlinkSync(resolve(target), link, "junction");
    else symlinkSync(relative(dirname(link), target), link);
  } catch {
    cpSync(target, link, { recursive: true });
  }
  return true;
}

/** Keeps the Claude links out of git; leaves a .gitignore the app wrote alone. */
function ignoreClaudeLinks(appDir: string, names: string[]): void {
  const path = join(appDir, CLAUDE_SKILLS_DIR, ".gitignore");
  if (existsSync(path) && !readFileSync(path, "utf8").startsWith(CLAUDE_IGNORE_HEADER)) return;
  if (names.length === 0) {
    rmSync(path, { force: true });
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, [CLAUDE_IGNORE_HEADER, ".gitignore", ...[...names].sort()].join("\n") + "\n");
}

export function installExternalSkills(
  appDir: string,
  listPath: string = EXTERNAL_SKILLS_LIST,
): InstallReport {
  const report: InstallReport = { installed: [], removed: [], kept: [], failed: [] };
  const skillsDir = join(appDir, SKILLS_DIR);
  const byRepo = new Map<string, ExternalSkill[]>();
  for (const entry of parseList(readFileSync(listPath, "utf8"))) {
    byRepo.set(entry.repo, [...(byRepo.get(entry.repo) ?? []), entry]);
  }

  for (const [repo, entries] of byRepo) {
    const tmp = mkdtempSync(join(tmpdir(), "ib-skills-"));
    try {
      const checkout = join(tmp, "repo");
      const whole = entries.some((entry) => entry.path === ".");
      const clone = git([
        "clone",
        "--quiet",
        "--depth=1",
        "--filter=blob:none",
        ...(whole ? [] : ["--sparse"]),
        repoUrl(repo),
        checkout,
      ]);
      if (!clone.ok) {
        report.failed.push(`${repo}: ${clone.out.split("\n").pop()}`);
        continue;
      }
      if (!whole) {
        const dirs = [...new Set(entries.map((entry) => sparseDir(entry.path)))];
        const sparse = git(["-C", checkout, "sparse-checkout", "set", ...dirs]);
        if (!sparse.ok) {
          report.failed.push(`${repo}: ${sparse.out.split("\n").pop()}`);
          continue;
        }
      }
      const commit = git(["-C", checkout, "rev-parse", "--short", "HEAD"]).out;
      for (const entry of entries) {
        let found: Source[];
        try {
          found = sources(checkout, entry).filter(
            (source) =>
              existsSync(source.from) && (source.file || existsSync(join(source.from, "SKILL.md"))),
          );
        } catch {
          found = [];
        }
        if (found.length === 0) {
          report.failed.push(`${repo}: no skill at ${entry.path}`);
          continue;
        }
        mkdirSync(skillsDir, { recursive: true });
        for (const source of found) {
          const outcome = place(skillsDir, source, `${repo} ${entry.path} ${commit}`);
          report[outcome].push(source.name);
        }
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }

  // Drop skills that left the list, but only after a complete download, so a
  // network failure never deletes anything.
  if (report.failed.length === 0) {
    for (const dir of [SKILLS_DIR, CLAUDE_SKILLS_DIR]) {
      const at = join(appDir, dir);
      if (!existsSync(at)) continue;
      for (const name of readdirSync(at)) {
        if (ownerOf(join(at, name)) !== "ours" || report.installed.includes(name)) continue;
        rmSync(join(at, name), { recursive: true, force: true });
        if (!report.removed.includes(name)) report.removed.push(name);
      }
    }
  }

  const linked = report.installed.filter((name) => linkForClaude(appDir, name));
  report.kept.push(...report.installed.filter((name) => !linked.includes(name)));
  ignoreClaudeLinks(appDir, linked);
  return report;
}

export function formatReport(report: InstallReport): string[] {
  const lines: string[] = [];
  if (report.installed.length) {
    lines.push(
      `skills (${SKILLS_DIR}, linked in ${CLAUDE_SKILLS_DIR}): ${report.installed.join(", ")}`,
    );
  }
  if (report.removed.length)
    lines.push(`removed skills no longer listed: ${report.removed.join(", ")}`);
  if (report.kept.length) {
    lines.push(`kept your own skills with the same name: ${report.kept.join(", ")}`);
  }
  return lines;
}
