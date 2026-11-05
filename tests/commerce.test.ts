import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  paymentMode,
  validPaystackSignature,
  validModernPaystackSignature,
  validEmailSignature,
  safeCheckoutUrl,
  verifiedCharge,
} from "../lib/payment-security";
import { emailContent } from "../lib/email-content";
test("payment configuration fails closed; live requires explicit approval and matching key", () => {
  assert.equal(paymentMode({}), null);
  assert.equal(
    paymentMode({
      PAYMENTS_MODE: "live",
      PAYSTACK_SECRET_KEY: "sk_live_example",
    }),
    null,
  );
  assert.equal(
    paymentMode({
      PAYMENTS_MODE: "live",
      PAYSTACK_SECRET_KEY: "sk_test_example",
      PAYMENTS_LIVE_APPROVED: "true",
    }),
    null,
  );
  assert.equal(
    paymentMode({
      PAYMENTS_MODE: "test",
      PAYSTACK_SECRET_KEY: "sk_test_example",
    }),
    "test",
  );
  assert.equal(
    paymentMode({
      PAYMENTS_MODE: "live",
      PAYSTACK_SECRET_KEY: "sk_live_example",
      PAYMENTS_LIVE_APPROVED: "true",
    }),
    "live",
  );
});
test("Paystack webhook verifies exact raw content and rejects forged or malformed signatures", () => {
  const body = '{"event":"charge.success"}',
    key = "sk_test_unit";
  const sig = createHmac("sha512", key).update(body).digest("hex");
  assert.equal(validPaystackSignature(body, sig, key), true);
  assert.equal(validPaystackSignature(body + " ", sig, key), false);
  assert.equal(validPaystackSignature(body, "00", key), false);
});
test("email webhooks enforce signature, raw body and replay time window", () => {
  const secret = "whsec_" + Buffer.from("unit-test-secret").toString("base64"),
    now = 1731705121000,
    body = '{"type":"email.delivered"}',
    id = "msg_unit",
    timestamp = String(now / 1000);
  const sig = createHmac("sha256", Buffer.from("unit-test-secret"))
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  const h = new Headers({
    "svix-id": id,
    "svix-timestamp": timestamp,
    "svix-signature": "v1," + sig,
  });
  assert.equal(validEmailSignature(body, h, secret, now), true);
  assert.equal(validEmailSignature(body + " ", h, secret, now), false);
  assert.equal(validEmailSignature(body, h, secret, now + 301000), false);
});
test("hosted checkout rejects attacker-controlled destinations", () => {
  assert.equal(safeCheckoutUrl("https://checkout.paystack.com/example"), true);
  for (const u of [
    "https://checkout.paystack.com.evil.test/x",
    "http://checkout.paystack.com/x",
    "https://user@checkout.paystack.com/x",
    "javascript:alert(1)",
  ])
    assert.equal(safeCheckoutUrl(u), false);
});
test("payment verification rejects non-success, wrong reference, mode and unsafe amount", () => {
  const d = {
    id: 100,
    status: "success",
    reference: "ref",
    domain: "test",
    amount: 20000,
    currency: "NGN",
    customer: { email: "learner@example.test" },
  };
  assert.equal(verifiedCharge(d, "ref", "test").amount, 20000);
  for (const patch of [
    { status: "pending" },
    { reference: "different" },
    { domain: "live" },
    { amount: -1 },
    { amount: 1.5 },
    { currency: "USD" },
  ])
    assert.throws(() => verifiedCharge({ ...d, ...patch }, "ref", "test"));
});
test("acknowledgements include saved reference and staff notifications omit customer requirements", () => {
  const a = emailContent("enquiry_ack", {
    reference: "MS-UNIT",
    name: "Learner",
  });
  assert.match(a.text, /MS-UNIT/);
  const staff = emailContent("staff_enquiry", {
    reference: "MS-UNIT",
    message: "sensitive-payload-unit-123",
  });
  assert.ok(!staff.text.includes("sensitive-payload-unit-123"));
  assert.throws(() => emailContent("unknown", {}));
});

test("modern Paystack signing keys require fresh timestamps and exact body", () => {
  const now = 1731705121000,
    t = String(now / 1000),
    body = '{"event":"charge.success"}',
    key = "whsec_unit";
  const sig = createHmac("sha512", key)
    .update(t + "." + body)
    .digest("hex");
  const header = `t=${t},v1=whk_unit:${sig}`;
  assert.equal(validModernPaystackSignature(body, header, key, now), true);
  assert.equal(
    validModernPaystackSignature(body + " ", header, key, now),
    false,
  );
  assert.equal(
    validModernPaystackSignature(body, header, key, now + 301000),
    false,
  );
});
