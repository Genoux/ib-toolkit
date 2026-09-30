import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const cli = join(import.meta.dirname, "cli.ts");
const run = (...args: string[]) => spawnSync("bun", [cli, ...args], { encoding: "utf8" });

describe("ib cli", () => {
  it("prints usage and fails on an unknown command", () => {
    const result = run("add", "clerk");
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain("usage: ib");
  });

  it("prints usage and succeeds on help", () => {
    const result = run("help");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("usage: ib");
  });
});
