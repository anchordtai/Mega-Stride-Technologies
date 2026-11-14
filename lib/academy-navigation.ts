// Only known local workspaces and public course destinations survive redirects. Never forward
// absolute URLs, arbitrary query strings, payment references or private lessons.
export function academyReturnPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 220) return null;
  if (value === "/business-desk" || value === "/client-portal") return value;
  if (value === "/academy" || value === "/academy/dashboard") return value;
  if (/^\/academy\/courses\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return value;
  if (/^\/academy\/register\?course=[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return value;
  return null;
}
export function courseRegistrationPath(slug: string) {
  return `/academy/register?course=${encodeURIComponent(slug)}`;
}
