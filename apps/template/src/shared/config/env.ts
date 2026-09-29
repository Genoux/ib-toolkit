import { appUrlEnv, clerkClientEnv, clerkServerEnv, csv, sentryClientEnv } from "@inbeat/core/env";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    ...appUrlEnv,
    ...clerkServerEnv,
    ADMIN_EMAIL_DOMAINS: csv()
      .transform((domains) => domains.map((domain) => domain.replace(/^@/, "")))
      .refine((domains) => domains.length > 0, "ADMIN_EMAIL_DOMAINS must list at least one domain"),
  },
  client: {
    ...clerkClientEnv,
    ...sentryClientEnv,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().optional(),
    NEXT_PUBLIC_VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
});
