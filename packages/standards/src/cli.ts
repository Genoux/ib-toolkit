#!/usr/bin/env bun
import { resolve } from "node:path";
import { create } from "./create";
import { parseCreateArgs } from "./create-args";
import { claudeFilesIgnoringAgents, staleFiles, write } from "./sync";

const USAGE = [
  "usage: ib <create <dir> [--local] | sync [app-dir] | check [app-dir]>",
  "  create <dir>   start a new app",
  "  --local        write absolute file: paths to ib-toolkit tarballs; for toolkit development and CI only,",
  "                 never commit that package.json",
].join("\n");

const [command = "help", ...args] = process.argv.slice(2);
const appDir = resolve(args.find((arg) => !arg.startsWith("--")) ?? ".");

const commands: Record<string, () => number | Promise<number>> = {
  create: async () => {
    let parsed: ReturnType<typeof parseCreateArgs>;
    try {
      parsed = parseCreateArgs(args);
    } catch (error) {
      console.error(`${error instanceof Error ? error.message : error}\n${USAGE}`);
      return 1;
    }
    if (!parsed.dir) {
      console.error(USAGE);
      return 1;
    }
    await create(parsed.dir, { local: parsed.local });
    return 0;
  },
  sync: () => {
    const written = write(appDir);
    console.info(written.length ? `updated:\n  ${written.join("\n  ")}` : "already up to date");
    return 0;
  },
  check: () => {
    const stale = staleFiles(appDir);
    const ignoring = claudeFilesIgnoringAgents(appDir);
    if (stale.length > 0) {
      console.error(
        `out of date with @inbeat/standards, run \`ib sync\`:\n  ${stale.join("\n  ")}`,
      );
    }
    if (ignoring.length > 0) {
      console.error(
        "Claude Code ignores AGENTS.md when a CLAUDE.md exists; add a line `@AGENTS.md` to:\n" +
          `  ${ignoring.join("\n  ")}`,
      );
    }
    return stale.length + ignoring.length === 0 ? 0 : 1;
  },
  help: () => {
    console.info(USAGE);
    return 0;
  },
};

const handler = commands[command];
if (!handler) console.error(USAGE);

try {
  process.exit(handler ? await handler() : 1);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
