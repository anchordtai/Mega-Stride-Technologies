// Only public Academy destinations may survive account redirects. Never forward
// absolute URLs, arbitrary query strings, payment references or private lessons.
export function academyReturnPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 220) return null;
  if (value === "/academy" || value === "/academy/dashboard") return value;
  if (/^\/academy\/courses\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return value;
  if (/^\/academy\/register\?course=[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return value;
  return null;
}
export function courseRegistrationPath(slug: string) {
  return `/academy/register?course=${encodeURIComponent(slug)}`;
}
