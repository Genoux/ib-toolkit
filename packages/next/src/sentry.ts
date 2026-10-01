import { isTransientUncaughtException } from "@inbeat/core/errors";
import type * as Sentry from "@sentry/nextjs";

type ErrorEvent = Sentry.ErrorEvent;
type EventHint = Sentry.EventHint;
export type SentryInitOptions = NonNullable<Parameters<typeof Sentry.init>[0]>;

export type SentryPresetOptions = {
  dsn: string | undefined;
  enabled: boolean;
  environment?: string;
  tracesSampleRate?: number;
  /** Extra drop rule, e.g. errors the app already turned into user-facing copy. */
  ignore?: (hint: EventHint) => boolean;
};

const EXTENSION_FRAME =
  /(extension:\/\/|\.safariextension|^safari-extension|^moz-extension|^chrome-extension)/;

function hasExtensionFrame(event: ErrorEvent): boolean {
  return (
    event.exception?.values?.some((value) =>
      value.stacktrace?.frames?.some((frame) => EXTENSION_FRAME.test(frame.filename ?? "")),
    ) ?? false
  );
}

function createBeforeSend(ignore?: (hint: EventHint) => boolean) {
  return (event: ErrorEvent, hint: EventHint): ErrorEvent | null => {
    if (ignore?.(hint)) return null;
    if (
      isTransientUncaughtException(
        event.exception?.values?.[0]?.mechanism?.type,
        hint.originalException,
      )
    ) {
      return null;
    }
    if (hasExtensionFrame(event)) return null;
    return event;
  };
}

/**
 * Server and edge options. Browser options live in `@inbeat/next/sentry-client`: Replay only
 * exists in the browser build of `@sentry/nextjs`, and Turbopack fails the edge bundle on it.
 */
export function sentryServerOptions({
  dsn,
  enabled,
  environment,
  tracesSampleRate = 0.1,
  ignore,
}: SentryPresetOptions) {
  return {
    dsn,
    enabled: enabled && Boolean(dsn),
    environment,
    tracesSampleRate,
    // Creator and client PII (names, emails, rates) must not leave for a third party by default.
    sendDefaultPii: false,
    enableLogs: true,
    beforeSend: createBeforeSend(ignore),
  } satisfies SentryInitOptions;
}
