import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  watch,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { $ } from "bun";
import { ROOT, type ToolkitPackage, toolkitPackages } from "./packages";

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

// `template` is a runnable app with its own node_modules and .next; the packed tarball leaves
// them out, so syncing must too.
const LOCAL_ARTIFACTS = new Set(["node_modules", ".next", ".turbo"]);

function isPublished(root: string, path: string): boolean {
  const segments = relative(root, path).split(sep);
  return !/\.test\.tsx?$/.test(path) && !segments.some((segment) => LOCAL_ARTIFACTS.has(segment));
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
  const manifestPath = join(target, "package.json");
  // bun hardlinks installs to its global cache; writing in place would corrupt the cached package.
  rmSync(manifestPath);
  writeFileSync(manifestPath, `${JSON.stringify(merged, null, 2)}\n`);
}

function copyPackage(appDir: string, pkg: ToolkitPackage): boolean {
  const target = installedDir(appDir, pkg);
  if (!target) return false;
  const installed = JSON.parse(readFileSync(join(target, "package.json"), "utf8"));
  const source = JSON.parse(readFileSync(join(pkg.dir, "package.json"), "utf8"));
  if (externalDependencies(installed) !== externalDependencies(source)) {
    console.warn(`${pkg.name}: dependencies changed, bun add the new ones in the app`);
  }
  syncEntryPoints(target, installed, source);
  for (const entry of pkg.files) {
    const from = join(pkg.dir, entry);
    if (!existsSync(from)) continue;
    rmSync(join(target, entry), { recursive: true, force: true });
    cpSync(from, join(target, entry), {
      recursive: true,
      filter: (path) => isPublished(from, path),
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

let building = false;
let rebuildQueued = false;

// A change that lands mid-build queues exactly one more build instead of overlapping.
async function rebuildAndSync(): Promise<void> {
  if (building) {
    rebuildQueued = true;
    return;
  }
  building = true;
  do {
    rebuildQueued = false;
    const { exitCode, stdout, stderr } = await $`bun run build:packages`
      .cwd(ROOT)
      .quiet()
      .nothrow();
    if (exitCode === 0) syncAll();
    else console.error(`${stdout}${stderr}`);
  } while (rebuildQueued);
  building = false;
}

// `dist` and `.turbo` are build output; watching them would retrigger every build.
function watchedPaths(pkg: ToolkitPackage): string[] {
  const sources = ["src", "package.json", ...pkg.files.filter((entry) => entry !== "dist")];
  return [...new Set(sources)].map((entry) => join(pkg.dir, entry)).filter(existsSync);
}

// A recursive watch cannot exclude subtrees and throws on dangling symlinks, which template's
// node_modules (bun's isolated linker) can hold, so artifact folders are skipped by watching
// their siblings instead.
function watchTargets(path: string): string[] {
  if (!statSync(path).isDirectory()) return [path];
  const children = readdirSync(path);
  if (!children.some((name) => LOCAL_ARTIFACTS.has(name))) return [path];
  return children.filter((name) => !LOCAL_ARTIFACTS.has(name)).map((name) => join(path, name));
}

if (watchMode) {
  let timer: Timer | undefined;
  for (const path of toolkitPackages().flatMap(watchedPaths).flatMap(watchTargets)) {
    watch(path, { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(rebuildAndSync, 100);
    });
  }
  console.info("watching ib-toolkit/packages …");
}
