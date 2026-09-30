export type CreateArgs = {
  dir: string | undefined;
  local: boolean;
  /** Addon name, `null` for an explicit --no-auth, `undefined` when the caller has not chosen. */
  auth: string | null | undefined;
};

export function parseCreateArgs(args: string[], addons: string[]): CreateArgs {
  let auth: CreateArgs["auth"];
  let local = false;
  const positional: string[] = [];
  const chooseAuth = (choice: string | null) => {
    if (auth !== undefined) throw new Error("pass only one of --auth <name> or --no-auth, once");
    if (choice !== null && !addons.includes(choice)) {
      throw new Error(`unknown addon "${choice}"; available: ${addons.join(", ")}`);
    }
    auth = choice;
  };
  for (let index = 0; index < args.length; index++) {
    const [flag, inlineValue] = args[index].split(/=(.*)/s);
    if (flag === "--local") local = true;
    else if (flag === "--no-auth") chooseAuth(null);
    else if (flag === "--auth") {
      const value = inlineValue ?? args[++index];
      if (!value || value.startsWith("--")) {
        throw new Error(`--auth needs an addon name (${addons.join(", ")})`);
      }
      chooseAuth(value);
    } else if (flag.startsWith("--")) throw new Error(`unknown option ${flag}`);
    else positional.push(args[index]);
  }
  if (positional.length > 1) throw new Error("create takes one directory");
  return { dir: positional[0], local, auth };
}
