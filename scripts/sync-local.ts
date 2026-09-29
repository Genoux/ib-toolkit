import {
  cpSync,
  existsSync,
  readFileSync,
  realpathSync,
  rmSync,
  watch,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { type ToolkitPackage, toolkitPackages } from "./packages";

const args = process.argv.slice(2);
const watchMode = args.includes("--watch");
const appDirs = args.filter((arg) => !arg.startsWith("--")).map((dir) => resolve(dir));

if (appDirs.length === 0) {
  console.error("usage: bun run sync <app-dir> [more-app-dirs] [--watch]");
  process.exit(1);
}

function installedDir(appDir: string, pkg: ToolkitPackage): string | null {
  const target = join(appDir, "node_modules", pkg.name);
  return existsSync(target) ? realpathSync(target) : null;
}

// Packing rewrites `workspace:*` to a concrete version, so sibling toolkit packages always
// differ; only third-party ranges signal that the app needs a real reinstall.
function externalDependencies(manifest: { dependencies?: Record<string, string> }): string {
  const entries = Object.entries(manifest.dependencies ?? {}).filter(
    ([name]) => !name.startsWith("@inbeat/"),
  );
  return JSON.stringify(Object.fromEntries(entries));
}

// Entry points only: a new subpath export must resolve without a reinstall, while dependency
// ranges stay exactly as the packed tarball wrote them.
const ENTRY_POINT_FIELDS = ["exports", "bin"] as const;

function syncEntryPoints(
  target: string,
  installed: Record<string, unknown>,
  source: Record<string, unknown>,
) {
  const entryPoints = ENTRY_POINT_FIELDS.filter((field) => field in source).map((field) => [
    field,
    source[field],
  ]);
  const merged = { ...installed, ...Object.fromEntries(entryPoints) };
  writeFileSync(join(target, "package.json"), `${JSON.stringify(merged, null, 2)}\n`);
}

function copyPackage(appDir: string, pkg: ToolkitPackage): boolean {
  const target = installedDir(appDir, pkg);
  if (!target) return false;
  const installed = JSON.parse(readFileSync(join(target, "package.json"), "utf8"));
  const source = JSON.parse(readFileSync(join(pkg.dir, "package.json"), "utf8"));
  if (externalDependencies(installed) !== externalDependencies(source)) {
    console.warn(`${pkg.name}: dependencies changed, re-run pack:local and bun install in the app`);
  }
  syncEntryPoints(target, installed, source);
  for (const entry of pkg.files) {
    const from = join(pkg.dir, entry);
    if (!existsSync(from)) continue;
    rmSync(join(target, entry), { recursive: true, force: true });
    cpSync(from, join(target, entry), {
      recursive: true,
      filter: (path) => !/\.test\.tsx?$/.test(path),
    });
  }
  return true;
}

function syncAll(): void {
  for (const appDir of appDirs) {
    const synced = toolkitPackages().filter((pkg) => copyPackage(appDir, pkg));
    console.info(
      `${appDir}: ${synced.map((pkg) => pkg.shortName).join(", ") || "nothing installed"}`,
    );
  }
}

syncAll();

if (watchMode) {
  let timer: Timer | undefined;
  for (const pkg of toolkitPackages()) {
    watch(pkg.dir, { recursive: true }, (_event, file) => {
      if (!file || file.includes("node_modules")) return;
      clearTimeout(timer);
      timer = setTimeout(syncAll, 100);
    });
  }
  console.info("watching ib-toolkit/packages …");
}
