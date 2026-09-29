import { $ } from "bun";
import { toolkitPackages } from "./packages";

// `bun publish` rewrites `workspace:*` to real versions; `changeset publish` (npm) would not.
for (const pkg of toolkitPackages()) {
  const { exitCode, stderr } = await $`bun publish --access restricted`
    .cwd(pkg.dir)
    .nothrow()
    .quiet();
  const output = stderr.toString();
  if (exitCode !== 0 && !output.includes("previously published")) {
    console.error(output);
    process.exit(exitCode);
  }
  console.info(`published ${pkg.name}`);
}

await $`bunx changeset tag`;
