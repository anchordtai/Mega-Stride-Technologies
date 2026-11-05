import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/enquiries/route";
const payload = {
  kind: "contact",
  name: "Test Engineer",
  email: "engineer@example.test",
  country: "Nigeria",
  service: "Networking",
  message: "A synthetic test requirement.",
  consent: true,
};
function request(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/enquiries", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
test("API rejects cross-origin requests before accessing storage", async () =>
  assert.equal(
    (await POST(request(payload, "https://attacker.example"))).status,
    403,
  ));
test("API rejects malformed content and over-limit streams", async () => {
  assert.equal(
    (await POST(request({ ...payload, message: "x".repeat(25000) }))).status,
    413,
  );
  assert.equal(
    (await POST(request({ ...payload, consent: false }))).status,
    400,
  );
  assert.equal(
    (
      await POST(
        new Request("http://localhost:3000/api/enquiries", {
          method: "POST",
          headers: {
            origin: "http://localhost:3000",
            "Content-Type": "application/json",
          },
          body: "invalid",
        }),
      )
    ).status,
    400,
  );
});
test("unconfigured platform fails closed with no fake success reference", async () => {
  delete process.env.MEGA_STRIDE_SUPABASE_PROJECT_REF;
  const result = await POST(request(payload));
  assert.equal(result.status, 503);
  assert.equal("reference" in (await result.json()), false);
});
