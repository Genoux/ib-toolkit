import { $ } from "bun";
import { toolkitPackages, withWorkspaceRanges } from "./packages";

// bun publish has no OIDC trusted-publishing support (https://github.com/oven-sh/bun/issues/22423).
// npm reports an already-published version as E403 "cannot publish over the previously published versions".
// NPM_OTP passes an authenticator code for a manual publish from a 2FA account; reruns skip what landed.
// biome-ignore lint/suspicious/noUndeclaredEnvVars: publish runs outside turbo, so there is no task cache to key
const otp = process.env.NPM_OTP;
for (const pkg of toolkitPackages()) {
  const { exitCode, stderr } = await withWorkspaceRanges(pkg, () =>
    $`npm publish --access public ${otp ? ["--otp", otp] : []}`.cwd(pkg.dir).nothrow().quiet(),
  );
  const output = stderr.toString();
  if (exitCode !== 0 && !output.includes("previously published")) {
    console.error(output);
    process.exit(exitCode);
  }
  console.info(`published ${pkg.name}`);
}
