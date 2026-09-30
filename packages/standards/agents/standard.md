## inBeat toolkit standard

Stack: Next.js App Router, TypeScript strict, React 19, Drizzle + Neon, Clerk, Sentry, Vercel, Bun.
Shared code comes from `@inbeat/*` (ui ships source via `transpilePackages`; core and next ship compiled JS). Never fork a toolkit
file into the app; change it in ib-toolkit.

### Two tiers

- **Required** (CI enforces): `@inbeat/config` presets, the action/route error contract,
  `securityHeaders()`, Sentry presets, rate limiting on public entry points, this block.
- **Opt-in**: `@inbeat/ui` blocks, `defineAuth`, events, extra layer rules.
- A deliberate departure is allowed when the app states it under **Deliberate deviations**
  in its own section of this file (what, why, owner). Undeclared drift is a bug.

### Layout

```
src/app/                    routes + composition; private pieces in _components/
src/features/<f>/actions/   "use server" mutations, one per file, via action()
src/features/<f>/queries/   server-only reads for Server Components
src/features/<f>/server/    domain commands and policies ("server-only", no "use server")
src/features/<f>/components/ hooks/ lib/ schemas.ts types.ts
src/entities/               leaf: domain types, zod schemas, constants
src/integrations/<vendor>/  external adapters
src/shared/{components,config,lib,hooks}/
src/db/schema/<table>.ts, src/db/migrations/
```

Layers (dependency-cruiser, `@inbeat/config/dependency-cruiser`): features never import each
other; entities import nothing internal; db imports entities only; shared and integrations never
import features or app.

### Reads and writes

| Need | Use |
|---|---|
| Page data | Server Component calls `queries/*` |
| Mutation from own UI | `action()` from `@inbeat/next/action`, returns `Result` |
| Client polling, infinite lists | `GET` via `route()`, React Query |
| Webhooks, presign, redirects, cron | `route()` |

Server actions are queued per client; never use them for reads.

### Errors

- Actions resolve to `{ ok: true, data } | { ok: false, error, code?, errorId? }`.
  Routes answer `{ error, code, errorId? }` with the status from `APP_ERROR_STATUS`.
- Throw `AppError(kind)` from `@inbeat/core/errors`; never `new Error("Forbidden")`.
  Kinds: validation, auth, forbidden, not_found, conflict, rate_limited, db_transient,
  db_query, timeout, external_service, unknown.
- Unexpected errors are classified, reported once, and replaced with safe copy + `ERR_xxxx`.
- Log with `createLogger()`; ids only, never emails, names or payloads. No `console.log`.

### Auth

- Clerk everywhere. `authorize` is required on every `action()` and `route()`;
  `publicAccess` is an explicit choice and must be rate limited.
- Roles are a pure function of session claims (`defineAuth({ resolveRole })`): verified email
  domain (`readVerifiedEmail`) or `publicMetadata.role` (`readMetadataRole`). Missing claims
  fail closed.
- Redirect targets go through `safeRedirectPath`. `APP_URL` comes from env, never `Host`.

### Security baseline

- `securityHeaders()` in `next.config.ts`; CSP report-only until a clean week, then enforce.
- `createRateLimiter()` (Upstash in prod) on every unauthenticated entry, presign and LLM call.
- Outbound webhooks signed with `signPayload`, inbound verified. Secrets only in Vercel env.
- `import "server-only"` in every module touching secrets or the DB.
- Env through `@t3-oss/env-nextjs` + `@inbeat/core/env` fragments; no `process.env` elsewhere.

### Data

- UUID PKs, `timestamp({ withTimezone: true })`, snake_case, one table per file.
- Migrations are generated, reviewed, forward-only, expand then contract; they run after the
  build resolves. Never run migrations or destructive SQL against production unless the user
  says "apply migrations to prod".
- Deletes that own storage objects collect keys in the transaction and delete after commit.

### UI

- Primitives and generic blocks from `@inbeat/ui/components/*`; tokens from
  `@inbeat/ui/theme.css`. A block moves to the toolkit only once an app actually uses it.
- Buttons are `rounded-full` with no destructive variant; destructive flows use
  `DestructiveActionDialog` from `@inbeat/ui`. Icon-only buttons get a tooltip. Lists use
  `DataTableShell` + `DataTable`; empty lists use `EmptyState`.
- Radix via `radix-ui`; animation via `motion` only.

### Tests and CI

- Vitest colocated `*.test.ts` for every `server/` command, policy and `lib/` function;
  `*.integration.test.ts` against a Neon branch; Playwright in `tests/e2e` against previews.
- CI: biome, tsc, dependency-cruiser, vitest, migration check, `ib check`, gitleaks.

### Commits

Conventional commits, lowercase, present tense, title under 60 chars. No AI attribution.
Never commit, push or open a PR unless explicitly asked.
