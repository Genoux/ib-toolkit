import { $ } from "bun";
import { toolkitPackages, withWorkspaceRanges } from "./packages";

for (const pkg of toolkitPackages()) {
  const { exitCode, stderr } = await withWorkspaceRanges(pkg, () =>
    $`bun publish --access restricted`.cwd(pkg.dir).nothrow().quiet(),
  );
  const output = stderr.toString();
  if (exitCode !== 0 && !output.includes("previously published")) {
    console.error(output);
    process.exit(exitCode);
  }
  console.info(`published ${pkg.name}`);
}
