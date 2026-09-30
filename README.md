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

`apps/template` is the reference app. When in doubt about how something is wired, look there.

## Use it in an app

Packages are published to GitHub Packages under the `inBeat` org.

```ini
# .npmrc
@inbeat:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

`NODE_AUTH_TOKEN` is a classic token with `read:packages`. Set it locally, in CI and on Vercel.

```sh
bun add @inbeat/core @inbeat/next @inbeat/ui
bun add -d @inbeat/config @inbeat/standards
```

Then:

- `tsconfig.json` extends `@inbeat/config/tsconfig/nextjs.json`
- `next.config.ts` has `transpilePackages: ["@inbeat/core", "@inbeat/next", "@inbeat/ui"]`
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
