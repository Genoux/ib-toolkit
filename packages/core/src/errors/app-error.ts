export type AppErrorKind =
  | "validation"
  | "auth"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "db_transient"
  | "db_query"
  | "timeout"
  | "external_service"
  | "unknown";

export const APP_ERROR_MESSAGES = {
  generic: "Something went wrong. Please try again or contact us.",
  auth: "Please sign in to continue.",
  forbidden: "You don't have access to this.",
  notFound: "We couldn't find what you were looking for.",
  rateLimited: "Too many attempts. Please wait a moment and try again.",
  dbTransient: "We're having trouble saving this right now. Please try again in a minute.",
  timeout: "This is taking longer than expected. Please retry.",
  validationFallback: "Some of the information provided could not be validated. Please try again.",
} as const;

export const APP_ERROR_STATUS: Record<AppErrorKind, number> = {
  validation: 400,
  auth: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  db_transient: 503,
  db_query: 500,
  timeout: 504,
  external_service: 502,
  unknown: 500,
};

const DEFAULT_SAFE_MESSAGE: Partial<Record<AppErrorKind, string>> = {
  auth: APP_ERROR_MESSAGES.auth,
  forbidden: APP_ERROR_MESSAGES.forbidden,
  not_found: APP_ERROR_MESSAGES.notFound,
  rate_limited: APP_ERROR_MESSAGES.rateLimited,
  db_transient: APP_ERROR_MESSAGES.dbTransient,
  timeout: APP_ERROR_MESSAGES.timeout,
};

export type AppErrorOptions = {
  safeMessage?: string;
  cause?: unknown;
  reportToSentry?: boolean;
  isRetryable?: boolean;
};

// Symbol.for survives duplicate copies of this package in one bundle, where instanceof would not.
const APP_ERROR_BRAND = Symbol.for("inbeat.appError");

export class AppError extends Error {
  readonly [APP_ERROR_BRAND] = true;
  readonly kind: AppErrorKind;
  readonly safeMessage: string;
  readonly reportToSentry: boolean;
  readonly isRetryable: boolean;

  constructor(kind: AppErrorKind, message: string, options: AppErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "AppError";
    this.kind = kind;
    this.safeMessage = options.safeMessage ?? DEFAULT_SAFE_MESSAGE[kind] ?? message;
    this.reportToSentry = options.reportToSentry ?? false;
    this.isRetryable = options.isRetryable ?? false;
  }
}

export function isAppError(err: unknown, kind?: AppErrorKind): err is AppError {
  return (
    err instanceof Error &&
    (err as Partial<Record<typeof APP_ERROR_BRAND, boolean>>)[APP_ERROR_BRAND] === true &&
    (kind === undefined || (err as AppError).kind === kind)
  );
}
