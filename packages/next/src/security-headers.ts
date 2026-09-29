export type CspSources = {
  script?: string[];
  style?: string[];
  img?: string[];
  font?: string[];
  connect?: string[];
  media?: string[];
  frame?: string[];
  worker?: string[];
};

export type SecurityHeadersOptions = {
  /** Frontend API host, see `clerkFrontendApi()`. */
  clerkFrontendApi?: string;
  sources?: CspSources;
  /** Ship CSP as report-only first; enforce once a week of traffic shows no violations. */
  cspReportOnly?: boolean;
  cspReportUri?: string;
  dev?: boolean;
};

export type NextHeader = { key: string; value: string };

/** Decodes the host baked into a Clerk publishable key (`pk_<env>_<base64(host$)>`). */
export function clerkFrontendApi(publishableKey: string | undefined): string | undefined {
  const encoded = publishableKey?.split("_")[2];
  if (!encoded) return undefined;
  try {
    return atob(encoded).replace(/\$$/, "") || undefined;
  } catch {
    return undefined;
  }
}

function directive(name: string, values: (string | undefined | false)[]): string {
  return [name, ...new Set(values.filter(Boolean))].join(" ");
}

export function contentSecurityPolicy({
  clerkFrontendApi: clerk,
  sources = {},
  cspReportUri,
  dev = false,
}: SecurityHeadersOptions = {}): string {
  const clerkOrigin = clerk && `https://${clerk}`;
  const turnstile = "https://challenges.cloudflare.com";

  return [
    directive("default-src", ["'self'"]),
    directive("script-src", [
      "'self'",
      // Next injects inline bootstrap scripts; nonces would force every page dynamic.
      "'unsafe-inline'",
      dev && "'unsafe-eval'",
      clerkOrigin,
      turnstile,
      ...(sources.script ?? []),
    ]),
    directive("style-src", ["'self'", "'unsafe-inline'", ...(sources.style ?? [])]),
    directive("img-src", [
      "'self'",
      "data:",
      "blob:",
      "https://img.clerk.com",
      ...(sources.img ?? []),
    ]),
    directive("font-src", ["'self'", "data:", ...(sources.font ?? [])]),
    directive("connect-src", ["'self'", clerkOrigin, dev && "ws:", ...(sources.connect ?? [])]),
    directive("media-src", ["'self'", "blob:", ...(sources.media ?? [])]),
    directive("frame-src", ["'self'", turnstile, ...(sources.frame ?? [])]),
    directive("worker-src", ["'self'", "blob:", ...(sources.worker ?? [])]),
    directive("object-src", ["'none'"]),
    directive("base-uri", ["'self'"]),
    directive("form-action", ["'self'"]),
    directive("frame-ancestors", ["'none'"]),
    cspReportUri ? directive("report-uri", [cspReportUri]) : undefined,
  ]
    .filter(Boolean)
    .join("; ");
}

/**
 * Use from `next.config.ts`: `headers: async () => [{ source: "/(.*)", headers: securityHeaders(…) }]`.
 * X-Frame-Options stays even with CSP because browsers ignore `frame-ancestors` in report-only mode.
 */
export function securityHeaders(options: SecurityHeadersOptions = {}): NextHeader[] {
  const { cspReportOnly = true, dev = false } = options;
  return [
    {
      key: cspReportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
      value: contentSecurityPolicy(options),
    },
    ...(dev
      ? []
      : [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ]),
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ];
}
