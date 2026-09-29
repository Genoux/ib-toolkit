import { APP_ERROR_MESSAGES, type AppErrorKind, isAppError } from "./app-error";
import { errorChain, findPgError, PG_CODES, type PgErrorLike, TRANSIENT_PG_CODES } from "./pg";

export type ClassifiedError = {
  kind: AppErrorKind;
  safeMessage: string;
  reportToSentry: boolean;
  isRetryable: boolean;
  fingerprint?: string[];
  tags: Record<string, string>;
  original: unknown;
};

export const TRANSIENT_MESSAGE_PATTERNS: readonly RegExp[] = [
  /control plane request failed/i,
  /terminating connection due to administrator command/i,
  /connection terminated/i,
  /connection reset/i,
  /connection refused/i,
  /connection closed/i,
  /socket hang up/i,
  /econnreset/i,
  /econnrefused/i,
  /etimedout/i,
  /timeout exceeded/i,
  /too many connections/i,
  /cannot connect now/i,
  /server closed the connection unexpectedly/i,
];

const TIMEOUT_PATTERN = /timeout|timed out|deadline exceeded/i;

type ZodErrorLike = { name: "ZodError"; issues: { message: string }[] };

// Shape check, not instanceof: Zod 4's `new ZodError(issues)` is not `instanceof Error`
// (only errors thrown by `.parse()` are), and apps may bundle a different zod copy.
function isZodError(err: unknown): err is ZodErrorLike {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === "ZodError" &&
    Array.isArray((err as { issues?: unknown }).issues)
  );
}

function messagesOf(err: unknown): string[] {
  return errorChain(err)
    .filter((link): link is Error => link instanceof Error)
    .map((link) => link.message);
}

function fingerprintFor(kind: AppErrorKind): string[] | undefined {
  if (kind === "db_transient" || kind === "timeout") return ["db-transient", kind];
  if (kind === "db_query") return ["db-query"];
  return undefined;
}

function tagsFor(kind: AppErrorKind, pg: PgErrorLike | null): Record<string, string> {
  return {
    "error.kind": kind,
    ...(pg ? { "db.code": pg.code } : {}),
  };
}

function build(
  kind: AppErrorKind,
  err: unknown,
  pg: PgErrorLike | null,
  overrides: Partial<ClassifiedError> & Pick<ClassifiedError, "safeMessage">,
): ClassifiedError {
  const reportToSentry = overrides.reportToSentry ?? true;
  return {
    kind,
    isRetryable: false,
    reportToSentry,
    fingerprint: reportToSentry ? fingerprintFor(kind) : undefined,
    tags: tagsFor(kind, pg),
    original: err,
    ...overrides,
  };
}

/** Maps any thrown value to safe user copy, Sentry metadata and a retry decision. */
export function classifyError(err: unknown): ClassifiedError {
  if (isAppError(err)) {
    return build(err.kind, err, null, {
      safeMessage: err.safeMessage,
      reportToSentry: err.reportToSentry,
      isRetryable: err.isRetryable,
    });
  }

  if (isZodError(err)) {
    return build("validation", err, null, {
      safeMessage: err.issues[0]?.message ?? APP_ERROR_MESSAGES.validationFallback,
      reportToSentry: false,
    });
  }

  const pg = findPgError(err);

  if (pg && TRANSIENT_PG_CODES.has(pg.code)) {
    const kind = pg.code === PG_CODES.queryCanceled ? "timeout" : "db_transient";
    return build(kind, err, pg, {
      safeMessage: kind === "timeout" ? APP_ERROR_MESSAGES.timeout : APP_ERROR_MESSAGES.dbTransient,
      isRetryable: true,
    });
  }

  const messages = messagesOf(err);

  if (messages.some((message) => TRANSIENT_MESSAGE_PATTERNS.some((p) => p.test(message)))) {
    return build("db_transient", err, pg, {
      safeMessage: APP_ERROR_MESSAGES.dbTransient,
      isRetryable: true,
    });
  }

  if (messages.some((message) => TIMEOUT_PATTERN.test(message))) {
    return build("timeout", err, pg, {
      safeMessage: APP_ERROR_MESSAGES.timeout,
      isRetryable: true,
    });
  }

  if (pg || messages.some((message) => message.startsWith("Failed query:"))) {
    return build("db_query", err, pg, { safeMessage: APP_ERROR_MESSAGES.generic });
  }

  return build("unknown", err, pg, { safeMessage: APP_ERROR_MESSAGES.generic });
}

export function getSafeErrorMessage(err: unknown): string {
  return classifyError(err).safeMessage;
}

/**
 * Neon's 57P01 admin_shutdown arrives on the WebSocket after the query already resolved,
 * so it escapes every try/catch and lands in Node's uncaughtException handler.
 * The mechanism is matched by suffix: Sentry 10 reports "auto.node.onuncaughtexception",
 * older SDKs a bare "onuncaughtexception".
 */
export function isTransientUncaughtException(
  mechanismType: string | undefined,
  err: unknown,
): boolean {
  return (
    Boolean(mechanismType?.endsWith("onuncaughtexception")) &&
    err instanceof Error &&
    TRANSIENT_MESSAGE_PATTERNS.some((pattern) => pattern.test(err.message))
  );
}

export async function withTransientRetry<T>(
  fn: () => Promise<T>,
  { retries = 2, delayMs = 250 }: { retries?: number; delayMs?: number } = {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !classifyError(err).isRetryable) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
}
