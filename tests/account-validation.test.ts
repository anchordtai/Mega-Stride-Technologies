import test from "node:test";
import assert from "node:assert/strict";
import { loginCredentials, registrationCredentials } from "../lib/account-validation";

test("sign-in accepts existing credentials independently of the new-password policy", () => {
  const credentials = { email: "owner@example.com", password: "older-pass" };
  assert.equal(loginCredentials.safeParse(credentials).success, true);
  assert.equal(registrationCredentials.safeParse(credentials).success, false);
  assert.equal(registrationCredentials.safeParse({ ...credentials, password: "new-password-123" }).success, true);
  assert.equal(loginCredentials.safeParse({ ...credentials, password: "" }).success, false);
  assert.equal(loginCredentials.safeParse({ ...credentials, email: "invalid" }).success, false);
});
