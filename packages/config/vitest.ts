import type { ViteUserConfig } from "vitest/config";

export const vitestPreset = {
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/*.integration.test.ts", "tests/e2e/**"],
    restoreMocks: true,
  },
} satisfies ViteUserConfig;

export const vitestIntegrationPreset = {
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 30_000,
  },
} satisfies ViteUserConfig;
