import { normalizeEmail } from "@inbeat/core/email";

export type SessionClaims = Record<string, unknown> | null | undefined;

/**
 * Reads the verified primary email from custom session claims. Requires, in
 * Clerk → Sessions → Customize session token:
 * `{ "primaryEmail": "{{user.primary_email_address}}", "emailVerified": "{{user.email_verified}}" }`.
 * Returns null unless both are present, so a missing template fails closed.
 */
export function readVerifiedEmail(claims: SessionClaims): string | null {
  const email = claims?.primaryEmail;
  if (typeof email !== "string" || email.length === 0) return null;
  const verified = claims?.emailVerified === true || claims?.emailVerified === "true";
  return verified ? normalizeEmail(email) : null;
}

export function readEmail(claims: SessionClaims): string | null {
  const email = claims?.primaryEmail;
  return typeof email === "string" && email.length > 0 ? normalizeEmail(email) : null;
}

/** Reads `publicMetadata.role` exposed as `{ "metadata": "{{user.public_metadata}}" }`. */
export function readMetadataRole<TRole extends string>(
  claims: SessionClaims,
  roles: readonly TRole[],
): TRole | null {
  const metadata = claims?.metadata;
  const role =
    typeof metadata === "object" && metadata !== null
      ? (metadata as { role?: unknown }).role
      : undefined;
  return typeof role === "string" && (roles as readonly string[]).includes(role)
    ? (role as TRole)
    : null;
}
