import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { PassThrough, Writable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyServers, configuredServers, parseMcpArgs, runMcp } from "./mcp";
import { CURATED_SERVERS } from "./mcp-servers";

const vercel = CURATED_SERVERS.vercel;
const github = CURATED_SERVERS.github;

const apply = (tool: string, text: string | null, names: string[]) =>
  applyServers(tool, text, names).text;
const JSON_REFUSAL = "contains comments or is not a JSON object; edit it by hand";

describe("applyServers json formats", () => {
  it.each([
    ["claude", { mcpServers: { vercel: { type: "http", url: vercel } } }],
    ["cursor", { mcpServers: { vercel: { url: vercel } } }],
    ["vscode", { servers: { vercel: { type: "http", url: vercel } } }],
    ["gemini", { mcpServers: { vercel: { httpUrl: vercel } } }],
  ] as const)("writes the %s shape", (tool, expected) => {
    expect(JSON.parse(apply(tool, null, ["vercel"]))).toEqual(expected);
  });

  it("keeps user entries and other keys, removes deselected curated entries", () => {
    const existing = JSON.stringify({
      theme: "dark",
      mcpServers: {
        mine: { type: "http", url: "https://mine.test" },
        github: { type: "http", url: github },
      },
    });
    const result = JSON.parse(apply("claude", existing, ["vercel"]));
    expect(result).toEqual({
      theme: "dark",
      mcpServers: {
        mine: { type: "http", url: "https://mine.test" },
        vercel: { type: "http", url: vercel },
      },
    });
  });

  it("updates a stale curated url", () => {
    const existing = JSON.stringify({ mcpServers: { vercel: { type: "http", url: "old" } } });
    const result = JSON.parse(apply("claude", existing, ["vercel"]));
    expect(result.mcpServers.vercel.url).toBe(vercel);
  });

  it("rejects invalid json instead of overwriting it", () => {
    expect(() => apply("claude", "{nope", ["vercel"])).toThrow(JSON_REFUSAL);
  });

  it.each([
    ["comments", '{\n  // mine\n  "mcpServers": {}\n}'],
    ["trailing comma", '{"mcpServers": {},}'],
    ["null top level", "null"],
    ["array top level", "[]"],
    ["null servers", '{"mcpServers": null}'],
    ["array servers", '{"mcpServers": []}'],
  ])("refuses json with %s", (_label, text) => {
    expect(() => apply("claude", text, ["vercel"])).toThrow(JSON_REFUSAL);
  });

  it("keeps the BOM and the line endings", () => {
    const result = apply("claude", "\uFEFF{\r\n}\r\n", ["vercel"]);
    expect(result.startsWith("\uFEFF{")).toBe(true);
    expect(JSON.parse(result.slice(1)).mcpServers.vercel.url).toBe(vercel);
    expect(/(?<!\r)\n/.test(result)).toBe(false);
  });

  it("only manages connection fields and keeps the rest on rerun", () => {
    const existing = JSON.stringify({
      mcpServers: {
        github: {
          type: "sse",
          url: "old",
          headers: { Authorization: "Bearer x" },
          env: { A: "1" },
        },
      },
    });
    const { text } = applyServers("claude", existing, ["github"]);
    expect(JSON.parse(text).mcpServers.github).toEqual({
      type: "http",
      url: github,
      headers: { Authorization: "Bearer x" },
      env: { A: "1" },
    });
  });

  it("keeps a deselected entry with custom settings and says so", () => {
    const existing = JSON.stringify({
      mcpServers: { github: { type: "http", url: github, headers: { A: "1" } } },
    });
    const { text, notes } = applyServers("claude", existing, []);
    expect(JSON.parse(text).mcpServers.github.headers).toEqual({ A: "1" });
    expect(notes.join("\n")).toMatch(/github.*custom settings.*kept/);
  });
});

