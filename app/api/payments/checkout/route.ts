import { NextResponse } from "next/server";
import { z } from "zod";
import { currentIdentity, intakeDatabase } from "@/lib/supabase/server";
import { paymentMode, safeCheckoutUrl } from "@/lib/payment-security";
import { permittedRequestOrigin } from "@/lib/enquiry-challenge";
import { boundedBody } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!permittedRequestOrigin(request.headers.get("origin")))
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const mode = paymentMode();
  if (!mode)
    return NextResponse.json(
      { error: "Online payment is not configured. Contact the Academy." },
      { status: 503 },
    );
  const i = await currentIdentity();
  if (!i)
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!i.user.email_confirmed_at || !i.user.email)
    return NextResponse.json(
      { error: "Confirm your email first." },
      { status: 403 },
    );
  if (mode === "test" && i.role !== "admin")
    return NextResponse.json(
      { error: "Test checkout is restricted to administrators." },
      { status: 403 },
    );
  let course: string;
  try {
    course = z
      .object({ course: z.uuid() })
      .strict()
      .parse(JSON.parse(await boundedBody(request, 1000))).course;
  } catch {
    return NextResponse.json({ error: "Invalid course." }, { status: 400 });
  }
  const db = intakeDatabase();
  const { data: t, error } = await db.rpc("begin_checkout", {
    p_user: i.user.id,
    p_course: course,
    p_email: i.user.email,
    p_mode: mode,
  });
  if (error || !t)
    return NextResponse.json(
      {
        error:
          "Checkout is unavailable. You may already be enrolled, or course fees need confirmation.",
      },
      { status: 409 },
    );
  if (!t.created) {
    if (t.checkout_url && safeCheckoutUrl(t.checkout_url))
      return NextResponse.json({ url: t.checkout_url, mode });
    return NextResponse.json(
      {
        error: "A checkout is being prepared. Please wait before trying again.",
      },
      { status: 409 },
    );
  }
  try {
    const r = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: i.user.email,
        amount: String(t.amount_minor),
        currency: t.currency,
        reference: t.reference,
        callback_url: `${process.env.SITE_URL}/academy/payments?reference=${t.reference}`,
        metadata: { course_id: course, transaction_id: t.id },
      }),
      signal: AbortSignal.timeout(12000),
    });
    const result = await r.json();
    if (
      !r.ok ||
      result.status !== true ||
      result.data?.reference !== t.reference ||
      !safeCheckoutUrl(result.data?.authorization_url)
    )
      throw Error("Invalid provider response");
    const saved = await db
      .from("transactions")
      .update({
        checkout_url: result.data.authorization_url,
        checkout_expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
      })
      .eq("id", t.id)
      .eq("status", "pending");
    if (saved.error) throw Error("Save failed");
    return NextResponse.json({ url: result.data.authorization_url, mode });
  } catch {
    return NextResponse.json(
      {
        error:
          "We could not prepare checkout. No payment has been confirmed. Contact the Academy before retrying.",
      },
      { status: 502 },
    );
  }
}
