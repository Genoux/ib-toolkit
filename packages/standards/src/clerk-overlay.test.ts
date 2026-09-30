import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PROXY = readFileSync(
  join(import.meta.dirname, "..", "addons", "clerk", "files", "src", "proxy.ts"),
  "utf8",
);

function pageMatcher(): RegExp {
  const pattern = PROXY.match(/"(\/\(\(\?!.*\)\)\.\*\))"/)?.[1];
  if (!pattern) throw new Error("page matcher not found in proxy.ts");
  return new RegExp(`^${pattern.replaceAll("\\\\", "\\")}$`);
}

describe("clerk proxy matcher", () => {
  const matcher = pageMatcher();

  it.each(["/", "/dashboard", "/monitoring-admin", "/monitoringx/a", "/_nextish", "/admin/users"])(
    "runs Clerk on %s",
    (path) => {
      expect(matcher.test(path)).toBe(true);
    },
  );

  it.each([
    "/_next",
    "/_next/static/chunk.js",
    "/monitoring",
    "/monitoring/envelope",
    "/logo.png",
    "/a/b/site.webmanifest",
  ])("skips Clerk on %s", (path) => {
    expect(matcher.test(path)).toBe(false);
  });
});
