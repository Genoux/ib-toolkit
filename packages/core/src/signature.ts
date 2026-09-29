export const SIGNATURE_HEADER = "x-inbeat-signature";

const DEFAULT_TOLERANCE_SECONDS = 300;
const encoder = new TextEncoder();

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Stripe-style `t=<unix>,v1=<hex>` over `${t}.${body}`. The timestamp is signed so a captured
 * request can't be replayed outside the tolerance window.
 */
export async function signPayload(
  secret: string,
  body: string,
  now: number = Date.now(),
): Promise<string> {
  const timestamp = Math.floor(now / 1000);
  return `t=${timestamp},v1=${await hmacHex(secret, `${timestamp}.${body}`)}`;
}

export async function verifyPayload(
  secret: string,
  body: string,
  header: string | null | undefined,
  { toleranceSeconds = DEFAULT_TOLERANCE_SECONDS, now = Date.now() } = {},
): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((part) => part.split("=", 2) as [string, string]),
  );
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || !parts.v1) return false;
  if (Math.abs(Math.floor(now / 1000) - timestamp) > toleranceSeconds) return false;
  return timingSafeEqual(parts.v1, await hmacHex(secret, `${timestamp}.${body}`));
}
