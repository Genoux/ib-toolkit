import { describe, expect, it } from "vitest";
import { isMaintenanceBlocking } from "./maintenance";
import { clientIp, createRateLimiter } from "./rate-limit";
import { safeRedirectPath } from "./safe-redirect";
import { clerkFrontendApi, contentSecurityPolicy, securityHeaders } from "./security-headers";

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

  it("keeps Clerk and Turnstile sources out of the CSP unless a Clerk frontend API is given", () => {
    const base = contentSecurityPolicy();
    expect(base).not.toMatch(/clerk|cloudflare/);
    const withClerk = contentSecurityPolicy({ clerkFrontendApi: "clerk.example.com" });
    expect(withClerk).toContain("https://img.clerk.com");
    expect(withClerk).toContain("https://challenges.cloudflare.com");
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

describe("clientIp", () => {
  const onVercel = { VERCEL: "1" };
  const ip = (
    headers: Record<string, string>,
    options: Parameters<typeof clientIp>[1] = { env: onVercel },
  ) => clientIp(new Headers(headers), options);

  it("on Vercel prefers x-vercel-forwarded-for, then x-forwarded-for, and ignores x-real-ip", () => {
    expect(ip({ "x-vercel-forwarded-for": "203.0.113.7", "x-forwarded-for": "198.51.100.1" })).toBe(
      "203.0.113.7",
    );
    expect(ip({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" })).toBe("198.51.100.1");
    expect(ip({ "x-real-ip": "203.0.113.9" })).toBe("unknown");
  });

  it("off Vercel ignores proxy headers so a client cannot pick its own bucket", () => {
    const spoofed = {
      "x-vercel-forwarded-for": "203.0.113.7",
      "x-forwarded-for": "198.51.100.1",
      "x-real-ip": "203.0.113.9",
    };
    expect(ip(spoofed, { env: {} })).toBe("unknown");
  });

  it("takes the n-th x-forwarded-for entry from the right with trustedProxyHops", () => {
    const headers = { "x-forwarded-for": "6.6.6.6, 198.51.100.1, 10.0.0.1" };
    expect(ip(headers, { env: {}, trustedProxyHops: 1 })).toBe("10.0.0.1");
    expect(ip(headers, { env: {}, trustedProxyHops: 2 })).toBe("198.51.100.1");
    expect(ip(headers, { env: {}, trustedProxyHops: 9 })).toBe("unknown");
  });

  it("rejects values that are not IP addresses", () => {
    expect(ip({ "x-forwarded-for": "not-an-ip" })).toBe("unknown");
    expect(ip({ "x-forwarded-for": " , " })).toBe("unknown");
    expect(ip({})).toBe("unknown");
  });

  it("masks IPv6 addresses to their /64 and unwraps IPv4-mapped ones", () => {
    expect(ip({ "x-forwarded-for": "2001:db8:1:2:3:4:5:6" })).toBe("2001:db8:1:2::/64");
    expect(ip({ "x-forwarded-for": "2001:db8:1:2:ffff::1" })).toBe("2001:db8:1:2::/64");
    expect(ip({ "x-forwarded-for": "2001:db8::1" })).toBe("2001:db8:0:0::/64");
    expect(ip({ "x-forwarded-for": "::ffff:203.0.113.7" })).toBe("203.0.113.7");
  });
});
