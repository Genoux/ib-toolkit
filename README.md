# ib-toolkit

Shared packages for inBeat apps: config, server building blocks, UI and agent standards. Every new project starts from here so the stack, structure and look stay the same across products.

## Packages

| Package | What's in it |
| --- | --- |
| `@inbeat/config` | tsconfig, Biome, dependency-cruiser, Vitest and commitlint presets |
| `@inbeat/core` | Framework-free primitives: errors, results, logger, env schemas, signed events |
| `@inbeat/next` | Next.js pieces: `action()`, `route()`, auth guards, Sentry, rate limiting, security headers, fonts |
| `@inbeat/ui` | Design tokens and components (Radix + Tailwind v4), shipped as source |
| `@inbeat/standards` | The `ib` CLI and the agent rules and skills every app shares |

`apps/template` is the base app (no authentication). When in doubt about how something is wired, look there.

## Start a project

```sh
export NODE_AUTH_TOKEN=$(gh auth token)   # needs read:packages
bunx --package @inbeat/standards ib create my-app --no-auth     # or: --auth clerk
```

`ib create <dir> [--auth clerk | --no-auth] [--local]` copies the template, sets the package name, runs `git init` and `bun install`, and syncs the managed `AGENTS.md` block. `<dir>` may be `.` or an existing folder as long as none of the template's paths exist in it.

- `--auth clerk` overlays the Clerk add-on (sign-in, proxy, roles, admin page); `--no-auth` starts with no authentication. Without either flag a terminal is asked; non-interactive runs (CI, AI agents) must pass one.
- `--local` is for developing the toolkit: it runs `bun run pack:local` and points `@inbeat/*` at `.packs/*.tgz` by absolute path, so never commit that `package.json`.
- `bunx ib add clerk` (from an existing app) applies an add-on later, using the app's installed `@inbeat/standards`. It records applied add-ons under `"ib": { "addons": [] }` in `package.json`, replaces `layout.tsx`, `env.ts` and `.env.example` only while they still match the template, and otherwise writes nothing and lists each file with the add-on version to merge by hand; rerun after merging.
- Add-ons live in `packages/standards/addons/<name>/`: a `files/` overlay (new files and whole-file replacements) plus `addon.json` with dependencies to merge.

## Use it in an app

Packages are published to GitHub Packages under the `inBeat` org.

```ini
# .npmrc
@inbeat:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

`NODE_AUTH_TOKEN` is a classic token with `read:packages`. Set it locally, in CI and on Vercel.

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
