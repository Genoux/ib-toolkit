import { $ } from "bun";
import { toolkitPackages, withWorkspaceRanges } from "./packages";

// bun publish has no OIDC trusted-publishing support (https://github.com/oven-sh/bun/issues/22423).
// npm reports an already-published version as E403 "cannot publish over the previously published versions".
for (const pkg of toolkitPackages()) {
  const { exitCode, stderr } = await withWorkspaceRanges(pkg, () =>
    $`npm publish --access public`.cwd(pkg.dir).nothrow().quiet(),
  );
  const output = stderr.toString();
  if (exitCode !== 0 && !output.includes("previously published")) {
    console.error(output);
    process.exit(exitCode);
  }
  console.info(`published ${pkg.name}`);
}
