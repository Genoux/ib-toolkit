#!/usr/bin/env bun
import { resolve } from "node:path";
import { staleFiles, write } from "./sync";

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
    if (stale.length === 0) return 0;
    console.error(`out of date with @inbeat/standards, run \`ib sync\`:\n  ${stale.join("\n  ")}`);
    return 1;
  },
  help: () => {
    console.info("usage: ib <sync|check> [app-dir]");
    return 0;
  },
};

process.exit((commands[command] ?? commands.help)());
