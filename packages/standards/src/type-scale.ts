import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

// The type scale lives in @inbeat/ui and in the "UI" section of the standard. An app picks a
// role (text-sm, text-xs, text-base, ...) and never a size or weight of its own, so a change of
// scale happens once, in the toolkit.
// `em` sizes are relative to their parent (inline code in running text), so they follow the scale.
const OFF_SCALE = [
  { pattern: /\btext-\[[\d.]+(?:px|rem)\]/g, reason: "hand-set font size" },
  { pattern: /\bfont-\[\d+\]/g, reason: "hand-set font weight" },
  {
    pattern: /\bfont-(?:bold|extrabold|black)\b/g,
    reason: "weight outside regular, medium, semibold",
  },
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

/** `src/file.tsx:12 text-[13px] (hand-set font size)` for every class outside the type scale. */
export function typeScaleProblems(appDir: string): string[] {
  const srcDir = join(appDir, "src");
  if (!existsSync(srcDir)) return [];

  return sourceFiles(srcDir).flatMap((path) =>
    readFileSync(path, "utf8")
      .split("\n")
      .flatMap((line, index) =>
        OFF_SCALE.flatMap(({ pattern, reason }) =>
          [...line.matchAll(pattern)].map(
            ([className]) => `${relative(appDir, path)}:${index + 1} ${className} (${reason})`,
          ),
        ),
      ),
  );
}
