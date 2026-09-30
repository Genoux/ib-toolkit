import { describe, expect, it } from "vitest";
import { parseCreateArgs } from "./create-args";

const addons = ["clerk"];

describe("parseCreateArgs", () => {
  it("reads dir, --local and --auth", () => {
    expect(parseCreateArgs(["app", "--local", "--auth", "clerk"], addons)).toEqual({
      dir: "app",
      local: true,
      auth: "clerk",
    });
  });

  it("accepts --auth=<name>", () => {
    expect(parseCreateArgs(["app", "--auth=clerk"], addons).auth).toBe("clerk");
    expect(() => parseCreateArgs(["app", "--auth=okta"], addons)).toThrow(/okta/);
  });

  it("maps --no-auth to null and a missing choice to undefined", () => {
    expect(parseCreateArgs(["app", "--no-auth"], addons).auth).toBeNull();
    expect(parseCreateArgs(["app"], addons).auth).toBeUndefined();
  });

  it.each([
    [["app", "--auth", "okta"], /okta.*clerk/],
    [["app", "--auth"], /--auth needs/],
    [["app", "--auth", "clerk", "--no-auth"], /only one/],
    [["app", "--auth", "clerk", "--auth", "clerk"], /only one/],
    [["app", "--auth=clerk", "--auth=clerk"], /only one/],
    [["app", "--no-auth", "--no-auth"], /only one/],
    [["app", "--no-auth", "--auth", "clerk"], /only one/],
    [["app", "--wat"], /--wat/],
    [["a", "b"], /one directory/],
  ])("rejects %j", (args, message) => {
    expect(() => parseCreateArgs(args, addons)).toThrow(message);
  });
});
