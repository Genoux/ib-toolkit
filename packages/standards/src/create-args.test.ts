import { describe, expect, it } from "vitest";
import { parseCreateArgs } from "./create-args";

describe("parseCreateArgs", () => {
  it("reads the directory and --local", () => {
    expect(parseCreateArgs(["app", "--local"])).toEqual({ dir: "app", local: true });
    expect(parseCreateArgs(["app"])).toEqual({ dir: "app", local: false });
    expect(parseCreateArgs([])).toEqual({ dir: undefined, local: false });
  });

  it.each([
    [["app", "--local=yes"], /--local=yes/],
    [["app", "--wat"], /--wat/],
    [["a", "b"], /one directory/],
  ])("rejects %j", (args, message) => {
    expect(() => parseCreateArgs(args)).toThrow(message);
  });
});
