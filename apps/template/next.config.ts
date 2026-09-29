import { fileURLToPath } from "node:url";
import { clerkFrontendApi, securityHeaders } from "@inbeat/next/security-headers";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// Inside ib-toolkit, bun links `next` and the @inbeat/* sources from the monorepo root, which
// Turbopack refuses to compile unless the root covers them. A standalone app uses its own dir.
const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ["@inbeat/core", "@inbeat/next", "@inbeat/ui"],
  turbopack: {
    root: workspaceRoot,
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders({
        clerkFrontendApi: clerkFrontendApi(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
        dev: process.env.NODE_ENV !== "production",
      }),
    },
  ],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Browser events go through this rewrite so ad-blockers don't drop them; the proxy matcher
  // must never catch it.
  tunnelRoute: "/monitoring",
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
