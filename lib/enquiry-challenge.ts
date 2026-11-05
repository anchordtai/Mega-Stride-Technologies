import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
export const challengeCookie = "mega_stride_enquiry_challenge";
export function protectionMode(
  env: Record<string, string | undefined> = process.env,
) {
  return env.ENQUIRY_PROTECTION_MODE === "signed-challenge"
    ? "signed-challenge"
    : "turnstile";
}
export function clientAddress(
  headers: Headers,
  env: Record<string, string | undefined> = process.env,
) {
  return env.VERCEL
    ? headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    : "local-development";
}
function signature(payload: string, address: string, salt: string) {
  return createHmac("sha256", salt)
    .update(payload + "|" + address)
    .digest("hex");
}
export function issueChallenge(
  address: string,
  salt: string,
  now = Date.now(),
) {
  const payload = `${now}.${randomBytes(24).toString("hex")}`;
  return `${payload}.${signature(payload, address, salt)}`;
}
export function verifyChallenge(
  token: string,
  cookie: string,
  address: string,
  salt: string,
  now = Date.now(),
) {
  if (token !== cookie || token.length > 200) return false;
  const parts = token.split(".");
  if (
    parts.length !== 3 ||
    !/^\d{13}$/.test(parts[0]) ||
    !/^[a-f0-9]{48}$/.test(parts[1]) ||
    !/^[a-f0-9]{64}$/.test(parts[2])
  )
    return false;
  const age = now - Number(parts[0]);
  if (age < 1500 || age > 30 * 60 * 1000) return false;
  return timingSafeEqual(
    Buffer.from(parts[2]),
    Buffer.from(signature(parts[0] + "." + parts[1], address, salt)),
  );
}
export function permittedRequestOrigin(
  origin: string | null,
  env: Record<string, string | undefined> = process.env,
) {
  if (!origin) return false;
  const allowed = [env.SITE_URL || "http://localhost:3000"];
  if (env.VERCEL_URL && /^[a-z0-9-]+\.vercel\.app$/i.test(env.VERCEL_URL))
    allowed.push(`https://${env.VERCEL_URL}`);
  try {
    return allowed.some((v) => new URL(v).origin === new URL(origin).origin);
  } catch {
    return false;
  }
}