describe("applyServers codex toml", () => {
  it("writes curated tables", () => {
    expect(apply("codex", null, ["vercel"])).toBe(`[mcp_servers.vercel]\nurl = "${vercel}"\n`);
  });

  it("preserves everything else byte-for-byte and is idempotent", () => {
    const existing = `# mine\nmodel = "gpt-5"\n\n[mcp_servers.mine]\ncommand = "x"\n\n[profiles.a]\nk = 1\n`;
    const once = apply("codex", existing, ["vercel"]);
    expect(once.startsWith(existing)).toBe(true);
    expect(once).toContain(`[mcp_servers.vercel]\nurl = "${vercel}"`);
    expect(apply("codex", once, ["vercel"])).toBe(once);
  });

  it("removes deselected tables holding only the url, keeps the rest", () => {
    const existing = [
      `[mcp_servers.github]`,
      `url = "${github}"`,
      ``,
      `[mcp_servers.mine]`,
      `command = "x"`,
      ``,
    ].join("\n");
    const result = apply("codex", existing, []);
    expect(result).toBe(`[mcp_servers.mine]\ncommand = "x"\n`);
  });

  it("refuses a curated server written with dotted keys", () => {
    expect(() => apply("codex", `mcp_servers.vercel.url = "a"\n`, ["vercel"])).toThrow(
      /vercel is defined inline\/dotted; edit it by hand or convert to a \[mcp_servers\.vercel\] table/,
    );
  });

  it("refuses a curated server written as an inline table", () => {
    const text = `[mcp_servers]\nvercel = { url = "a" }\n`;
    expect(() => apply("codex", text, ["vercel"])).toThrow(/vercel is defined inline\/dotted/);
    expect(() => apply("codex", text, [])).toThrow(/vercel is defined inline\/dotted/);
  });

  it("refuses invalid toml", () => {
    expect(() => apply("codex", "url = ", ["vercel"])).toThrow(/not valid TOML/);
  });

  it("ignores header-looking lines inside multi-line strings", () => {
    const existing = `note = """\n[mcp_servers.vercel]\nurl = "x"\n"""\n`;
    const result = apply("codex", existing, ["vercel"]);
    expect(result.startsWith(existing)).toBe(true);
    expect(Bun.TOML.parse(result)).toEqual({
      ...Bun.TOML.parse(existing),
      mcp_servers: { vercel: { url: vercel } },
    });
    expect(configuredServers("codex", existing)).toEqual([]);
  });

  it("updates only the url and keeps custom fields and subtables on rerun", () => {
    const existing = [
      `[mcp_servers.github]`,
      `url = "old"`,
      `bearer_token_env_var = "GH"`,
      ``,
      `[mcp_servers.github.http_headers]`,
      `X = "1"`,
      ``,
    ].join("\n");
    const result = apply("codex", existing, ["github"]);
    expect(result).toBe(existing.replace('"old"', `"${github}"`));
    expect(apply("codex", result, ["github"])).toBe(result);
  });

  it("keeps a deselected table with custom settings and says so", () => {
    const existing = `[mcp_servers.github]\nurl = "${github}"\nbearer_token_env_var = "GH"\n`;
    const { text, notes } = applyServers("codex", existing, []);
    expect(text).toBe(existing);
    expect(notes.join("\n")).toMatch(/github.*custom settings.*kept/);
  });

  it("keeps a deselected table that has a subtable", () => {
    const existing = `[mcp_servers.github]\nurl = "${github}"\n[mcp_servers.github.http_headers]\nX = "1"\n`;
    expect(apply("codex", existing, [])).toBe(existing);
  });

  it("does not swallow the comment above the next table when removing", () => {
    const existing = `[mcp_servers.github]\nurl = "${github}"\n# mine\n[mcp_servers.mine]\ncommand = "x"\n`;
    expect(apply("codex", existing, [])).toBe(`# mine\n[mcp_servers.mine]\ncommand = "x"\n`);
  });

  it("emits CRLF for inserted lines", () => {
    const added = apply("codex", `model = "x"\r\n`, ["vercel"]);
    expect(added).toBe(`model = "x"\r\n\r\n[mcp_servers.vercel]\r\nurl = "${vercel}"\r\n`);
    const updated = apply("codex", `[mcp_servers.vercel]\r\nurl = "old"\r\n`, ["vercel"]);
    expect(updated).toBe(`[mcp_servers.vercel]\r\nurl = "${vercel}"\r\n`);
  });
});

describe("configuredServers", () => {
  it("lists curated names only", () => {
    const json = JSON.stringify({ mcpServers: { vercel: {}, mine: {} } });
    expect(configuredServers("claude", json)).toEqual(["vercel"]);
    expect(
      configuredServers("codex", `[mcp_servers.github]\nurl = "x"\n[mcp_servers.mine]\n`),
    ).toEqual(["github"]);
    expect(configuredServers("claude", null)).toEqual([]);
  });

  it("sees dotted and inline toml definitions", () => {
    expect(configuredServers("codex", `mcp_servers.vercel.url = "a"\n`)).toEqual(["vercel"]);
    expect(configuredServers("codex", `[mcp_servers]\ngithub = { url = "a" }\n`)).toEqual([
      "github",
    ]);
  });
});

