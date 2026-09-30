import { isEmailInDomains } from "@inbeat/core/email";
import { readVerifiedEmail, type SessionClaims } from "@inbeat/next/claims";

export const ROLES = ["admin", "member"] as const;
export type Role = (typeof ROLES)[number];

export function resolveRoleFromDomains(claims: SessionClaims, adminDomains: string[]): Role | null {
  const email = readVerifiedEmail(claims);
  if (!email) return null;
  return isEmailInDomains(email, adminDomains) ? "admin" : "member";
}
