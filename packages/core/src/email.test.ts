import { describe, expect, it } from "vitest";
import { emailDomain, isEmailInDomains } from "./email";

describe("isEmailInDomains", () => {
  const domains = ["inbeat.agency", "creativemilkshake.com"];

  it.each([
    ["Jane@InBeat.Agency ", true],
    ["a@creativemilkshake.com", true],
    ["a@evil-inbeat.agency", false],
    ["a@inbeat.agency.evil.com", false],
    ["a@sub.inbeat.agency", false],
    ["inbeat.agency", false],
    ["", false],
  ])("%s -> %s", (email, expected) => {
    expect(isEmailInDomains(email, domains)).toBe(expected);
  });

  it("extracts the domain after the last @", () => {
    expect(emailDomain('"a@b"@inbeat.agency')).toBe("inbeat.agency");
    expect(emailDomain("nope@")).toBeNull();
  });
});
