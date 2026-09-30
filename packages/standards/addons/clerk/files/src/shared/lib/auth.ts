import "server-only";
import { defineAuth } from "@inbeat/next/auth";
import { env } from "@/shared/config/env";
import { resolveRoleFromDomains } from "./roles";

export const { getViewer, requireViewer, requireRole } = defineAuth({
  resolveRole: (claims) => resolveRoleFromDomains(claims, env.ADMIN_EMAIL_DOMAINS),
});

export const requireAdmin = requireRole("admin");
