# ib-toolkit

Shared packages for inBeat apps: config, server building blocks, UI and agent standards. Every new project starts from here so the stack, structure and look stay the same across products.

## Packages

| Package | What's in it |
| --- | --- |
| `@inbeat/config` | tsconfig, Biome, dependency-cruiser, Vitest and commitlint presets |
| `@inbeat/core` | Framework-free primitives: errors, results, logger, env schemas |
| `@inbeat/next` | Next.js pieces: `action()`, `route()`, Sentry, rate limiting, security headers, fonts |
| `@inbeat/ui` | Design tokens and components (Radix + Tailwind v4), shipped as source |
| `@inbeat/standards` | The `ib` CLI and the agent rules and skills every app shares |

`packages/standards/template` is the base app (no authentication). When in doubt about how something is wired, look there.

## Start a project

```sh
bun add -g @inbeat/standards   # installs `ib`; ~/.bun/bin must be on PATH
```

Then, for every project:

```sh
ib create my-app              # or: bunx @inbeat/standards create my-app
cd my-app && bun dev
```

Open any AI tool in the project and describe what to build. `AGENTS.md` tells it to record the
brief and which guides to read, so no extra context is needed.

`ib create <dir> [--local]` creates the base app. It copies the template, sets the package name, runs `git init` and `bun install`, and syncs the managed `AGENTS.md` block. `<dir>` may be `.` or an existing folder as long as none of the template's paths exist in it.

- `--local` is for developing the toolkit: it runs `bun run pack:local` and points `@inbeat/*` at `.packs/*.tgz` by absolute path, so never commit that `package.json`.

### Ship it

The app ships `.github/workflows/ci.yml`, which calls the toolkit's reusable `verify.yml` (biome, tsc, lint:arch, tests, `ib check`, gitleaks).

```sh
gh repo create Genoux/my-app --private --source . --push
npx vercel link
```

Apps with a database pass `with: { db-check: true }` to `verify.yml`.

### AI tool access (MCP)

`ib mcp` writes MCP server config for the AI tools you pick, from a curated list of official remote servers: Vercel, Sentry, Neon, Clerk, Cloudflare. GitHub is left out: its MCP server needs a personal access token outside VS Code, and the authenticated `gh` CLI covers the same ground. Run it from the app directory and choose freely; pick with arrows and space, Enter confirms; what is already configured is pre-selected.

```sh
ib mcp                                               # arrow-key picker: tools, then servers
ib mcp --tools claude,cursor --servers vercel,sentry # non-interactive
```

Tools: `claude` (`.mcp.json`), `cursor` (`.cursor/mcp.json`), `vscode` (`.vscode/mcp.json`), `codex` (`.codex/config.toml`), `gemini` (`.gemini/settings.json`). Only curated server entries are managed: your own entries and other keys are left alone, and curated servers you deselect are removed. No secrets are written; authenticate each server in your AI tool on first use.

## Use it in an app

Packages are public on npmjs.org; no registry config or token is needed.

```sh
bun add @inbeat/core @inbeat/next @inbeat/ui geist
bun add -d @inbeat/config @inbeat/standards
```

Then:

- `tsconfig.json` extends `@inbeat/config/tsconfig/nextjs.json`
- `next.config.ts` has `transpilePackages: ["@inbeat/ui"]` (core and next ship compiled JS), and `geist` is a dependency (`@inbeat/next/fonts` loads it)
- `vitest.config.ts` spreads `vitestPreset` from `@inbeat/config/vitest`, which runs `@inbeat/*` through Vite so mocks and aliases apply (alias `server-only` to a stub, see the template). Only code that runs outside Vite (e.g. workflow step bundles) needs `execArgv: ["--conditions=react-server"]`
- `biome.json` extends `@inbeat/config/biome`
- `globals.css` imports `@inbeat/ui/theme.css`
- the root layout puts `fontVariables` from `@inbeat/next/fonts` on `<html>`
- `bunx ib sync` writes the shared agent rules; `bunx ib check` fails CI when they drift

## Develop

```sh
bun install
bun run storybook   # components at localhost:6006
bun run check       # types, tests, architecture rules, lint
```

To try a change inside an app before releasing it:

```sh
bun run sync ../ugc-hub --watch
```

This copies the package sources into the app's `node_modules` on every save. If you changed a dependency, run `bun run pack:local` and `bun install` in the app instead.

## Release

Versions come from PR titles. Merges are squash-only, so the title becomes the commit:

| Title | Release |
| --- | --- |
| `fix(ui): …` | patch |
| `feat(next): …` | minor |
| `feat(ui)!: …` | major (minor while below 1.0) |
| `chore:`, `docs:`, `ci:` … | none |

Merging to `main` keeps a release PR up to date with the next version and changelog. Merging that PR publishes every package at the same version.

## Rules

- UI conventions live in `packages/standards/skills/ib-ui/SKILL.md`. Read it before adding a component.
- One story per component in `packages/ui/stories`. What Storybook shows is what apps get.
- Apps change the look only through component props, never by restyling toolkit components.
