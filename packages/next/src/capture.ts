import { type ClassifiedError, classifyError } from "@inbeat/core/errors";
import { createLogger } from "@inbeat/core/logger";
import * as Sentry from "@sentry/nextjs";

export type CapturedError = ClassifiedError & { errorId?: string };

const logger = createLogger();

/** Short id shown to users so support can find the Sentry event or the log line. */
export function toErrorId(eventId: string | undefined): string | undefined {
  return eventId ? `ERR_${eventId.slice(0, 8).toUpperCase()}` : undefined;
}

// Logged as well as reported: an app without a Sentry DSN would otherwise lose these errors.
export function captureAppError(
  err: unknown,
  context: { tags?: Record<string, string>; extra?: Record<string, unknown> } = {},
): CapturedError {
  const classified = classifyError(err);
  if (!classified.reportToSentry) return classified;

  const exception =
    classified.original instanceof Error
      ? classified.original
      : new Error(String(classified.original));
  const eventId = Sentry.captureException(exception, {
    tags: { ...classified.tags, ...context.tags },
    extra: context.extra,
    fingerprint: classified.fingerprint,
  });
  const errorId = toErrorId(eventId);
  logger.error("Unexpected error", exception, { errorId, ...context.tags });
  return { ...classified, errorId };
}
