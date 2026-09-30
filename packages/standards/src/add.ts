import { existsSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { ADDONS_DIR, addonNextSteps, applyAddon, assertApplicable, listAddons } from "./addons";
import { formatNextSteps, type Runner, runCommand, TEMPLATE_DIR } from "./create";
import { write } from "./sync";

export type AddOptions = {
  projectDir?: string;
  addonsDir?: string;
  templateDir?: string;
  run?: Runner;
};

const ENV_KEY = /^([A-Z][A-Z0-9_]*)=/;

function readManifest(projectDir: string): {
  ib?: { addons?: string[] };
  devDependencies?: object;
} {
  const manifestPath = join(projectDir, "package.json");
  const manifest = existsSync(manifestPath) && JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!manifest?.devDependencies?.["@inbeat/standards"]) {
    throw new Error(`${projectDir} is not an inBeat app (no package.json with @inbeat/standards).`);
  }
  return manifest;
}

function appendMissingEnvKeys(projectDir: string): void {
  const examplePath = join(projectDir, ".env.example");
  const localPath = join(projectDir, ".env.local");
  if (!existsSync(examplePath)) return;
  const local = existsSync(localPath) ? readFileSync(localPath, "utf8") : "";
  const present = new Set(local.split("\n").map((line) => line.match(ENV_KEY)?.[1]));
  const missing = readFileSync(examplePath, "utf8")
    .split("\n")
    .filter((line) => {
      const key = line.match(ENV_KEY)?.[1];
      return key && !present.has(key);
    });
  if (missing.length === 0) return;
  const separator = local === "" || local.endsWith("\n") ? "" : "\n";
  writeFileSync(localPath, `${local}${separator}${missing.join("\n")}\n`);
}

type Snapshot = Map<string, Buffer | null>;

function snapshotFiles(projectDir: string, paths: string[]): Snapshot {
  return new Map(
    paths.map((path) => {
      const file = join(projectDir, path);
      return [path, existsSync(file) ? readFileSync(file) : null];
    }),
  );
}

function removeEmptyParents(projectDir: string, file: string): void {
  for (let dir = dirname(file); dir !== projectDir; dir = dirname(dir)) {
    if (readdirSync(dir).length > 0) return;
    rmdirSync(dir);
  }
}

function restoreFiles(projectDir: string, snapshot: Snapshot): void {
  for (const [path, contents] of snapshot) {
    const file = join(projectDir, path);
    if (contents) writeFileSync(file, contents);
    else if (existsSync(file)) {
      rmSync(file);
      removeEmptyParents(projectDir, file);
    }
  }
}

export async function add(addon: string, options: AddOptions = {}): Promise<void> {
  const {
    projectDir = resolve("."),
    addonsDir = ADDONS_DIR,
    templateDir = TEMPLATE_DIR,
    run = runCommand,
  } = options;
  const manifest = readManifest(projectDir);
  if (!listAddons(addonsDir).includes(addon)) {
    throw new Error(`unknown addon "${addon}"; available: ${listAddons(addonsDir).join(", ")}`);
  }
  if (manifest.ib?.addons?.includes(addon)) throw new Error(`${addon} is already applied.`);

  const addonDir = join(addonsDir, addon);
  const { write: planned } = assertApplicable(projectDir, addonDir, templateDir);
  const snapshot = snapshotFiles(projectDir, [
    ...planned,
    "package.json",
    "bun.lock",
    "bun.lockb",
    ".env.local",
  ]);
  try {
    applyAddon(projectDir, addonDir, templateDir);
    appendMissingEnvKeys(projectDir);
    run("bun", ["install"], projectDir);
    write(projectDir);
  } catch (error) {
    restoreFiles(projectDir, snapshot);
    throw new Error(
      `add failed: ${error instanceof Error ? error.message : error}\nrestored the files it changed`,
    );
  }
  console.info(`\nAdded ${addon}.\n\n${formatNextSteps(addonNextSteps(addonDir))}`);
}
