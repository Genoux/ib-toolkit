import { describe, expect, it } from "vitest";
import { readMetadataRole, readVerifiedEmail } from "./claims";
import { isMaintenanceBlocking } from "./maintenance";
import { createRateLimiter } from "./rate-limit";
import { safeRedirectPath } from "./safe-redirect";
import { clerkFrontendApi, contentSecurityPolicy, securityHeaders } from "./security-headers";

describe("claims", () => {
  it("requires a verified primary email", () => {
    expect(readVerifiedEmail({ primaryEmail: "A@inbeat.agency", emailVerified: true })).toBe(
      "a@inbeat.agency",
    );
    expect(readVerifiedEmail({ primaryEmail: "a@inbeat.agency", emailVerified: false })).toBeNull();
    expect(readVerifiedEmail({ primaryEmail: "a@inbeat.agency" })).toBeNull();
    expect(readVerifiedEmail(null)).toBeNull();
  });

  it("reads only known metadata roles", () => {
    const roles = ["admin", "member"] as const;
    expect(readMetadataRole({ metadata: { role: "admin" } }, roles)).toBe("admin");
    expect(readMetadataRole({ metadata: { role: "owner" } }, roles)).toBeNull();
    expect(readMetadataRole({ metadata: "admin" }, roles)).toBeNull();
  });
});

describe("safeRedirectPath", () => {
  it.each([
    ["/clients?x=1#a", "/clients?x=1#a"],
    ["//evil.com", "/home"],
    ["/\\evil.com", "/home"],
    ["https://evil.com", "/home"],
    ["clients", "/home"],
    [null, "/home"],
  ])("%s -> %s", (input, expected) => {
    expect(safeRedirectPath(input, "/home")).toBe(expected);
  });
});

describe("security headers", () => {
  it("decodes the Clerk frontend API from a publishable key", () => {
    const key = `pk_test_${btoa("happy-cat-12.clerk.accounts.dev$")}`;
    expect(clerkFrontendApi(key)).toBe("happy-cat-12.clerk.accounts.dev");
    expect(clerkFrontendApi(undefined)).toBeUndefined();
  });

  it("builds a CSP that denies framing and allows Clerk", () => {
    const csp = contentSecurityPolicy({ clerkFrontendApi: "clerk.example.com" });
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline' https://clerk.example.com");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("ships report-only by default and always sets X-Frame-Options", () => {
    const keys = securityHeaders().map((header) => header.key);
    expect(keys).toContain("Content-Security-Policy-Report-Only");
    expect(keys).toContain("X-Frame-Options");
    expect(keys).toContain("Strict-Transport-Security");
    expect(securityHeaders({ dev: true }).map((h) => h.key)).not.toContain(
      "Strict-Transport-Security",
    );
  });
});

describe("maintenance", () => {
  it("blocks everyone except bypass emails", () => {
    const config = { enabled: true, bypassEmails: ["ops@inbeat.agency"] };
    expect(isMaintenanceBlocking(config, "OPS@inbeat.agency")).toBe(false);
    expect(isMaintenanceBlocking(config, "a@b.com")).toBe(true);
    expect(isMaintenanceBlocking(config, null)).toBe(true);
    expect(isMaintenanceBlocking({ enabled: false, bypassEmails: [] }, null)).toBe(false);
  });
});

describe("rate limiter (memory backend)", () => {
  it("allows up to the limit, then throws rate_limited", async () => {
    let fellBack = false;
    const limiter = createRateLimiter({ prefix: "t", onMemoryFallback: () => (fellBack = true) });
    expect(limiter.backend).toBe("memory");
    expect(fellBack).toBe(true);

    const policy = { limit: 2, window: "1 m" } as const;
    await limiter.enforce("invite:a", policy);
    await limiter.enforce("invite:a", policy);
    await expect(limiter.enforce("invite:a", policy)).rejects.toMatchObject({
      kind: "rate_limited",
    });
    await expect(limiter.enforce("invite:b", policy)).resolves.toBeUndefined();
  });
});
