import { normalizeEmail } from "@inbeat/core/email";

export type MaintenanceConfig = {
  enabled: boolean;
  bypassEmails: readonly string[];
};

export function isMaintenanceBlocking(config: MaintenanceConfig, email: string | null): boolean {
  if (!config.enabled) return false;
  if (!email) return true;
  const normalized = normalizeEmail(email);
  return !config.bypassEmails.some((bypass) => normalizeEmail(bypass) === normalized);
}
