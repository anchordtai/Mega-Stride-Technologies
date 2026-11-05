import { createHmac, timingSafeEqual } from "node:crypto";
export function paymentMode(
  env: Record<string, string | undefined> = process.env,
): "test" | "live" | null {
  if (
    env.PAYMENTS_MODE === "test" &&
    env.PAYSTACK_SECRET_KEY?.startsWith("sk_test_")
  )
    return "test";
  if (
    env.PAYMENTS_MODE === "live" &&
    env.PAYMENTS_LIVE_APPROVED === "true" &&
    env.PAYSTACK_SECRET_KEY?.startsWith("sk_live_")
  )
    return "live";
  return null;
}
export function validPaystackSignature(
  body: string,
  signature: string | null,
  key: string,
) {
  if (!signature || !key || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  return timingSafeEqual(
    Buffer.from(signature.toLowerCase()),
    Buffer.from(createHmac("sha512", key).update(body).digest("hex")),
  );
}
export function validEmailSignature(
  body: string,
  headers: Headers,
  secret: string,
  now = Date.now(),
) {
  const id = headers.get("svix-id"),
    timestamp = headers.get("svix-timestamp"),
    signatures = headers.get("svix-signature");
  if (
    !id ||
    id.length > 200 ||
    !timestamp ||
    !/^\d{10}$/.test(timestamp) ||
    Math.abs(now / 1000 - Number(timestamp)) > 300 ||
    !signatures ||
    signatures.length > 1000 ||
    !/^whsec_[A-Za-z0-9+/=]+$/.test(secret)
  )
    return false;
  const expected = createHmac("sha256", Buffer.from(secret.slice(6), "base64"))
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  return signatures.split(" ").some((s) => {
    const [v, value] = s.split(",");
    return (
      v === "v1" &&
      !!value &&
      value.length === expected.length &&
      timingSafeEqual(Buffer.from(value), Buffer.from(expected))
    );
  });
}
export function safeCheckoutUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      u.hostname === "checkout.paystack.com" &&
      !u.username &&
      !u.password &&
      u.port === ""
    );
  } catch {
    return false;
  }
}
export function verifiedCharge(
  data: unknown,
  reference: string,
  mode: "test" | "live",
) {
  if (!data || typeof data !== "object") throw Error("Invalid verification");
  const d = data as Record<string, unknown>;
  const customer = d.customer as Record<string, unknown> | undefined;
  if (
    d.status !== "success" ||
    d.reference !== reference ||
    d.domain !== mode ||
    !Number.isSafeInteger(d.amount) ||
    Number(d.amount) <= 0 ||
    d.currency !== "NGN" ||
    (typeof d.id !== "number" && typeof d.id !== "string") ||
    !customer ||
    typeof customer.email !== "string"
  )
    throw Error("Payment is not verified");
  return {
    amount: d.amount as number,
    currency: d.currency as string,
    event: String(d.id),
    email: customer.email,
  };
}
export function validModernPaystackSignature(
  body: string,
  header: string | null,
  secret: string,
  now = Date.now(),
) {
  if (!header || header.length > 2000 || !secret.startsWith("whsec_"))
    return false;
  let timestamp: string | undefined;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const at = part.indexOf("=");
    if (at < 0) continue;
    const field = part.slice(0, at).trim(),
      value = part.slice(at + 1).trim();
    if (field === "t") {
      if (timestamp || !/^\d{10}$/.test(value)) return false;
      timestamp = value;
    }
    if (field === "v1") {
      const split = value.indexOf(":");
      if (split > 0 && value.slice(0, split).startsWith("whk_"))
        signatures.push(value.slice(split + 1));
    }
  }
  if (!timestamp || Math.abs(now / 1000 - Number(timestamp)) > 300)
    return false;
  const expected = createHmac("sha512", secret)
    .update(timestamp + "." + body)
    .digest("hex");
  return signatures.some(
    (s) =>
      /^[a-f0-9]{128}$/.test(s) &&
      timingSafeEqual(Buffer.from(s), Buffer.from(expected)),
  );
}
