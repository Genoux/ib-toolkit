/** @typedef {import("vitest/config").ViteUserConfig} ViteUserConfig */

export const vitestPreset = /** @satisfies {ViteUserConfig} */ (
  /** @type {const} */ ({
    test: {
      environment: "node",
      include: ["src/**/*.test.{ts,tsx}"],
      exclude: ["**/node_modules/**", "**/*.integration.test.ts", "tests/e2e/**"],
      restoreMocks: true,
      server: { deps: { inline: [/\/node_modules\/@inbeat\//] } },
    },
  })
);

export const vitestIntegrationPreset = /** @satisfies {ViteUserConfig} */ (
  /** @type {const} */ ({
    test: {
      environment: "node",
      include: ["src/**/*.integration.test.ts"],
      testTimeout: 30_000,
    },
  })
);
