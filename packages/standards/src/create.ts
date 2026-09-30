import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { PACKAGE_ROOT, VERSION, write } from "./sync";
import { restoreDotfileName } from "./template";

const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "peerDependencies"] as const;

type Dependencies = Record<string, string>;
export type Manifest = {
  name: string;
  overrides?: Dependencies;
  dependencies?: Dependencies;
  devDependencies?: Dependencies;
  peerDependencies?: Dependencies;
  [field: string]: unknown;
};

export const TEMPLATE_DIR = join(PACKAGE_ROOT, "template");

export function projectName(dir: string): string {
  return basename(resolve(dir))
    .replace(/([a-z\d])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z\d]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateProjectName(name: string): void {
  const isValid =
    name.length > 0 &&
    name.length <= 214 &&
    /^[a-z0-9][a-z0-9-]*$/.test(name) &&
    !["node_modules", "favicon.ico"].includes(name);
  if (!isValid) {
    throw new Error(
      `"${name}" cannot be an npm package name; use a folder name of lowercase letters, digits and dashes, e.g. my-app.`,
    );
  }
}

export function findConflicts(targetDir: string, templateEntries: string[]): string[] {
  return templateEntries
    .map(restoreDotfileName)
    .filter((entry) => existsSync(join(targetDir, entry)));
}

export function rewriteManifest(
  manifest: Manifest,
  options: { name: string; version: string; tarballs?: Dependencies },
): Manifest {
  const { name, version, tarballs } = options;
  const resolveRange = (dependency: string, range: string): string => {
    if (!range.startsWith("workspace:")) return range;
    return tarballs?.[dependency] ?? `^${version}`;
  };
  const resolved = Object.fromEntries(
    DEPENDENCY_FIELDS.filter((field) => manifest[field]).map((field) => [
      field,
      Object.fromEntries(
        Object.entries(manifest[field] as Dependencies).map(([dependency, range]) => [
          dependency,
          resolveRange(dependency, range),
        ]),
      ),
    ]),
  );
  return {
    ...manifest,
    ...resolved,
    name,
    ...(tarballs && { overrides: tarballs }),
  };
}

export function findToolkitRoot(from: string = PACKAGE_ROOT): string | null {
  const manifestPath = join(from, "package.json");
  const isToolkit =
    existsSync(join(from, "scripts", "pack-local.ts")) &&
    existsSync(manifestPath) &&
    JSON.parse(readFileSync(manifestPath, "utf8")).name === "ib-toolkit";
  if (isToolkit) return from;
  const parent = dirname(from);
  return parent === from ? null : findToolkitRoot(parent);
}

export type Runner = (command: string, args: string[], cwd: string) => void;

type ToolkitScripts = {
  toolkitPackages(): { name: string; shortName: string }[];
  packTarballPath(pkg: { shortName: string }): string;
};

// Loaded from the checkout at runtime: scripts/ only exists there, never in the published package.
async function localTarballs(toolkitRoot: string): Promise<Dependencies> {
  const scripts: ToolkitScripts = await import(join(toolkitRoot, "scripts", "packages.ts"));
  return Object.fromEntries(
    scripts.toolkitPackages().map((pkg) => [pkg.name, `file:${scripts.packTarballPath(pkg)}`]),
  );
}

export const runCommand: Runner = (command, args, cwd) => {
  const { status, error } = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (status !== 0) {
    throw new Error(
      `\`${[command, ...args].join(" ")}\` failed${error ? `: ${error.message}` : ""}`,
    );
  }
};

function isInsideGitRepo(dir: string): boolean {
  return (
    spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: dir, stdio: "ignore" })
      .status === 0
  );
}

function resolveToolkitRoot(
  local: boolean,
  targetDir: string,
  env: NodeJS.ProcessEnv,
): string | null {
  if (findToolkitRoot(targetDir)) {
    throw new Error(`${targetDir} is inside the ib-toolkit checkout; create projects elsewhere.`);
  }
  if (local) {
    const toolkitRoot = findToolkitRoot();
    if (!toolkitRoot) {
      throw new Error(
        "--local only works from an ib-toolkit checkout (run the checkout's src/cli.ts).",
      );
    }
    return toolkitRoot;
  }
  if (!env.NODE_AUTH_TOKEN) {
    throw new Error(
      "NODE_AUTH_TOKEN is not set; @inbeat packages live on GitHub Packages.\n" +
        "  export NODE_AUTH_TOKEN=$(gh auth token)   # token needs the read:packages scope",
    );
  }
  return null;
}

