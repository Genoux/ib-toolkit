import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import { isDeepStrictEqual } from "node:util";
import { CURATED_SERVERS } from "./mcp-servers";

type Entry = (url: string) => Record<string, string>;
type Applied = { text: string; notes: string[] };
type Format = {
  file: string;
  configured: (text: string) => string[];
  apply: (text: string | null, names: string[]) => Applied;
};
type Table = Record<string, unknown>;

const curatedNames = Object.keys(CURATED_SERVERS);
const isCurated = (name: string) => name in CURATED_SERVERS;
const isTable = (value: unknown): value is Table =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const detectEol = (text: string) => (text.includes("\r\n") ? "\r\n" : "\n");
const keptNote = (name: string) => `${name} has custom settings; kept`;

const JSON_REFUSAL = "contains comments or is not a JSON object; edit it by hand";
const BOM = "\uFEFF";

function readJson(text: string | null, key: string) {
  const bom = text?.startsWith(BOM) ? BOM : "";
  const body = (text ?? "").slice(bom.length);
  let config: unknown = {};
  if (body.trim()) {
    try {
      config = JSON.parse(body);
    } catch {
      throw new Error(JSON_REFUSAL);
    }
  }
  const servers = isTable(config) ? (config[key] === undefined ? {} : config[key]) : null;
  if (!isTable(config) || !isTable(servers)) throw new Error(JSON_REFUSAL);
  return { bom, config, servers };
}

function jsonFormat(file: string, key: string, entry: Entry): Format {
  const managedKeys = Object.keys(entry(""));
  return {
    file,
    configured: (text) => Object.keys(readJson(text, key).servers).filter(isCurated),
    apply: (text, names) => {
      const { bom, config, servers } = readJson(text, key);
      const notes: string[] = [];
      const next: Table = {};
      for (const [name, value] of Object.entries(servers)) {
        if (!isCurated(name)) next[name] = value;
        else if (names.includes(name))
          next[name] = { ...(isTable(value) ? value : {}), ...entry(CURATED_SERVERS[name]) };
        else if (isTable(value) && Object.keys(value).every((field) => managedKeys.includes(field)))
          continue;
        else {
          next[name] = value;
          notes.push(keptNote(name));
        }
      }
      for (const name of names) next[name] ??= entry(CURATED_SERVERS[name]);
      const eol = detectEol(text ?? "");
      const json = `${JSON.stringify({ ...config, [key]: next }, null, 2)}\n`;
      return { text: bom + json.replaceAll("\n", eol), notes };
    },
  };
}

function parseToml(text: string): { root: Table; servers: Table } {
  let root: unknown;
  try {
    root = Bun.TOML.parse(text);
  } catch {
    throw new Error("is not valid TOML; edit it by hand");
  }
  const servers = (root as Table).mcp_servers ?? {};
  if (!isTable(servers)) throw new Error("mcp_servers is not a table; edit it by hand");
  return { root: root as Table, servers };
}

