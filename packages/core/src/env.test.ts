import { describe, expect, it } from "vitest";
import { resolveAppUrl } from "./env";

describe("resolveAppUrl", () => {
  it("prefers APP_URL", () => {
    expect(resolveAppUrl({ APP_URL: "https://hub.example.com", VERCEL_URL: "x.vercel.app" })).toBe(
      "https://hub.example.com",
    );
  });

  it("uses the production domain in production and the deployment url elsewhere", () => {
    const vercel = {
      VERCEL_URL: "abc.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "hub.example.com",
    };
    expect(resolveAppUrl({ ...vercel, VERCEL_ENV: "production" })).toBe("https://hub.example.com");
    expect(resolveAppUrl({ ...vercel, VERCEL_ENV: "preview" })).toBe("https://abc.vercel.app");
  });

  it("falls back to localhost", () => {
    expect(resolveAppUrl({})).toBe("http://localhost:3000");
  });
});
