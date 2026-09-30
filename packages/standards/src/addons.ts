import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, sep } from "node:path";
import { PACKAGE_ROOT } from "./sync";
import { TARBALL_SAFE_NAMES } from "./template";

export const ADDONS_DIR = join(PACKAGE_ROOT, "addons");

type Dependencies = Record<string, string>;
type AddonManifest = {
  dependencies?: Dependencies;
  devDependencies?: Dependencies;
  nextSteps?: string[];
};

export type OverlayPlan = { write: string[]; satisfied: string[]; blocked: string[] };

function readAddon(addonDir: string): AddonManifest {
  return JSON.parse(readFileSync(join(addonDir, "addon.json"), "utf8"));
}

export function addonNextSteps(addonDir: string): string[] {
  return readAddon(addonDir).nextSteps ?? [];
}

export function listAddons(addonsDir: string = ADDONS_DIR): string[] {
  return readdirSync(addonsDir);
}

function overlayFiles(addonDir: string): string[] {
  const filesDir = join(addonDir, "files");
  return readdirSync(filesDir, { recursive: true, encoding: "utf8" }).filter((path) =>
    statSync(join(filesDir, path)).isFile(),
  );
}

function templatePath(path: string): string {
  const [topLevel, ...rest] = path.split(sep);
  return join(TARBALL_SAFE_NAMES[topLevel] ?? topLevel, ...rest);
}

function hasSameContents(first: string, second: string): boolean {
  return (
    existsSync(first) && existsSync(second) && readFileSync(first).equals(readFileSync(second))
  );
}

/**
 * A file is written when absent or still identical to the base template, and satisfied when it
 * already equals the addon version. Anything else was edited by hand and needs a manual merge.
 */
export function planOverlay(projectDir: string, addonDir: string, baseDir: string): OverlayPlan {
  const plan: OverlayPlan = { write: [], satisfied: [], blocked: [] };
  for (const path of overlayFiles(addonDir)) {
    const target = join(projectDir, path);
    const addonFile = join(addonDir, "files", path);
    const baseFile = join(baseDir, templatePath(path));
    if (hasSameContents(target, addonFile)) plan.satisfied.push(path);
    else if (!existsSync(target) || hasSameContents(target, baseFile)) plan.write.push(path);
    else plan.blocked.push(path);
  }
  return plan;
}

function describeBlocked(projectDir: string, addonDir: string, blocked: string[]): string {
  const installedCopy = (path: string) =>
    join("node_modules", "@inbeat", "standards", "addons", basename(addonDir), "files", path);
  const versionPath = (path: string) =>
    existsSync(join(projectDir, installedCopy(path)))
      ? installedCopy(path)
      : join(addonDir, "files", path);
  return [
    `${basename(addonDir)} not applied: these files differ from the template.`,
    "Merge the addon version into each, then run the command again:",
    ...blocked.map((path) => `  ${path}\n    addon version: ${versionPath(path)}`),
  ].join("\n");
}

function sortedByName(dependencies: Dependencies): Dependencies {
  return Object.fromEntries(Object.entries(dependencies).sort(([a], [b]) => a.localeCompare(b)));
}

export function assertApplicable(
  projectDir: string,
  addonDir: string,
  baseDir: string,
): OverlayPlan {
  const plan = planOverlay(projectDir, addonDir, baseDir);
  if (plan.blocked.length > 0) throw new Error(describeBlocked(projectDir, addonDir, plan.blocked));
  return plan;
}

/**
 * Overlays `files/`, merges addon.json dependencies and records the addon under `ib.addons`.
 * Throws before writing anything when a file needs a manual merge.
 */
export function applyAddon(projectDir: string, addonDir: string, baseDir: string): string[] {
  const { write } = assertApplicable(projectDir, addonDir, baseDir);
  for (const path of write) {
    mkdirSync(dirname(join(projectDir, path)), { recursive: true });
    writeFileSync(join(projectDir, path), readFileSync(join(addonDir, "files", path)));
  }

  const addon = readAddon(addonDir);
  const manifestPath = join(projectDir, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const field of ["dependencies", "devDependencies"] as const) {
    if (addon[field]) manifest[field] = sortedByName({ ...manifest[field], ...addon[field] });
  }
  const applied: string[] = manifest.ib?.addons ?? [];
  manifest.ib = { ...manifest.ib, addons: [...new Set([...applied, basename(addonDir)])] };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return [...write, "package.json"];
}
