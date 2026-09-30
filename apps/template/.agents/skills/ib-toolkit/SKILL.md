---
name: ib-toolkit
description: Use the inBeat toolkit (@inbeat/core, @inbeat/next, @inbeat/config) correctly in an inBeat app. Use when writing server actions, route handlers, auth checks, env, rate limits, webhooks, Sentry or logging, or when the user mentions ib-toolkit or @ib-toolkit.
---

# ib-toolkit

Read the "inBeat toolkit standard" block in `AGENTS.md` first. This skill is the how-to. Examples use `requireAdmin` from the Clerk add-on; without auth use `publicAccess` plus a rate limiter.

## Server action

```ts
"use server";
import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { requireAdmin } from "@/shared/lib/auth";
import { createClientSchema } from "../schemas";
import { createClientRecord } from "../server/create-client-record";

export const createClient = action({
  name: "clients.create",
  schema: createClientSchema,
  authorize: requireAdmin,
  run: async (input, viewer) => ok(await createClientRecord(input, viewer.userId)),
  revalidate: () => ["/clients"],
});
```

Client side: `const result = await createClient(values); if (!result.ok) toast.error(result.error);`

Public action: `authorize: publicAccess`, then first thing in `run`:
`await rateLimiter.enforce(\`apply:${clientIp(await headers())}\`, { limit: 5, window: "10 m" })`.
The limiter is one shared instance in `src/shared/lib/rate-limit.ts` (`createRateLimiter({ prefix, upstash })`
with the `upstashEnv` values) imported by every action and route. Get the IP only from `clientIp` in
`@inbeat/next/rate-limit` (routes pass `request.headers`); never write your own header parsing.
`clientIp` is reliable on Vercel only; self-hosted apps behind a proxy pass `{ trustedProxyHops: n }`,
otherwise it returns `"unknown"`. Public forms using Turnstile without Clerk must add its hosts via
`securityHeaders({ sources: { script: ["https://challenges.cloudflare.com"], frame: ["https://challenges.cloudflare.com"] } })`.

## Route handler

```ts
import { route } from "@inbeat/next/route";
export const GET = route({
  name: "clients.list",
  authorize: requireAdmin,
  query: z.object({ cursor: z.string().optional() }),
  handler: async ({ query }) => listClients(query.cursor),
});
```

## Errors

- Deny: `throw new AppError("forbidden", "reason for logs")`. The user sees safe default copy.
- Expected business failure: `return fail("That handle is taken", "conflict")`.
- Anything else: let it throw. The wrapper classifies, reports to Sentry and returns `ERR_xxxx`.
- Postgres: `isUniqueViolation(err)` from `@inbeat/core/errors`, never string matching.

## Auth

Only once the app has the Clerk add-on; without it there is no `src/shared/lib/auth.ts`, so skip `requireAdmin` and `authorize` guards. To add auth run `bunx ib add clerk`; if it lists files to merge, merge them, then rerun.

`src/shared/lib/auth.ts` owns the app's roles:

```ts
import { defineAuth, readVerifiedEmail } from "@inbeat/next/auth";
export const { getViewer, requireViewer, requireRole } = defineAuth({
  resolveRole: (claims) => (isStaffEmail(readVerifiedEmail(claims)) ? "admin" : "creator"),
});
export const requireAdmin = requireRole("admin");
```

The proxy uses the same `resolveRole` with `auth().sessionClaims` so both layers agree.

## Env

```ts
import { createEnv } from "@t3-oss/env-nextjs";
import { clerkClientEnv, clerkServerEnv, dbEnv, upstashEnv } from "@inbeat/core/env";
export const env = createEnv({
  server: { ...dbEnv, ...clerkServerEnv, ...upstashEnv },
  client: { ...clerkClientEnv },
  experimental__runtimeEnv: { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY },
  emptyStringAsUndefined: true,
});
```

## Other building blocks

| Need | Import |
|---|---|
| Neon pool | `createDb` from `@inbeat/next/db` |
| Clerk webhook | `createClerkWebhookHandler` from `@inbeat/next/clerk-webhook` |
| Headers/CSP | `securityHeaders`, `clerkFrontendApi` from `@inbeat/next/security-headers` |
| Sentry | `sentryServerOptions` from `@inbeat/next/sentry` (server, edge); `sentryClientOptions` from `@inbeat/next/sentry-client` (browser only) |
| Signed outbound events | `createEventEmitter` from `@inbeat/core/events` |
| Verify inbound signature | `verifyPayload` from `@inbeat/core/signature` |
| Redirect param | `safeRedirectPath` from `@inbeat/next/safe-redirect` |

## Changing the toolkit

Edit `~/Desktop/@inbeat/ib-toolkit`, run its tests, then `bun run sync <app-dir>` there to copy
the sources into the app's `node_modules/@inbeat/*` (use `--watch` while iterating).
