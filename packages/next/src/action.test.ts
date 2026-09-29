import { AppError } from "@inbeat/core/errors";
import { ok } from "@inbeat/core/result";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const revalidatePath = vi.fn();
const captureException = vi.fn(() => "abcdef1234567890");

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({
  unstable_rethrow: (err: unknown) => {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
  },
}));
vi.mock("@sentry/nextjs", () => ({ captureException }));

const { action } = await import("./action");
const { route } = await import("./route");

const schema = z.object({ name: z.string().min(1, "Name is required") });

describe("action", () => {
  beforeEach(() => {
    revalidatePath.mockClear();
    captureException.mockClear();
  });

  const create = action({
    name: "createThing",
    schema,
    authorize: async () => ({ id: "u1" }),
    run: async (input, viewer) => ok({ name: input.name, by: viewer.id }),
    revalidate: () => ["/things"],
  });

  it("runs and revalidates on success", async () => {
    expect(await create({ name: "a" })).toEqual({ ok: true, data: { name: "a", by: "u1" } });
    expect(revalidatePath).toHaveBeenCalledWith("/things");
  });

  it("returns validation copy without reporting", async () => {
    expect(await create({ name: "" })).toEqual({
      ok: false,
      error: "Name is required",
      code: "validation",
    });
    expect(captureException).not.toHaveBeenCalled();
  });

  it("denies before validating input", async () => {
    const denied = action({
      name: "denied",
      schema,
      authorize: async () => {
        throw new AppError("forbidden", "nope");
      },
      run: async () => ok(),
    });
    expect(await denied({ name: "" })).toMatchObject({ ok: false, code: "forbidden" });
  });

  it("hides unexpected errors behind safe copy and an error id", async () => {
    const broken = action({
      name: "broken",
      schema,
      authorize: async () => null,
      run: async () => {
        throw new Error("secret connection string leaked");
      },
    });
    const result = await broken({ name: "a" });
    expect(result).toEqual({
      ok: false,
      error: "Something went wrong. Please try again or contact us.",
      code: "unknown",
      errorId: "ERR_ABCDEF12",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("logs unexpected errors so they are visible without Sentry", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = action({
      name: "broken",
      schema,
      authorize: async () => null,
      run: async () => {
        throw new Error("database unreachable");
      },
    });
    await broken({ name: "a" });
    await create({ name: "" });

    expect(consoleError).toHaveBeenCalledTimes(1);
    const [line] = consoleError.mock.calls[0] ?? [];
    expect(JSON.parse(String(line))).toMatchObject({
      level: "error",
      errorId: "ERR_ABCDEF12",
      action: "broken",
      error: { message: "database unreachable" },
    });
    consoleError.mockRestore();
  });

  it("lets Next redirects through", async () => {
    const redirecting = action({
      name: "redirecting",
      schema,
      authorize: async () => null,
      run: async () => {
        throw new Error("NEXT_REDIRECT");
      },
    });
    await expect(redirecting({ name: "a" })).rejects.toThrow("NEXT_REDIRECT");
  });
});

describe("route", () => {
  const handler = route({
    name: "things.list",
    authorize: async () => ({ id: "u1" }),
    query: z.object({ page: z.coerce.number().int().min(1) }),
    handler: async ({ query, viewer }) => ({ page: query.page, viewer: viewer.id }),
  });
  const context = { params: Promise.resolve({}) };

  it("parses the query and returns JSON", async () => {
    const response = await handler(new Request("https://x.test/api?page=2"), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ page: 2, viewer: "u1" });
  });

  it("maps error kinds to HTTP statuses", async () => {
    const response = await handler(new Request("https://x.test/api?page=0"), context);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "validation" });

    const unauthenticated = route({
      name: "private",
      authorize: async () => {
        throw new AppError("auth", "no session");
      },
      handler: async () => ({}),
    });
    const denied = await unauthenticated(new Request("https://x.test/api"), context);
    expect(denied.status).toBe(401);
  });

  it("rejects malformed JSON bodies as validation errors", async () => {
    const post = route({
      name: "post",
      authorize: async () => null,
      body: z.object({ a: z.string() }),
      handler: async ({ body }) => body,
    });
    const response = await post(
      new Request("https://x.test/api", { method: "POST", body: "{nope" }),
      context,
    );
    expect(response.status).toBe(400);
  });
});
