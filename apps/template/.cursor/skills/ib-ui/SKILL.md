---
name: ib-ui
description: Build UI in an inBeat app with @inbeat/ui primitives and tokens. Use when creating or editing components, pages, dialogs, tables, forms, empty states, or when the user mentions ib-ui or @ib-ui.
---

# ib-ui

## Rules

- Import primitives from `@inbeat/ui/components/<name>` (button, dialog, dropdown-menu, table,
  data-table, sheet, sidebar, tooltip, field, input, select, tabs, …). Never copy them locally.
- `cn` comes from `@inbeat/ui/lib/utils`.
- Tokens only: `bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`, radius
  scale `rounded-{sm..4xl}`. No hex colors, no arbitrary spacing unless no token fits.
- Blocks ship from `@inbeat/ui/components/<name>` too: `empty-state`, `toggle-pills`,
  `person-identity`, `member-avatar-stack`, `data-table-shell`, `collapsible-section`,
  `multi-select-popover`, `destructive-action-dialog`.
- App shells: always `AppShell` + `AppNav` (`@inbeat/ui/components/app-shell`, `app-nav`); never
  assemble Sidebar primitives in an app. Links come in via `AppNav`'s `renderLink`; app-specific
  sidebar content goes in `AppShell`'s `sidebar` slot. Width is the `sidebarWidth` prop, never a
  `--sidebar-width` override. Products differ only through `AppShell` props (`variant`,
  `collapsible`, `sidebarWidth`, `headerVariant`), never through classes or local shell markup.
  Settings screens are product layouts: build them per app, from toolkit components only.
- One component per job. Tabs: `Tabs` + `TabsList tabs={[{ value, label, count? }]}` +
  `TabsContent`; drop `TabsContent` for a filter bar. Empty: `EmptyState`.
- Variants are only the ones an app uses. `Button`: default, secondary, outline, ghost, link,
  dots. `Badge`: default, secondary, outline. `TabsList` is pills only.
- Shadows: `shadow-hairline`, `shadow-subtle`, `shadow-elevated`.
  Need another one? Add it to the toolkit with the app that uses it, not speculatively.
- Buttons are `rounded-full` (the primitive already does it). Sizes: xs, sm, default, lg, icon*.
- `Button` has no destructive variant. Destructive flows open
  `DestructiveActionDialog` from `@inbeat/ui/components/destructive-action-dialog`, which owns
  the confirm step (`variant="typed"` makes the user type `DELETE <name>`).
- Action menus: `Button variant="dots"` + `DropdownMenu`, everywhere. Inside an element with
  `data-row` (table rows and sidebar items have it) it reveals on row hover; elsewhere it stays
  visible.
- Icon-only buttons: always `IconButton` from `@inbeat/ui/components/icon-button`, never a bare
  `Button` with an icon. Its required `label` is both the tooltip and the `aria-label`. It works
  as a `DropdownMenuTrigger asChild` child, and with `asChild` it renders a link (`<a>`/`<Link>`), never
  `window.open`. `dots` is the only icon-only exception.
- Show/hide toggles: `IconButton label="Show filters" pressedLabel="Hide filters" pressed={isOpen}`.
  Never pick variants by hand; `pressed` owns the look (off `secondary`, on `default`) and the
  label names the next action. Menu and popover triggers are not toggles: static label, no `pressed`; `IconButton` turns
  dark by itself while its menu is open.
- Labels are short: one to three words, no ids or emails (the row already gives context).
- Lists: `DataTableShell` + `DataTable`. Empty lists: `EmptyState`, never a bare
  sentence.
- Forms: `Field` + `Label` + zod schema shared with the action. Show `result.error` inline or
  via `sonner` toast.
- Animation: `motion/react` only. Respect `prefers-reduced-motion`.
- Server Components by default; add `"use client"` only on the leaf that needs state or effects.

## Setup in an app

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@inbeat/ui/theme.css";
```

`next.config.ts`: `transpilePackages: ["@inbeat/ui"]` (ui ships source; core and next ship compiled JS).
Fonts: Geist via `next/font`, exposed as `--font-geist-sans` / `--font-geist-mono`.

## Adding or changing a primitive

Do it in `ib-toolkit/packages/ui/src/components`, add or update its story in
`packages/ui/stories` (`bun run storybook`), then `bun run sync <app-dir>`. Stories are grouped
by purpose (Actions, Forms, Display, Feedback, Navigation, Overlays, Data), render every variant
and size from a declared list, and use the neutral data in `stories/lib/fixtures.ts`, never an
app's copy or layout. Domain compositions (tied to one app's data, like a creator card) stay in the app
under `src/shared/components/blocks`; once a second app needs one, promote it here.
