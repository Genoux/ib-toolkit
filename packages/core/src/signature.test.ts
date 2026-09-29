import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createEventEmitter } from "./events";
import { SIGNATURE_HEADER, signPayload, verifyPayload } from "./signature";

const secret = "s".repeat(32);

describe("signPayload / verifyPayload", () => {
  it("round-trips", async () => {
    const header = await signPayload(secret, '{"a":1}');
    expect(await verifyPayload(secret, '{"a":1}', header)).toBe(true);
  });

  it("rejects tampered bodies, wrong secrets and missing headers", async () => {
    const header = await signPayload(secret, '{"a":1}');
    expect(await verifyPayload(secret, '{"a":2}', header)).toBe(false);
    expect(await verifyPayload("x".repeat(32), '{"a":1}', header)).toBe(false);
    expect(await verifyPayload(secret, '{"a":1}', null)).toBe(false);
  });

  it("rejects replays outside the tolerance window", async () => {
    const past = Date.now() - 10 * 60 * 1000;
    const header = await signPayload(secret, "{}", past);
    expect(await verifyPayload(secret, "{}", header)).toBe(false);
  });
});

describe("createEventEmitter", () => {
  const schemas = { "creator.joined": z.object({ creatorId: z.uuid() }) };

  it("validates, signs and posts the envelope", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }));
    const emit = createEventEmitter({
      schemas,
      url: "https://hooks.example.com",
      secret,
      source: "test",
      fetchImpl,
    });
    const creatorId = crypto.randomUUID();
    await emit("creator.joined", { creatorId });

    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    const body = init.body as string;
    expect(JSON.parse(body)).toMatchObject({ event: "creator.joined", data: { creatorId } });
    expect(await verifyPayload(secret, body, headers[SIGNATURE_HEADER])).toBe(true);
  });

  it("is a no-op without configuration and reports failures instead of throwing", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 500 }));
    const onError = vi.fn();
    await createEventEmitter({ schemas, url: undefined, secret, source: "t", fetchImpl })(
      "creator.joined",
      { creatorId: crypto.randomUUID() },
    );
    expect(fetchImpl).not.toHaveBeenCalled();

    await createEventEmitter({
      schemas,
      url: "https://x.test",
      secret,
      source: "t",
      fetchImpl,
      onError,
    })("creator.joined", { creatorId: "not-a-uuid" });
    expect(onError).toHaveBeenCalledOnce();
  });
});
