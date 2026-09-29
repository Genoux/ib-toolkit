/**
 * Accepts only same-origin relative paths. Rejects protocol-relative (`//evil.com`),
 * backslash tricks (`/\evil.com`) and absolute URLs so `?redirect_url=` can't bounce users out.
 */
export function safeRedirectPath(candidate: string | null | undefined, fallback: string): string {
  if (!candidate?.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\")) return fallback;
  try {
    const url = new URL(candidate, "https://placeholder.invalid");
    return url.origin === "https://placeholder.invalid"
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
