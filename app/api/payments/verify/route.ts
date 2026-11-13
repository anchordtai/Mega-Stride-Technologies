import { NextResponse, after } from "next/server";
import { currentIdentity } from "@/lib/supabase/server";
import { verifyPayment } from "@/lib/payments";
import { permittedRequestOrigin } from "@/lib/enquiry-challenge";
import { boundedBody } from "@/lib/http";
import { deliverNotifications } from "@/lib/notifications";
export async function POST(request: Request) {
  if (!permittedRequestOrigin(request.headers.get("origin")))
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const i = await currentIdentity();
  if (!i)
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  let reference: string;
  try {
    const b = JSON.parse(await boundedBody(request, 1000));
    reference = b.reference;
    if (
      typeof reference !== "string" ||
      !/^MS-(test|live)-[a-f0-9]{32}$/.test(reference)
    )
      throw Error();
  } catch {
    return NextResponse.json({ error: "Invalid reference." }, { status: 400 });
  }
  const { data: t, error } = await i.db
    .from("transactions")
    .select("reference,mode,status,course_id")
    .eq("reference", reference)
    .eq("user_id", i.user.id)
    .maybeSingle();
  if (error || !t)
    return NextResponse.json(
      { error: "Payment record unavailable." },
      { status: 404 },
    );
  try {
    if (!await verifyPayment(reference)) throw Error("Payment record unavailable");
    after(async () => {
      await deliverNotifications().catch(() => {});
    });
    return NextResponse.json({
      verified: true,
      mode: t.mode,
      learningPath: t.mode === "live" ? `/academy/learn/${t.course_id}` : null,
      message:
        t.mode === "test"
          ? "Test payment verified. No real payment or course access was granted."
          : "Payment verified. Check your learning workspace for course access.",
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Payment is not confirmed yet. If you completed payment, keep your reference and contact support; please do not pay again.",
      },
      { status: 409 },
    );
  }
}
