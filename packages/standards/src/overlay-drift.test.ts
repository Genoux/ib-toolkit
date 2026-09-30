import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ADDONS_DIR, listAddons } from "./addons";

const BASE = join(import.meta.dirname, "..", "..", "..", "apps", "template");

function lines(file: string): string[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim());
}

function describeReplacement(path: string, overlayFile: string): string {
  const base = lines(join(BASE, path));
  const overlay = lines(overlayFile);
  return [
    `## ${path}`,
    ...base.filter((line) => !overlay.includes(line)).map((line) => `- ${line}`),
    ...overlay.filter((line) => !base.includes(line)).map((line) => `+ ${line}`),
  ].join("\n");
}

function replacements(addon: string): string {
  const filesDir = join(ADDONS_DIR, addon, "files");
  return readdirSync(filesDir, { recursive: true, encoding: "utf8" })
    .filter((path) => statSync(join(filesDir, path)).isFile() && existsSync(join(BASE, path)))
    .sort()
    .map((path) => describeReplacement(path, join(filesDir, path)))
    .join("\n\n");
}

describe("addon overlays replacing base files", () => {
  it.each(listAddons())(
    "%s differs from the base only by the recorded lines; update the overlay when the base changes",
    async (addon) => {
      await expect(`${replacements(addon)}\n`).toMatchFileSnapshot(
        join("__snapshots__", `${addon}-overlay-drift.txt`),
      );
    },
  );
});
