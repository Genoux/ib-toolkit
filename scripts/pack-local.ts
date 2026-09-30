import { existsSync, mkdirSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";
import { ROOT, type ToolkitPackage, toolkitPackages, withWorkspaceRanges } from "./packages";

// Tarballs, not `link:`/`file:` folders: Bun symlinks those back into ib-toolkit, so the app
// would load ib-toolkit's copies of react, @clerk/nextjs and @sentry/nextjs and break context.
const destination = join(ROOT, ".packs");
mkdirSync(destination, { recursive: true });

const bunCacheDir = (await $`bun pm cache`.quiet().text()).trim().split("\n").at(-1) ?? "";

// Bun 1.3 caches local tarballs under `<cache>/<name>/@T@<hash of path>`, keyed by path rather
// than content, so every repack to the same filename would install the previous contents.
function evictCachedTarball(pkg: ToolkitPackage): void {
  const entryDir = join(bunCacheDir, pkg.name);
  if (!bunCacheDir || !existsSync(entryDir)) return;
  for (const link of readdirSync(entryDir)) {
    const linkPath = join(entryDir, link);
    const target = existsSync(linkPath) ? realpathSync(linkPath) : linkPath;
    rmSync(target, { recursive: true, force: true });
  }
  rmSync(entryDir, { recursive: true, force: true });
}

for (const pkg of toolkitPackages()) {
  const tarball = join(destination, `inbeat-${pkg.shortName}.tgz`);
  await withWorkspaceRanges(pkg, () => $`bun pm pack --filename ${tarball} --quiet`.cwd(pkg.dir));
  evictCachedTarball(pkg);
  console.info(`packed ${pkg.name}`);
}
