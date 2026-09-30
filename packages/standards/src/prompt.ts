import { createInterface } from "node:readline/promises";
import type { Readable, Writable } from "node:stream";

type InterfaceEvents = { on(event: "close" | "SIGINT", listener: () => void): unknown };

export class Aborted extends Error {
  constructor() {
    super("aborted");
  }
}

export async function confirm(
  question: string,
  { input, output }: { input: Readable; output: Writable },
): Promise<boolean> {
  const prompt = createInterface({ input, output });
  // readline never settles question() once closed by Ctrl-D, and Ctrl-C only pauses it.
  // The bun typings omit the EventEmitter methods of readline interfaces.
  const events = prompt as unknown as InterfaceEvents;
  const closed = new Promise<never>((_, reject) => {
    events.on("close", () => reject(new Aborted()));
    events.on("SIGINT", () => prompt.close());
  });
  try {
    const answer = await Promise.race([prompt.question(question), closed]);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    prompt.close();
    closed.catch(() => {});
  }
}
