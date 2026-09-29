import { describe, expect, it } from "vitest";
import { resolveRoleFromDomains } from "./roles";

const ADMIN_DOMAINS = ["inbeat.agency"];

describe("resolveRoleFromDomains", () => {
  it("makes verified team emails admin", () => {
    const claims = { primaryEmail: "Jane@inbeat.agency", emailVerified: true };
    expect(resolveRoleFromDomains(claims, ADMIN_DOMAINS)).toBe("admin");
  });

  it("makes every other verified email a member", () => {
    const claims = { primaryEmail: "jane@gmail.com", emailVerified: "true" };
    expect(resolveRoleFromDomains(claims, ADMIN_DOMAINS)).toBe("member");
  });

  it("fails closed when the email is unverified or the claim is missing", () => {
    expect(
      resolveRoleFromDomains(
        { primaryEmail: "jane@inbeat.agency", emailVerified: false },
        ADMIN_DOMAINS,
      ),
    ).toBeNull();
    expect(resolveRoleFromDomains({}, ADMIN_DOMAINS)).toBeNull();
  });

  it("rejects look-alike domains", () => {
    const claims = { primaryEmail: "jane@inbeat.agency.evil.com", emailVerified: true };
    expect(resolveRoleFromDomains(claims, ADMIN_DOMAINS)).toBe("member");
  });
});
