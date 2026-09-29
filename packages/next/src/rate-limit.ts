import { AppError } from "@inbeat/core/errors";
import { type Duration, Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitPolicy = { limit: number; window: Duration };

export type RateLimitOutcome = { success: boolean; remaining: number; reset: number };

export type RateLimiter = {
  check: (key: string, policy: RateLimitPolicy) => Promise<RateLimitOutcome>;
  /** Throws `AppError("rate_limited")` so actions and routes answer 429 with safe copy. */
  enforce: (key: string, policy: RateLimitPolicy) => Promise<void>;
  backend: "upstash" | "memory";
};

export type RateLimiterOptions = {
  prefix: string;
  upstash?: { url?: string; token?: string };
  onMemoryFallback?: () => void;
};

const UNIT_MS: Record<string, number> = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };

function durationMs(window: Duration): number {
  const [amount, unit] = window.split(" ") as [string, string];
  return Number(amount) * (UNIT_MS[unit] ?? 1_000);
}

/**
 * Per-instance fixed window. Only correct on a single process (local dev, tests):
 * on Vercel every instance keeps its own counters.
 */
function memoryCheck(): RateLimiter["check"] {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return async (key, policy) => {
    const now = Date.now();
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    const bucket = buckets.get(key);
    const active =
      bucket && bucket.resetAt > now
        ? bucket
        : { count: 0, resetAt: now + durationMs(policy.window) };
    active.count++;
    buckets.set(key, active);
    return {
      success: active.count <= policy.limit,
      remaining: Math.max(0, policy.limit - active.count),
      reset: active.resetAt,
    };
  };
}

function upstashCheck(redis: Redis, prefix: string): RateLimiter["check"] {
  const limiters = new Map<string, Ratelimit>();
  return async (key, policy) => {
    const id = `${policy.limit}:${policy.window}`;
    let limiter = limiters.get(id);
    if (!limiter) {
      limiter = new Ratelimit({
        redis,
        prefix: `${prefix}:${id}`,
        limiter: Ratelimit.slidingWindow(policy.limit, policy.window),
      });
      limiters.set(id, limiter);
    }
    const { success, remaining, reset } = await limiter.limit(key);
    return { success, remaining, reset };
  };
}

export function createRateLimiter({
  prefix,
  upstash,
  onMemoryFallback,
}: RateLimiterOptions): RateLimiter {
  const hasUpstash = Boolean(upstash?.url && upstash?.token);
  if (!hasUpstash) onMemoryFallback?.();
  const check = hasUpstash
    ? upstashCheck(new Redis({ url: upstash?.url, token: upstash?.token }), prefix)
    : memoryCheck();

  return {
    backend: hasUpstash ? "upstash" : "memory",
    check,
    enforce: async (key, policy) => {
      const outcome = await check(key, policy);
      if (!outcome.success) {
        throw new AppError("rate_limited", `Rate limit hit for ${key.split(":")[0]}`);
      }
    },
  };
}
