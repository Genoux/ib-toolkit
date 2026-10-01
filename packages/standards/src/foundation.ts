import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type Requirement = {
  files: string[];
  message: string;
  satisfiedBy: (contents: string) => boolean;
};

// biome.jsonc and tsconfig.json are JSONC (comments, trailing commas), so match the quoted preset
// name instead of parsing.
const mentionsPreset = (preset: string) => (contents: string) => contents.includes(`"${preset}"`);

const REQUIREMENTS: Requirement[] = [
  {
    files: ["biome.json", "biome.jsonc"],
    message: "biome.json (or biome.jsonc) must extend @inbeat/config/biome",
    satisfiedBy: mentionsPreset("@inbeat/config/biome"),
  },
  {
    files: ["tsconfig.json"],
    message: "tsconfig.json must extend @inbeat/config/tsconfig/nextjs.json",
    satisfiedBy: mentionsPreset("@inbeat/config/tsconfig/nextjs.json"),
  },
  {
    files: [".dependency-cruiser.cjs"],
    message: ".dependency-cruiser.cjs must use @inbeat/config/dependency-cruiser",
    satisfiedBy: mentionsPreset("@inbeat/config/dependency-cruiser"),
  },
  {
    files: ["vitest.config.ts"],
    message: "vitest.config.ts must import from @inbeat/config/vitest",
    satisfiedBy: mentionsPreset("@inbeat/config/vitest"),
  },
];

export function foundationProblems(appDir: string): string[] {
  return REQUIREMENTS.filter(({ files, satisfiedBy }) => {
    const path = files.map((file) => join(appDir, file)).find(existsSync);
    return !path || !satisfiedBy(readFileSync(path, "utf8"));
  }).map(({ message }) => message);
}
