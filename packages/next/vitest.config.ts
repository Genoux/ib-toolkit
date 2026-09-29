import { fileURLToPath } from "node:url";
import { vitestPreset } from "@inbeat/config/vitest";
import { defineConfig } from "vitest/config";

export default defineConfig({
  ...vitestPreset,
  resolve: {
    alias: {
      "server-only": fileURLToPath(new URL("./src/test/empty.ts", import.meta.url)),
    },
  },
});
