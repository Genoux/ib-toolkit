import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { Aborted, confirm } from "./prompt";

function ask(input: PassThrough): Promise<boolean> {
  return confirm("Proceed? ", { input, output: new PassThrough() });
}

describe("confirm", () => {
  it.each([
    ["y\n", true],
    ["YES\n", true],
    ["n\n", false],
    ["\n", false],
  ])("answers %j with %s", async (typed, expected) => {
    const input = new PassThrough();
    const answer = ask(input);
    input.write(typed);
    await expect(answer).resolves.toBe(expected);
  });

  it("rejects with Aborted when the input ends before an answer", async () => {
    const input = new PassThrough();
    const answer = ask(input);
    input.end();
    await expect(answer).rejects.toBeInstanceOf(Aborted);
  });
});