const HEADER_LINE = /^\s*\[/;
const tableHeader = (name: string) =>
  new RegExp(`^\\s*\\[\\s*mcp_servers\\s*\\.\\s*(?:${name}|"${name}")\\s*\\](?:\\s*#.*)?\\s*$`);

function locateTable(lines: string[], name: string): { start: number; end: number } {
  const matches = lines.flatMap((line, index) => (tableHeader(name).test(line) ? [index] : []));
  if (matches.length !== 1)
    throw new Error(
      `${name} is defined inline/dotted; edit it by hand or convert to a [mcp_servers.${name}] table`,
    );
  const start = matches[0];
  let end = lines.findIndex((line, index) => index > start && HEADER_LINE.test(line));
  if (end === -1) end = lines.length;
  return { start, end };
}

const withEntries = (root: Table, servers: Table): Table => {
  const { mcp_servers: _, ...rest } = root;
  return Object.keys(servers).length > 0 ? { ...rest, mcp_servers: servers } : rest;
};

const tomlFormat: Format = {
  file: join(".codex", "config.toml"),
  configured: (text) => Object.keys(parseToml(text).servers).filter(isCurated),
  apply: (text, names) => {
    const source = text ?? "";
    const eol = detectEol(source);
    const { root, servers } = parseToml(source);
    const lines = source.split(/(?<=\n)/).filter(Boolean);
    const expected: Table = { ...servers };
    const notes: string[] = [];
    const added: string[] = [];
    let changed = false;

    for (const name of curatedNames) {
      const selected = names.includes(name);
      const existing = servers[name];
      const url = CURATED_SERVERS[name];
      if (existing === undefined) {
        if (selected) {
          added.push(name);
          expected[name] = { url };
        }
        continue;
      }
      const { start, end } = locateTable(lines, name);
      if (selected) {
        expected[name] = { ...(isTable(existing) ? existing : {}), url };
        if (isTable(existing) && existing.url === url) continue;
        const urlLine = `url = "${url}"`;
        const at = lines.findIndex(
          (line, index) => index > start && index < end && /^\s*url\s*=/.test(line),
        );
        if (at === -1) lines.splice(start + 1, 0, urlLine + eol);
        else lines[at] = urlLine + (/\r?\n$/.exec(lines[at])?.[0] ?? "");
        changed = true;
      } else if (isTable(existing) && Object.keys(existing).every((field) => field === "url")) {
        let removeEnd = end;
        while (removeEnd > start + 1 && /^\s*#/.test(lines[removeEnd - 1])) removeEnd--;
        lines.splice(start, removeEnd - start);
        delete expected[name];
        changed = true;
      } else {
        notes.push(keptNote(name));
      }
    }

    if (!changed && added.length === 0) return { text: source, notes };

    const head = lines.join("");
    const tables = added.map(
      (name) => `[mcp_servers.${name}]${eol}url = "${CURATED_SERVERS[name]}"${eol}`,
    );
    const separator = head && tables.length ? (head.endsWith("\n") ? eol : eol + eol) : "";
    const result = head + separator + tables.join(eol);

    let actual: ReturnType<typeof parseToml>;
    try {
      actual = parseToml(result);
    } catch {
      throw new Error("could not be edited safely; edit it by hand");
    }
    if (!isDeepStrictEqual(withEntries(actual.root, actual.servers), withEntries(root, expected)))
      throw new Error("could not be edited safely; edit it by hand");
    return { text: result, notes };
  },
};

const TOOLS: Record<string, Format> = {
  claude: jsonFormat(".mcp.json", "mcpServers", (url) => ({ type: "http", url })),
  cursor: jsonFormat(join(".cursor", "mcp.json"), "mcpServers", (url) => ({ url })),
  vscode: jsonFormat(join(".vscode", "mcp.json"), "servers", (url) => ({ type: "http", url })),
  codex: tomlFormat,
  // Gemini CLI reads `httpUrl` as streamable HTTP; `url` is SSE. https://geminicli.com/docs/tools/mcp-server/
  gemini: jsonFormat(join(".gemini", "settings.json"), "mcpServers", (url) => ({ httpUrl: url })),
};
const toolNames = Object.keys(TOOLS);

export const applyServers = (tool: string, text: string | null, names: string[]) =>
  TOOLS[tool].apply(text, names);

export const configuredServers = (tool: string, text: string | null) =>
  text ? TOOLS[tool].configured(text) : [];

export const USAGE = [
  "usage: ib mcp [--tools <tool,...>] [--servers <server,...>]",
  `  tools:   ${toolNames.join(", ")}`,
  `  servers: ${curatedNames.join(", ")}`,
  "  without a terminal both flags are required; otherwise missing ones are prompted",
].join("\n");

class UsageError extends Error {}
class Aborted extends Error {}

const FLAG = /^--(tools|servers)(?:=(.*))?$/;
const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export function parseMcpArgs(args: string[]): { tools?: string[]; servers?: string[] } {
  const parsed: { tools?: string[]; servers?: string[] } = {};
  for (let index = 0; index < args.length; index++) {
    const match = FLAG.exec(args[index]);
    if (!match) throw new UsageError(`unknown option ${args[index]}`);
    const value = match[2] ?? args[++index];
    if (value === undefined) throw new UsageError(`${args[index - 1]} needs a value`);
    const list = splitList(value);
    if (list.length === 0) throw new UsageError(`--${match[1]} needs at least one value`);
    parsed[match[1] as "tools" | "servers"] = list;
  }
  return parsed;
}

const unknownNames = (label: string, names: string[], valid: string[]) => {
  const unknown = names.filter((name) => !valid.includes(name));
  return unknown.length > 0
    ? `unknown ${label} ${unknown.join(", ")}; valid: ${valid.join(", ")}`
    : null;
};

function validate(label: string, names: string[], valid: string[]) {
  const problem = unknownNames(label, names, valid);
  if (problem) throw new UsageError(problem);
}

export type McpIo = {
  cwd: string;
  stdin: Readable;
  output: Writable;
  isTTY: boolean;
  out: (text: string) => void;
  err: (text: string) => void;
};

const ATTEMPTS = 2;
const PLAIN_INTEGER = /^\d+$/;

function prompter(io: McpIo) {
  const lines = createInterface({ input: io.stdin, output: io.output, terminal: true });
  const nextLine = lines[Symbol.asyncIterator]();
  // The workspace resolves two @types/node majors; readline's Interface loses its EventEmitter methods.
  const emitter = lines as unknown as { once(event: "SIGINT", listener: () => void): void };
  const interrupted = new Promise<never>((_, reject) =>
    emitter.once("SIGINT", () => reject(new Aborted())),
  );
  interrupted.catch(() => {});

  const ask = async (label: string, valid: string[], preselected: string[]) => {
    let problem = "";
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      io.out(`${label}:`);
      for (const [index, name] of valid.entries())
        io.out(`  ${index + 1}) [${preselected.includes(name) ? "x" : " "}] ${name}`);
      io.out(
        `numbers or names, comma-separated; Enter keeps: ${preselected.join(", ") || "none"}; "none" clears`,
      );
      const { value, done } = await Promise.race([nextLine.next(), interrupted]);
      if (done) throw new Aborted();
      const answer = value.trim();
      if (!answer) return preselected;
      if (answer === "none") return [];
      const names = splitList(answer).map((token) =>
        PLAIN_INTEGER.test(token) ? (valid[Number(token) - 1] ?? token) : token,
      );
      problem = unknownNames(label, names, valid) ?? "";
      if (!problem) return names;
      io.err(problem);
    }
    throw new UsageError(problem);
  };
  return { ask, close: () => lines.close() };
}

const readIfExists = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : null);

