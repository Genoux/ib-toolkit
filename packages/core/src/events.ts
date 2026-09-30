import type { z } from "zod";
import { SIGNATURE_HEADER, signPayload } from "./signature.js";

export type EventSchemas = Record<string, z.ZodType>;

export type EventEmitterOptions<TSchemas extends EventSchemas> = {
  schemas: TSchemas;
  url: string | undefined;
  secret: string | undefined;
  source: string;
  extraHeaders?: Record<string, string>;
  /** Hands the delivery promise to the platform, e.g. `waitUntil` from `@vercel/functions`. */
  schedule?: (delivery: Promise<unknown>) => void;
  onError?: (error: unknown, event: keyof TSchemas & string) => void;
  fetchImpl?: (url: string, init: RequestInit) => Promise<Response>;
};

export type EventEnvelope<TData> = {
  event: string;
  source: string;
  occurredAt: string;
  data: TData;
};

/**
 * Typed, signed, fire-and-forget outbound events (n8n, Slack relays, other apps).
 * Payloads are validated before sending so a receiver never sees a shape the schema forbids.
 */
export function createEventEmitter<TSchemas extends EventSchemas>({
  schemas,
  url,
  secret,
  source,
  extraHeaders = {},
  schedule,
  onError,
  fetchImpl = fetch,
}: EventEmitterOptions<TSchemas>) {
  async function deliver<TEvent extends keyof TSchemas & string>(
    event: TEvent,
    data: z.input<TSchemas[TEvent]>,
  ): Promise<void> {
    if (!url || !secret) return;
    const envelope: EventEnvelope<z.output<TSchemas[TEvent]>> = {
      event,
      source,
      occurredAt: new Date().toISOString(),
      data: schemas[event].parse(data) as z.output<TSchemas[TEvent]>,
    };
    const body = JSON.stringify(envelope);
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [SIGNATURE_HEADER]: await signPayload(secret, body),
        ...extraHeaders,
      },
      body,
    });
    if (!response.ok) throw new Error(`Event ${event} rejected with ${response.status}`);
  }

  return function emit<TEvent extends keyof TSchemas & string>(
    event: TEvent,
    data: z.input<TSchemas[TEvent]>,
  ): Promise<void> {
    const delivery = deliver(event, data).catch((error) => onError?.(error, event));
    schedule?.(delivery);
    return delivery;
  };
}
