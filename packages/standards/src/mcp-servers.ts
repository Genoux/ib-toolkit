export const CURATED_SERVERS: Record<string, string> = {
  vercel: "https://mcp.vercel.com",
  github: "https://api.githubcopilot.com/mcp/readonly",
  sentry: "https://mcp.sentry.dev/mcp",
  neon: "https://mcp.neon.tech/mcp",
  clerk: "https://mcp.clerk.com/mcp",
  cloudflare: "https://mcp.cloudflare.com/mcp",
};

export const SERVER_HINTS: Record<string, string> = {
  vercel: "Vercel projects and deployments",
  github: "GitHub (read-only)",
  sentry: "Sentry issues and errors",
  neon: "Neon Postgres",
  clerk: "Clerk auth docs and SDKs",
  cloudflare: "Cloudflare API",
};
