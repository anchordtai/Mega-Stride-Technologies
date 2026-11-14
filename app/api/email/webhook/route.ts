import { NextResponse } from "next/server";
import { validEmailSignature } from "@/lib/payment-security";
import { boundedBody } from "@/lib/http";
import { intakeDatabase } from "@/lib/supabase/server";
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret)
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  let body: string;
  try {
    body = await boundedBody(request, 100000);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 413 });
  }
  if (!validEmailSignature(body, request.headers, secret))
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  try {
    const e = JSON.parse(body);
    const type = String(e.type || "").replace(/^email\./, "");
    if (
      ![
        "sent",
        "delivered",
        "delivery_delayed",
        "bounced",
        "complained",
        "failed",
      ].includes(type)
    )
      return NextResponse.json({ received: true });
    if (
      typeof e.data?.email_id !== "string" ||
      !Number.isFinite(Date.parse(e.created_at))
    )
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    const { error } = await intakeDatabase().rpc("record_email_event", {
      p_id: request.headers.get("svix-id"),
      p_provider: e.data.email_id,
      p_status: type,
      p_at: e.created_at,
    });
    if (error) throw Error();
    const {error:businessError}=await intakeDatabase().rpc("msbd_record_email_event",{p_provider:e.data.email_id,p_status:type,p_at:e.created_at});
    if(businessError)throw Error();
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Event could not be recorded" },
      { status: 503 },
    );
  }
}
