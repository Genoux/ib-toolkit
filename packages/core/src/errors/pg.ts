/** SQLSTATE codes, see https://www.postgresql.org/docs/current/errcodes-appendix.html */
export const PG_CODES = {
  uniqueViolation: "23505",
  foreignKeyViolation: "23503",
  notNullViolation: "23502",
  checkViolation: "23514",
  queryCanceled: "57014",
} as const;

export const TRANSIENT_PG_CODES: ReadonlySet<string> = new Set([
  "08000", // connection_exception
  "08001", // sqlclient_unable_to_establish_sqlconnection
  "08003", // connection_does_not_exist
  "08006", // connection_failure
  "08007", // transaction_resolution_unknown
  "53300", // too_many_connections
  "57P01", // admin_shutdown
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now
  PG_CODES.queryCanceled,
]);

export type PgErrorLike = { code: string; severity?: string; message?: string };

/** Walks `cause` because Drizzle wraps driver errors in "Failed query: …". */
export function errorChain(err: unknown): unknown[] {
  const chain: unknown[] = [];
  const seen = new Set<unknown>();
  let current = err;
  while (current !== null && current !== undefined && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    current = typeof current === "object" ? (current as { cause?: unknown }).cause : undefined;
  }
  return chain;
}

export function findPgError(err: unknown): PgErrorLike | null {
  for (const link of errorChain(err)) {
    if (
      typeof link === "object" &&
      link !== null &&
      typeof (link as { code?: unknown }).code === "string" &&
      /^[0-9A-Z]{5}$/.test((link as { code: string }).code)
    ) {
      return link as PgErrorLike;
    }
  }
  return null;
}

export function hasPgCode(err: unknown, code: string): boolean {
  return findPgError(err)?.code === code;
}

export const isUniqueViolation = (err: unknown) => hasPgCode(err, PG_CODES.uniqueViolation);
export const isForeignKeyViolation = (err: unknown) => hasPgCode(err, PG_CODES.foreignKeyViolation);
