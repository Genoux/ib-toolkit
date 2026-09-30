import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

function put(root: string, file: string, contents: string): void {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), contents);
}

export function fixtureTemplate(): string {
  const template = mkdtempSync(join(tmpdir(), "ib-fx-template-"));
  put(template, "src/app/layout.tsx", "base layout");
  put(template, "src/app/page.tsx", "base page");
  put(template, "_gitignore", "node_modules");
  put(template, ".env.example", "APP_URL=\n");
  put(
    template,
    "package.json",
    JSON.stringify({
      name: "@inbeat/template",
      dependencies: { "@inbeat/core": "workspace:^", next: "16.0.0" },
      devDependencies: { "@inbeat/standards": "workspace:^" },
    }),
  );
  return template;
}

export function fixtureAddons(): string {
  const addons = mkdtempSync(join(tmpdir(), "ib-fx-addons-"));
  put(addons, "demo/files/src/app/layout.tsx", "demo layout");
  put(addons, "demo/files/src/app/demo/page.tsx", "demo page");
  put(addons, "demo/files/.env.example", "APP_URL=\nDEMO_KEY=\n");
  put(
    addons,
    "demo/addon.json",
    JSON.stringify({
      dependencies: { "demo-sdk": "^1.0.0" },
      nextSteps: ["fill the demo keys in .env.local"],
    }),
  );
  return addons;
}
