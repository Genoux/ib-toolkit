import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const cli = join(import.meta.dirname, "cli.ts");
const run = (...args: string[]) => spawnSync("bun", [cli, ...args], { encoding: "utf8" });

describe("ib cli", () => {
  it.each(["sync", "check"])("`%s` refuses a folder that is not an inBeat app", (command) => {
    const dir = mkdtempSync(join(tmpdir(), "ib-cli-"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "not-inbeat" }));
    const result = run(command, dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("not an inBeat app");
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(false);
  });

  it("`sync` refuses a folder without a package.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "ib-cli-"));
    expect(run("sync", dir).status).toBe(1);
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(false);
  });

  it("mcp refuses without a terminal and flags", () => {
    const result = run("mcp");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("usage: ib mcp");
  });

  it("prints usage and fails on an unknown command", () => {
    const result = run("add", "clerk");
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain("usage: ib");
  });

  it("prints the mcp usage on `mcp --help`", () => {
    const result = run("mcp", "--help");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("usage: ib mcp [--tools");
  });

  it.each(["create", "sync"])("prints usage and succeeds on `%s --help`", (command) => {
    const result = run(command, "--help");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("usage: ib");
  });

  it("check fails with one message per missing preset", () => {
    const dir = mkdtempSync(join(tmpdir(), "ib-check-"));
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ devDependencies: { "@inbeat/standards": "^0.7.0" } }),
    );
    const result = run("check", dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("biome.json (or biome.jsonc) must extend @inbeat/config/biome");
    expect(result.stderr).toContain("vitest.config.ts must import from @inbeat/config/vitest");
  });

  it("prints usage and succeeds on help", () => {
    const result = run("help");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("usage: ib");
  });
});