function currentlyConfigured(cwd: string) {
  const byTool = toolNames.map((tool) => {
    try {
      return { tool, names: configuredServers(tool, readIfExists(join(cwd, TOOLS[tool].file))) };
    } catch {
      return { tool, names: [] };
    }
  });
  return {
    tools: byTool.filter(({ names }) => names.length > 0).map(({ tool }) => tool),
    servers: curatedNames.filter((name) => byTool.some(({ names }) => names.includes(name))),
  };
}

type Planned = {
  file: string;
  path: string;
  before: string | null;
  after: string;
  notes: string[];
};

function plan(cwd: string, tools: string[], servers: string[]) {
  const failures: string[] = [];
  const planned = tools.flatMap((tool): Planned[] => {
    const { file } = TOOLS[tool];
    const path = join(cwd, file);
    try {
      const before = readIfExists(path);
      const { text, notes } = TOOLS[tool].apply(before, servers);
      return [{ file, path, before, after: text, notes }];
    } catch (error) {
      failures.push(`${file}: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  });
  return { planned, failures };
}

function writeAtomically(path: string, text: string) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    writeFileSync(temporary, text);
    renameSync(temporary, path);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
}

export async function runMcp(args: string[], io: McpIo): Promise<number> {
  if (args.some((arg) => arg === "--help" || arg === "-h")) {
    io.out(USAGE);
    return 0;
  }
  let prompt: ReturnType<typeof prompter> | undefined;
  try {
    const { tools: toolFlag, servers: serverFlag } = parseMcpArgs(args);
    if (!io.isTTY && !(toolFlag && serverFlag)) {
      io.err(USAGE);
      return 1;
    }
    if (toolFlag) validate("tool", toolFlag, toolNames);
    if (serverFlag) validate("server", serverFlag, curatedNames);
    if (!existsSync(join(io.cwd, "package.json")))
      throw new Error("no package.json here; run `ib mcp` from the app directory");

    let tools = toolFlag;
    let servers = serverFlag;
    if (!tools || !servers) {
      const configured = currentlyConfigured(io.cwd);
      prompt = prompter(io);
      tools ??= await prompt.ask("tool", toolNames, configured.tools);
      servers ??= await prompt.ask("server", curatedNames, configured.servers);
    }

    const { planned, failures } = plan(io.cwd, tools, servers);
    if (failures.length > 0) {
      for (const failure of failures) io.err(failure);
      return 1;
    }
    const changed = planned.filter(({ before, after }) => after !== before);
    for (const { path, after } of changed) writeAtomically(path, after);
    for (const { file, notes } of planned) for (const note of notes) io.out(`${file}: ${note}`);
    io.out(
      changed.length
        ? `updated:\n  ${changed.map(({ file }) => file).join("\n  ")}`
        : "already up to date",
    );
    io.out("authenticate each server in your AI tool on first use");
    return 0;
  } catch (error) {
    if (error instanceof Aborted) {
      io.err("aborted");
      return 130;
    }
    const message = error instanceof Error ? error.message : String(error);
    io.err(error instanceof UsageError ? `${message}\n${USAGE}` : message);
    return 1;
  } finally {
    prompt?.close();
  }
}
