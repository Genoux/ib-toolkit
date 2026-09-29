import "server-only";
import { verifyWebhook, type WebhookEvent } from "@clerk/nextjs/webhooks";
import { captureAppError } from "./capture";

// Clerk types some events as one member with a union `type` (`"user.created" | "user.updated"`),
// which `Extract<WebhookEvent, { type: TType }>` collapses to never.
type EventOf<TType extends WebhookEvent["type"]> = WebhookEvent extends infer TEvent
  ? TEvent extends { type: infer TUnion }
    ? TType extends TUnion
      ? TEvent & { type: TType }
      : never
    : never
  : never;

export type ClerkWebhookHandlers = {
  [TType in WebhookEvent["type"]]?: (event: EventOf<TType>) => Promise<void>;
};

/**
 * Returns 400 only when the signature is invalid. Processing failures return 500 so Svix
 * retries them instead of silently dropping the event.
 */
export function createClerkWebhookHandler(
  handlers: ClerkWebhookHandlers,
  options: { signingSecret?: string } = {},
) {
  return async function POST(request: Request): Promise<Response> {
    let event: WebhookEvent;
    try {
      event = await verifyWebhook(request as Parameters<typeof verifyWebhook>[0], options);
    } catch {
      return new Response("Invalid signature", { status: 400 });
    }

    const handler = handlers[event.type] as ((event: WebhookEvent) => Promise<void>) | undefined;
    if (!handler) return new Response(null, { status: 204 });

    try {
      await handler(event);
      return new Response(null, { status: 204 });
    } catch (err) {
      captureAppError(err, { tags: { webhook: `clerk.${event.type}` } });
      return new Response("Processing failed", { status: 500 });
    }
  };
}
