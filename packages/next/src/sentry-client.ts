import * as Sentry from "@sentry/nextjs";
import { type SentryInitOptions, type SentryPresetOptions, sentryServerOptions } from "./sentry.js";

export function sentryClientOptions(
  options: SentryPresetOptions & { replaysOnErrorSampleRate?: number },
): SentryInitOptions {
  return {
    ...sentryServerOptions(options),
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
        unmask: ["[data-sentry-unmask]"],
      }),
    ],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: options.replaysOnErrorSampleRate ?? 1,
  };
}
