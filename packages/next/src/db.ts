import "server-only";
import { neonConfig, Pool, type PoolConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";

export type CreateDbOptions<TSchema extends Record<string, unknown>> = {
  url: string;
  schema: TSchema;
  /** Stable key so dev hot reloads reuse one pool instead of leaking connections. */
  globalKey: string;
  pool?: Omit<PoolConfig, "connectionString">;
  webSocketConstructor?: typeof neonConfig.webSocketConstructor;
  production?: boolean;
};

export function createDb<TSchema extends Record<string, unknown>>({
  url,
  schema,
  globalKey,
  pool: poolOptions,
  webSocketConstructor,
  // biome-ignore lint/style/noProcessEnv: NODE_ENV is inlined by the bundler, not app config
  production = process.env.NODE_ENV === "production",
}: CreateDbOptions<TSchema>): { db: NeonDatabase<TSchema>; pool: Pool } {
  if (webSocketConstructor) neonConfig.webSocketConstructor = webSocketConstructor;
  // Sends the password with the startup message, saving a round trip per new connection.
  neonConfig.pipelineConnect = "password";

  const store = globalThis as unknown as Record<string, Pool | undefined>;
  const pool =
    (!production && store[globalKey]) ||
    new Pool({ connectionString: url, max: 10, idleTimeoutMillis: 30_000, ...poolOptions });
  if (!production) store[globalKey] = pool;

  return { db: drizzle(pool, { schema }), pool };
}

export type Db<TSchema extends Record<string, unknown>> = NeonDatabase<TSchema>;
export type DbTransaction<TSchema extends Record<string, unknown>> = Parameters<
  Parameters<NeonDatabase<TSchema>["transaction"]>[0]
>[0];
