import type { AppErrorKind } from "./errors/app-error.js";

export type Ok<T> = { ok: true; data: T };
export type Fail = { ok: false; error: string; code?: AppErrorKind; errorId?: string };
export type Result<T = void> = Ok<T> | Fail;

export function ok(): Ok<void>;
export function ok<T>(data: T): Ok<T>;
export function ok<T>(data?: T): Ok<T | undefined> {
  return { ok: true, data };
}

export function fail(error: string, code?: AppErrorKind, errorId?: string): Fail {
  return {
    ok: false,
    error,
    ...(code ? { code } : {}),
    ...(errorId ? { errorId } : {}),
  };
}

export function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
