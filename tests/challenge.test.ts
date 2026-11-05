import test from "node:test";
import assert from "node:assert/strict";
import {
  issueChallenge,
  verifyChallenge,
  permittedRequestOrigin,
} from "../lib/enquiry-challenge";
const salt = "synthetic-test-salt",
  now = 1793870000000;
test("signed enquiry challenge binds token to cookie, address and validity window", () => {
  const token = issueChallenge("address-a", salt, now);
  assert.equal(
    verifyChallenge(token, token, "address-a", salt, now + 2000),
    true,
  );
  for (const [cookie, address, time] of [
    ["different", "address-a", now + 2000],
    [token, "address-b", now + 2000],
    [token, "address-a", now + 100],
    [token, "address-a", now + 1900000],
  ] as const)
    assert.equal(verifyChallenge(token, cookie, address, salt, time), false);
  assert.equal(
    verifyChallenge(token + "x", token + "x", "address-a", salt, now + 2000),
    false,
  );
});
test("only canonical and current immutable deployment origins are accepted", () => {
  const env = {
    SITE_URL: "https://www.megastride.com.ng",
    VERCEL_URL: "mega-stride-tested.vercel.app",
  };
  assert.equal(
    permittedRequestOrigin("https://www.megastride.com.ng", env),
    true,
  );
  assert.equal(
    permittedRequestOrigin("https://mega-stride-tested.vercel.app", env),
    true,
  );
  assert.equal(
    permittedRequestOrigin("https://attacker.vercel.app", env),
    false,
  );
  assert.equal(permittedRequestOrigin(null, env), false);
});
