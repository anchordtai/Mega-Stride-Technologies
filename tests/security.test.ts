import test from "node:test";
import assert from "node:assert/strict";
import { databaseConfig, intakeReady } from "../lib/supabase/config";
import { intakeSchema, allowedOrigin } from "../lib/intake";
import { quotationTotal } from "../lib/quotation";
const ref = "okknsxrhbiiunjlaitcy";
const env = {
  MEGA_STRIDE_SUPABASE_PROJECT_REF: ref,
  SUPABASE_URL: `https://${ref}.supabase.co`,
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};
test("database requires explicit complete dedicated configuration", () => {
  assert.throws(() => databaseConfig({}));
  assert.throws(() =>
    databaseConfig({ ...env, SUPABASE_URL: "https://different.supabase.co" }),
  );
  assert.equal(databaseConfig(env).ref, ref);
});
test("known unrelated application refs cannot be configured", () => {
  for (const id of [
    "yaicqepqhpskcoqcvoqf",
    "vlksqjwupktmvypfmfur",
    "kjefreqibschtfdwyyfu",
  ])
    assert.throws(() =>
      databaseConfig({
        ...env,
        MEGA_STRIDE_SUPABASE_PROJECT_REF: id,
        SUPABASE_URL: `https://${id}.supabase.co`,
      }),
    );
});
test("a service secret cannot be used as a publishable key", () =>
  assert.throws(() =>
    databaseConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: "sb_secret_no" }),
  ));
test("request origin must match the configured origin exactly", () => {
  assert.equal(
    allowedOrigin(
      "https://www.megastride.com.ng",
      "https://www.megastride.com.ng",
    ),
    true,
  );
  for (const origin of [
    null,
    "null",
    "https://www.megastride.com.ng.attacker.example",
    "http://www.megastride.com.ng",
  ])
    assert.equal(allowedOrigin(origin, "https://www.megastride.com.ng"), false);
});
const enquiry = {
  kind: "contact",
  name: "Test Engineer",
  email: "engineer@example.test",
  country: "Nigeria",
  service: "Networking",
  message: "A synthetic test requirement.",
  consent: true,
};
test("intake rejects invalid addresses, missing consent, oversized data and unexpected keys", () => {
  assert.equal(intakeSchema.safeParse(enquiry).success, true);
  for (const data of [
    { ...enquiry, email: "invalid" },
    { ...enquiry, consent: false },
    { ...enquiry, message: "x".repeat(5001) },
    { ...enquiry, role: "admin" },
  ])
    assert.equal(intakeSchema.safeParse(data).success, false);
});
test("trade requests require a product, quantity and destination", () => {
  assert.equal(
    intakeSchema.safeParse({ ...enquiry, kind: "trade" }).success,
    false,
  );
  assert.equal(
    intakeSchema.safeParse({
      ...enquiry,
      kind: "trade",
      product: "Network switches",
      quantity: "2",
      destination: "Abuja",
    }).success,
    true,
  );
});
test("quotations calculate integer minor-unit totals and reject unsafe/negative values", () => {
  assert.equal(
    quotationTotal([
      { description: "Test service", quantity: 3, unit_minor: 12345 },
    ]).total,
    37035,
  );
  for (const items of [
    [{ description: "Test", quantity: 1, unit_minor: -1 }],
    [{ description: "Test", quantity: 1.1, unit_minor: 100 }],
    [],
    [{ description: "Test", quantity: 100001, unit_minor: 100 }],
  ])
    assert.throws(() => quotationTotal(items));
});

test("private intake remains disabled until server and production security credentials are configured", () => {
  assert.equal(intakeReady(env), false);
  assert.equal(
    intakeReady({
      ...env,
      SUPABASE_SERVICE_ROLE_KEY: "test-server-key",
      NODE_ENV: "development",
    }),
    true,
  );
  assert.equal(
    intakeReady({
      ...env,
      SUPABASE_SERVICE_ROLE_KEY: "test-server-key",
      NODE_ENV: "production",
    }),
    false,
  );
});
