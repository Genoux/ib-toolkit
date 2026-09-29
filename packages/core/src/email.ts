export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailDomain(email: string): string | null {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf("@");
  return at > 0 && at < normalized.length - 1 ? normalized.slice(at + 1) : null;
}

/** Exact domain match: `a@evil-inbeat.agency` and `a@inbeat.agency.evil.com` never pass. */
export function isEmailInDomains(email: string, domains: readonly string[]): boolean {
  const domain = emailDomain(email);
  return domain !== null && domains.some((allowed) => normalizeEmail(allowed) === domain);
}