describe("parseMcpArgs", () => {
  it("accepts space and equals forms", () => {
    expect(parseMcpArgs(["--tools", "claude,cursor", "--servers=vercel,github"])).toEqual({
      tools: ["claude", "cursor"],
      servers: ["vercel", "github"],
    });
  });

  it("leaves missing flags undefined", () => {
    expect(parseMcpArgs([])).toEqual({ tools: undefined, servers: undefined });
  });

  it("rejects unknown options", () => {
    expect(() => parseMcpArgs(["--wat"])).toThrow("unknown option --wat");
  });

  it.each([["--servers="], ["--tools="], ["--tools", ""], ["--servers", " , "]])(
    "rejects empty values %j",
    (...args) => {
      expect(() => parseMcpArgs(args)).toThrow(/needs at least one value/);
    },
  );
});

describe("runMcp", () => {
  let cwd: string;
  let stdout: string;
  let stderr: string;

  const runWith = (args: string[], stdin: PassThrough, isTTY: boolean) => {
    stdout = "";
    stderr = "";
    return runMcp(args, {
      cwd,
      stdin,
      output: new Writable({ write: (_chunk, _encoding, done) => done() }),
      isTTY,
      out: (text) => {
        stdout += `${text}\n`;
      },
      err: (text) => {
        stderr += `${text}\n`;
      },
    });
  };

  const run = (args: string[], input = "", isTTY = false) => {
    const stdin = new PassThrough();
    stdin.end(input);
    return runWith(args, stdin, isTTY);
  };

  const write = (file: string, text: string) => {
    mkdirSync(join(cwd, file, ".."), { recursive: true });
    writeFileSync(join(cwd, file), text);
  };
  const read = (file: string) => readFileSync(join(cwd, file), "utf8");

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), "ib-mcp-"));
    writeFileSync(join(cwd, "package.json"), "{}");
  });
  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  it("refuses outside an app directory", async () => {
    rmSync(join(cwd, "package.json"));
    expect(await run(["--tools", "claude", "--servers", "vercel"])).toBe(1);
    expect(stderr).toContain("package.json");
  });

  it("prints usage without a tty and without both flags", async () => {
    expect(await run(["--tools", "claude"])).toBe(1);
    expect(stderr).toContain("usage: ib mcp");
  });

  it("lists valid names for unknown tools and servers and writes nothing", async () => {
    expect(await run(["--tools", "emacs", "--servers", "vercel"])).toBe(1);
    expect(stderr).toContain("unknown tool emacs; valid: claude");
    expect(await run(["--tools", "claude", "--servers", "nope"])).toBe(1);
    expect(stderr).toContain("unknown server nope; valid: vercel");
    expect(() => readFileSync(join(cwd, ".mcp.json"))).toThrow();
  });

  it("writes every selected tool file and reports them", async () => {
    expect(await run(["--tools", "claude,codex", "--servers", "vercel,github"])).toBe(0);
    const claude = JSON.parse(readFileSync(join(cwd, ".mcp.json"), "utf8"));
    expect(Object.keys(claude.mcpServers)).toEqual(["vercel", "github"]);
    expect(readFileSync(join(cwd, ".codex", "config.toml"), "utf8")).toContain(
      "[mcp_servers.github]",
    );
    expect(stdout).toContain(".mcp.json");
    expect(stdout).toContain("authenticate");
  });

  it("selection is the truth for curated names across reruns", async () => {
    await run(["--tools", "claude", "--servers", "vercel,github"]);
    const path = join(cwd, ".mcp.json");
    const edited = JSON.parse(readFileSync(path, "utf8"));
    edited.mcpServers.mine = { type: "http", url: "https://mine.test" };
    writeFileSync(path, JSON.stringify(edited));
    await run(["--tools", "claude", "--servers", "vercel"]);
    expect(Object.keys(JSON.parse(readFileSync(path, "utf8")).mcpServers).sort()).toEqual([
      "mine",
      "vercel",
    ]);
  });

  it("refuses a json file with comments, names the file and writes nothing", async () => {
    const original = '{\n  // mine\n  "servers": {}\n}\n';
    write(".vscode/mcp.json", original);
    expect(await run(["--tools", "vscode", "--servers", "vercel"])).toBe(1);
    expect(stderr).toContain(`.vscode${sep}mcp.json: ${JSON_REFUSAL}`);
    expect(stderr).not.toContain("usage:");
    expect(read(".vscode/mcp.json")).toBe(original);
  });

  it("writes nothing when any selected file fails", async () => {
    write(".vscode/mcp.json", "{ // nope\n}");
    expect(await run(["--tools", "claude,vscode", "--servers", "vercel"])).toBe(1);
    expect(existsSync(join(cwd, ".mcp.json"))).toBe(false);
  });

  it("ignores broken files of tools that were not selected", async () => {
    write(".vscode/mcp.json", "{ // nope\n}");
    write(".codex/config.toml", "url = ");
    expect(await run(["--tools", "claude", "--servers", "vercel"])).toBe(0);
    expect(read(".mcp.json")).toContain(vercel);
  });

  it("refuses a dotted codex server untouched and reports the server", async () => {
    const original = `mcp_servers.vercel.url = "a"\n`;
    write(".codex/config.toml", original);
    expect(await run(["--tools", "codex", "--servers", "vercel"])).toBe(1);
    expect(stderr).toContain(`.codex${sep}config.toml: vercel is defined inline/dotted`);
    expect(read(".codex/config.toml")).toBe(original);
  });

  it("keeps custom codex settings and notes the kept server on deselect", async () => {
    const original = `[mcp_servers.github]\nurl = "${github}"\nbearer_token_env_var = "GH"\n`;
    write(".codex/config.toml", original);
    expect(await run(["--tools", "codex", "--servers", "vercel"])).toBe(0);
    expect(read(".codex/config.toml")).toBe(
      `${original}\n[mcp_servers.vercel]\nurl = "${vercel}"\n`,
    );
    expect(stdout).toMatch(/github.*custom settings.*kept/);
  });

  it("prints usage only for argument errors", async () => {
    expect(await run(["--tools", "emacs", "--servers", "vercel"])).toBe(1);
    expect(stderr).toContain("usage: ib mcp");
    expect(await run(["--tools=", "--servers", "vercel"])).toBe(1);
    expect(stderr).toContain("usage: ib mcp");
  });

  it("leaves no temp files behind", async () => {
    await run(["--tools", "claude,codex", "--servers", "vercel"]);
    expect(
      [...readdirSync(cwd), ...readdirSync(join(cwd, ".codex"))].filter((name) =>
        name.includes(".tmp"),
      ),
    ).toEqual([]);
  });

  it("prints the mcp usage for --help and -h", async () => {
    for (const flag of ["--help", "-h"]) {
      expect(await run([flag])).toBe(0);
      expect(stdout).toContain("usage: ib mcp");
    }
  });

  it("aborts with 130 and writes nothing on Ctrl-C", async () => {
    const stdin = new PassThrough();
    const result = runWith([], stdin, true);
    stdin.write("claude\n");
    await new Promise((resolve) => setTimeout(resolve, 20));
    stdin.write("\x03");
    expect(await result).toBe(130);
    expect(existsSync(join(cwd, ".mcp.json"))).toBe(false);
  });

  it("re-prompts once with the valid choices on invalid input", async () => {
    expect(await run([], "emacs\nclaude\nvercel\n", true)).toBe(0);
    expect(stderr).toContain("unknown tool emacs; valid: claude");
    expect(read(".mcp.json")).toContain(vercel);
  });

  it.each(["0x1", "0", "9", "1.0"])("rejects %s as an index after the retry", async (token) => {
    expect(await run([], `${token}\n${token}\n`, true)).toBe(1);
    expect(existsSync(join(cwd, ".mcp.json"))).toBe(false);
  });

  it("says Enter keeps none when nothing is configured", async () => {
    await run([], "\n\n", true);
    expect(stdout).toContain("Enter keeps: none");
  });

  it("prompts even when a tool file is unparseable", async () => {
    write(".cursor/mcp.json", "{ // nope\n}");
    write(".codex/config.toml", "url = ");
    expect(await run([], "claude\nvercel\n", true)).toBe(0);
    expect(read(".mcp.json")).toContain(vercel);
  });

  it("prompts for tools then servers in a tty", async () => {
    expect(await run([], "1,2\nvercel\n", true)).toBe(0);
    expect(
      JSON.parse(readFileSync(join(cwd, ".mcp.json"), "utf8")).mcpServers.vercel,
    ).toBeDefined();
    expect(
      JSON.parse(readFileSync(join(cwd, ".cursor", "mcp.json"), "utf8")).mcpServers.vercel,
    ).toBeDefined();
  });

  it("preselects what is already configured when the answer is empty", async () => {
    mkdirSync(join(cwd, ".cursor"));
    writeFileSync(
      join(cwd, ".cursor", "mcp.json"),
      JSON.stringify({ mcpServers: { sentry: { url: CURATED_SERVERS.sentry } } }),
    );
    expect(await run([], "\n\n", true)).toBe(0);
    const cursor = JSON.parse(readFileSync(join(cwd, ".cursor", "mcp.json"), "utf8"));
    expect(Object.keys(cursor.mcpServers)).toEqual(["sentry"]);
  });

  it("aborts with 130 and writes nothing on EOF", async () => {
    expect(await run([], "claude\n", true)).toBe(130);
    expect(() => readFileSync(join(cwd, ".mcp.json"))).toThrow();
  });
});
