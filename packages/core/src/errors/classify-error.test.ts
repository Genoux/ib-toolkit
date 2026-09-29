import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError, isAppError } from "./app-error";
import { classifyError, isTransientUncaughtException, withTransientRetry } from "./classify-error";
import { isUniqueViolation } from "./pg";

const pgError = (code: string) => Object.assign(new Error("pg"), { code, severity: "ERROR" });
const drizzleError = (cause: unknown) => new Error("Failed query: select 1", { cause });

describe("classifyError", () => {
  it("keeps AppError decisions and default copy", () => {
    const result = classifyError(new AppError("forbidden", "not staff"));
    expect(result).toMatchObject({
      kind: "forbidden",
      safeMessage: "You don't have access to this.",
      reportToSentry: false,
      isRetryable: false,
    });
  });

  it("surfaces the first zod issue", () => {
    const parsed = z
      .object({ name: z.string().min(1, "Name is required") })
      .safeParse({ name: "" });
    expect(classifyError(parsed.error)).toMatchObject({
      kind: "validation",
      safeMessage: "Name is required",
      reportToSentry: false,
    });
  });

  it("surfaces the first issue of a hand-built ZodError", () => {
    const err = new z.ZodError([{ code: "custom", message: "Name is required", path: ["name"] }]);
    expect(classifyError(err)).toMatchObject({
      kind: "validation",
      safeMessage: "Name is required",
    });
  });

  it("treats Neon admin shutdown under a Drizzle wrapper as transient", () => {
    const result = classifyError(drizzleError(pgError("57P01")));
    expect(result).toMatchObject({ kind: "db_transient", isRetryable: true, reportToSentry: true });
    expect(result.tags["db.code"]).toBe("57P01");
  });

  it("maps query_canceled to timeout", () => {
    expect(classifyError(drizzleError(pgError("57014"))).kind).toBe("timeout");
  });

  it("reports constraint failures as db_query without leaking SQL", () => {
    const result = classifyError(drizzleError(pgError("23505")));
    expect(result.kind).toBe("db_query");
    expect(result.safeMessage).not.toContain("select");
  });

  it("detects transient messages anywhere in the cause chain", () => {
    const err = new Error("outer", { cause: new Error("socket hang up") });
    expect(classifyError(err).kind).toBe("db_transient");
  });

  it("never trusts a plain Error message as an auth decision", () => {
    expect(classifyError(new Error("Forbidden")).kind).toBe("unknown");
  });

  it("handles non-Error throws", () => {
    expect(classifyError("boom")).toMatchObject({ kind: "unknown", reportToSentry: true });
  });
});

describe("helpers", () => {
  it("brands AppError so duplicate package copies still match", () => {
    const foreign = Object.assign(new Error("x"), { [Symbol.for("inbeat.appError")]: true });
    expect(isAppError(foreign)).toBe(true);
    expect(isAppError(new Error("x"))).toBe(false);
  });

  it("finds unique violations through the chain", () => {
    expect(isUniqueViolation(drizzleError(pgError("23505")))).toBe(true);
    expect(isUniqueViolation(new Error("nope"))).toBe(false);
  });

  it("recognises Neon's uncaught shutdown noise", () => {
    const err = new Error("terminating connection due to administrator command");
    expect(isTransientUncaughtException("auto.node.onuncaughtexception", err)).toBe(true);
    expect(isTransientUncaughtException("generic", err)).toBe(false);
  });

  it("retries only retryable failures", async () => {
    let calls = 0;
    const value = await withTransientRetry(
      async () => {
        calls++;
        if (calls < 2) throw new Error("ECONNRESET");
        return "done";
      },
      { delayMs: 0 },
    );
    expect(value).toBe("done");

    let permanentCalls = 0;
    await expect(
      withTransientRetry(
        async () => {
          permanentCalls++;
          throw new AppError("validation", "bad");
        },
        { delayMs: 0 },
      ),
    ).rejects.toThrow("bad");
    expect(permanentCalls).toBe(1);
  });
});
