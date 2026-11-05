import { NextResponse, after } from "next/server";
import { deliverNotifications } from "@/lib/notifications";
import { createHash } from "node:crypto";
import { intakeSchema } from "@/lib/intake";
import { intakeDatabase } from "@/lib/supabase/server";
import { databaseReady } from "@/lib/supabase/config";
import { cookies } from "next/headers";
import {
  challengeCookie,
  clientAddress,
  permittedRequestOrigin,
  protectionMode,
  verifyChallenge,
} from "@/lib/enquiry-challenge";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!permittedRequestOrigin(request.headers.get("origin")))
    return NextResponse.json(
      { error: "This request could not be accepted." },
      { status: 403 },
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return NextResponse.json({ error: "Use JSON." }, { status: 415 });
  const reader = request.body?.getReader();
  if (!reader)
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 20000) {
      await reader.cancel();
      return NextResponse.json(
        { error: "Please shorten your enquiry." },
        { status: 413 },
      );
    }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = intakeSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Please check the form." },
      { status: 400 },
    );
  const v = parsed.data;
  if (v.website)
    return NextResponse.json(
      { error: "This request could not be accepted." },
      { status: 400 },
    );
  if (!databaseReady())
    return NextResponse.json(
      {
        error:
          "Online submissions are temporarily unavailable. Please email info@megastride.com.ng.",
      },
      { status: 503 },
    );
  try {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    const mode = protectionMode();
    const address = clientAddress(request.headers);
    const jar = await cookies();
    if (mode === "signed-challenge") {
      if (
        !process.env.RATE_LIMIT_SALT ||
        !verifyChallenge(
          v.challengeToken,
          jar.get(challengeCookie)?.value || "",
          address,
          process.env.RATE_LIMIT_SALT,
        )
      )
        return NextResponse.json(
          { error: "Please refresh the security check and try again." },
          { status: 400 },
        );
    }
    if (
      process.env.NODE_ENV === "production" &&
      (!process.env.RATE_LIMIT_SALT || (mode !== "signed-challenge" && !secret))
    )
      return NextResponse.json(
        { error: "Online submissions are temporarily unavailable." },
        { status: 503 },
      );
    if (mode === "turnstile" && secret) {
      const check = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: new URLSearchParams({ secret, response: v.turnstileToken }),
          signal: AbortSignal.timeout(10000),
        },
      );
      const result = await check.json();
      if (
        !result.success ||
        result.hostname !== new URL(process.env.SITE_URL!).hostname
      )
        return NextResponse.json(
          { error: "Please complete the security check again." },
          { status: 400 },
        );
    }
    const rateKey = createHash("sha256")
      .update(`${process.env.RATE_LIMIT_SALT || "local-only"}:${address}`)
      .digest("hex");
    const { website, turnstileToken, challengeToken, consent, ...fields } = v;
    const payload = {
      ...fields,
      submission_key:
        mode === "signed-challenge" ? challengeToken.split(".")[1] : null,
    };
    void website;
    void turnstileToken;
    void consent;
    const { data, error } = await intakeDatabase().rpc("submit_enquiry", {
      payload,
      rate_key: rateKey,
    });
    if (error) {
      if (error.message.includes("rate limit"))
        return NextResponse.json(
          { error: "Too many requests. Please try again in an hour." },
          { status: 429 },
        );
      throw error;
    }
    after(async () => {
      try {
        await deliverNotifications();
      } catch {
        /* Persisted outbox is retained for the retry worker. */
      }
    });
    jar.set(challengeCookie, "", {
      path: "/api",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return NextResponse.json(
      {
        reference: data,
        message: "Your enquiry has been received. Please keep your reference.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "We could not save your enquiry. Please try again or email info@megastride.com.ng.",
      },
      { status: 503 },
    );
  }
}