export type CreateOptions = {
  local: boolean;
  templateDir?: string;
  run?: Runner;
  env?: NodeJS.ProcessEnv;
};

function populate(targetDir: string, templateDir: string, manifest: Manifest, run: Runner): void {
  for (const entry of readdirSync(templateDir)) {
    cpSync(join(templateDir, entry), join(targetDir, restoreDotfileName(entry)), {
      recursive: true,
    });
  }
  const manifestPath = join(targetDir, "package.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const envLocalPath = join(targetDir, ".env.local");
  if (!existsSync(envLocalPath)) cpSync(join(targetDir, ".env.example"), envLocalPath);

  if (!isInsideGitRepo(targetDir)) run("git", ["init"], targetDir);
  write(targetDir);
  run("bun", ["install"], targetDir);
}

function removeWrittenPaths(targetDir: string, preexisting: Set<string> | null): string {
  if (!preexisting) {
    rmSync(targetDir, { recursive: true, force: true });
    return `removed ${targetDir}`;
  }
  const written = readdirSync(targetDir).filter((entry) => !preexisting.has(entry));
  for (const entry of written) rmSync(join(targetDir, entry), { recursive: true, force: true });
  return `removed from ${targetDir}: ${written.join(", ")}`;
}

function assertNoConflicts(targetDir: string, plannedEntries: string[]): void {
  const conflicts = findConflicts(targetDir, plannedEntries);
  if (conflicts.length > 0) {
    throw new Error(`${targetDir} already contains template paths:\n  ${conflicts.join("\n  ")}`);
  }
}

export function locationStep(cwd: string, targetDir: string): string | null {
  const location = relative(cwd, targetDir);
  if (!location) return null;
  return `cd ${location.startsWith("..") ? targetDir : location}`;
}

export function formatNextSteps(steps: string[]): string {
  return ["Next steps:", ...[...steps, "bun dev"].map((step) => `  ${step}`)].join("\n");
}

/** Everything that can be rejected before the template is built or anything is written. */
function preflight(
  dir: string,
  options: Pick<CreateOptions, "local" | "templateDir" | "env">,
): { targetDir: string; name: string; toolkitRoot: string | null } {
  const {
    local,
    templateDir = TEMPLATE_DIR,
    // biome-ignore lint/style/noProcessEnv: a CLI reads the caller environment directly
    env = process.env,
  } = options;
  const targetDir = resolve(dir);
  const name = projectName(targetDir);
  validateProjectName(name);
  const toolkitRoot = resolveToolkitRoot(local, targetDir, env);
  if (existsSync(templateDir)) assertNoConflicts(targetDir, readdirSync(templateDir));
  return { targetDir, name, toolkitRoot };
}

export async function create(dir: string, options: CreateOptions): Promise<void> {
  const { templateDir = TEMPLATE_DIR, run = runCommand } = options;
  const { targetDir, name, toolkitRoot } = preflight(dir, options);
  if (toolkitRoot) run("bun", ["run", "pack:local"], toolkitRoot);

  if (!existsSync(templateDir)) {
    throw new Error(
      "template missing from @inbeat/standards; run `bun run build:packages` in ib-toolkit.",
    );
  }
  assertNoConflicts(targetDir, readdirSync(templateDir));

  const manifest = rewriteManifest(
    JSON.parse(readFileSync(join(templateDir, "package.json"), "utf8")),
    {
      name,
      version: VERSION,
      tarballs: toolkitRoot ? await localTarballs(toolkitRoot) : undefined,
    },
  );
  const preexisting = existsSync(targetDir) ? new Set(readdirSync(targetDir)) : null;
  try {
    populate(targetDir, templateDir, manifest, run);
  } catch (error) {
    const cleanup = removeWrittenPaths(targetDir, preexisting);
    throw new Error(`create failed: ${error instanceof Error ? error.message : error}\n${cleanup}`);
  }

  const location = locationStep(process.cwd(), targetDir);
  const steps = location ? [location] : [];
  console.info(
    `\nSuccess! Created ${name} at ${realpathSync(targetDir)}\n\n${formatNextSteps(steps)}`,
  );
}
