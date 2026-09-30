export type CreateArgs = { dir: string | undefined; local: boolean };

export function parseCreateArgs(args: string[]): CreateArgs {
  const flags = args.filter((arg) => arg.startsWith("--"));
  const unknown = flags.filter((flag) => flag !== "--local");
  if (unknown.length > 0) throw new Error(`unknown option ${unknown.join(", ")}`);
  const positional = args.filter((arg) => !arg.startsWith("--"));
  if (positional.length > 1) throw new Error("create takes one directory");
  return { dir: positional[0], local: flags.includes("--local") };
}
