#!/usr/bin/env bun
import { resolve } from "node:path";
import { claudeFilesIgnoringAgents, staleFiles, write } from "./sync";

const [command = "help", dir = "."] = process.argv.slice(2);
const appDir = resolve(dir);

const commands: Record<string, () => number> = {
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
    console.info("usage: ib <sync|check> [app-dir]");
    return 0;
  },
};

process.exit((commands[command] ?? commands.help)());
