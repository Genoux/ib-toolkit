import "server-only";
import { auth } from "@clerk/nextjs/server";
import { AppError } from "@inbeat/core/errors";
import { cache } from "react";
import type { SessionClaims } from "./claims";

export { readEmail, readMetadataRole, readVerifiedEmail, type SessionClaims } from "./claims";

export type Viewer<TRole extends string> = {
  userId: string;
  role: TRole | null;
  claims: NonNullable<SessionClaims>;
};

export type AuthConfig<TRole extends string> = {
  /** Pure function of the session token, so the proxy and the server agree without a DB hit. */
  resolveRole: (claims: SessionClaims) => TRole | null;
};

export function defineAuth<TRole extends string>({ resolveRole }: AuthConfig<TRole>) {
  const getViewer = cache(async (): Promise<Viewer<TRole> | null> => {
    const { userId, sessionClaims } = await auth();
    if (!userId) return null;
    const claims = sessionClaims ?? {};
    return { userId, role: resolveRole(claims), claims };
  });

  const requireViewer = async (): Promise<Viewer<TRole>> => {
    const viewer = await getViewer();
    if (!viewer) throw new AppError("auth", "No active session");
    return viewer;
  };

  const requireRole =
    <TAllowed extends TRole>(...roles: TAllowed[]) =>
    async (): Promise<Viewer<TRole> & { role: TAllowed }> => {
      const viewer = await requireViewer();
      if (!viewer.role || !(roles as TRole[]).includes(viewer.role)) {
        throw new AppError("forbidden", `Role ${viewer.role ?? "none"} not in ${roles.join(",")}`);
      }
      return viewer as Viewer<TRole> & { role: TAllowed };
    };

  return { resolveRole, getViewer, requireViewer, requireRole };
}
