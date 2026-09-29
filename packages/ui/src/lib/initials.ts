export function getInitials(name: string | null, fallback = "C"): string {
  if (!name) return fallback;

  const parts = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean);

  return parts.join("") || fallback;
}
