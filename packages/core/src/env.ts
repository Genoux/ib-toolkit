import { z } from "zod";

/** Comma-separated list, trimmed, lowercased, empties dropped. */
export const csv = () =>
  z.string().transform((value) =>
    value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );

export const booleanFlag = () =>
  z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((value) => value === "true" || value === "1");

export const dbEnv = {
  DATABASE_URL: z.url(),
};

export const appUrlEnv = {
  APP_URL: z
    .url()
    .transform((value) => value.replace(/\/+$/, ""))
    .optional(),
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  VERCEL_URL: z.string().min(1).optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().min(1).optional(),
};

type AppUrlEnv = {
  APP_URL?: string;
  VERCEL_ENV?: "production" | "preview" | "development";
  VERCEL_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
};

/**
 * Absolute origin for links that leave the app (emails, share links, OAuth redirects).
 * Never derived from request headers: Host / X-Forwarded-Host are client-controlled.
 */
export function resolveAppUrl(env: AppUrlEnv): string {
  if (env.APP_URL) return env.APP_URL;
  const host = env.VERCEL_ENV === "production" ? env.VERCEL_PROJECT_PRODUCTION_URL : env.VERCEL_URL;
  return host ? `https://${host}` : "http://localhost:3000";
}

export const clerkServerEnv = {
  CLERK_SECRET_KEY: z.string().startsWith("sk_"),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().startsWith("whsec_").optional(),
};

export const clerkClientEnv = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
};

export const sentryClientEnv = {
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
};

export const upstashEnv = {
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
};

export const r2Env = {
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
};

export const maintenanceEnv = {
  MAINTENANCE_MODE: booleanFlag(),
  MAINTENANCE_BYPASS_EMAILS: csv().optional().default([]),
};

export const eventsEnv = {
  EVENTS_WEBHOOK_URL: z.url().optional(),
  EVENTS_WEBHOOK_SECRET: z.string().min(32).optional(),
};
