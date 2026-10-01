import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type Requirement = { file: string; message: string; satisfiedBy: (contents: string) => boolean };

// biome.json and tsconfig.json are JSONC (comments, trailing commas), so match the quoted preset
// name instead of parsing.
const mentionsPreset = (preset: string) => (contents: string) => contents.includes(`"${preset}"`);

const REQUIREMENTS: Requirement[] = [
  {
    file: "biome.json",
    message: "biome.json must extend @inbeat/config/biome",
    satisfiedBy: mentionsPreset("@inbeat/config/biome"),
  },
  {
    file: "tsconfig.json",
    message: "tsconfig.json must extend @inbeat/config/tsconfig/nextjs.json",
    satisfiedBy: mentionsPreset("@inbeat/config/tsconfig/nextjs.json"),
  },
  {
    file: ".dependency-cruiser.cjs",
    message: ".dependency-cruiser.cjs must use @inbeat/config/dependency-cruiser",
    satisfiedBy: mentionsPreset("@inbeat/config/dependency-cruiser"),
  },
  {
    file: "vitest.config.ts",
    message: "vitest.config.ts must import from @inbeat/config/vitest",
    satisfiedBy: mentionsPreset("@inbeat/config/vitest"),
  },
];

export function foundationProblems(appDir: string): string[] {
  return REQUIREMENTS.filter(({ file, satisfiedBy }) => {
    const path = join(appDir, file);
    return !existsSync(path) || !satisfiedBy(readFileSync(path, "utf8"));
  }).map(({ message }) => message);
}
