import { NextResponse, after } from "next/server";
import {
  validPaystackSignature,
  validModernPaystackSignature,
  paymentMode,
} from "@/lib/payment-security";
import { verifyPayment } from "@/lib/payments";
import { boundedBody } from "@/lib/http";
import { deliverNotifications } from "@/lib/notifications";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !paymentMode())
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  let body: string;
  try {
    body = await boundedBody(request, 100000);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 413 });
  }
  if (
    !(process.env.PAYSTACK_WEBHOOK_SECRET
      ? validModernPaystackSignature(
          body,
          request.headers.get("paystack-signature"),
          process.env.PAYSTACK_WEBHOOK_SECRET,
        )
      : validPaystackSignature(
          body,
          request.headers.get("x-paystack-signature"),
          key,
        ))
  )
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  try {
    const e = JSON.parse(body);
    if (e.event !== "charge.success")
      return NextResponse.json({ received: true });
    const ref = e.data?.reference;
    if (typeof ref !== "string" || !/^MS-(test|live)-[a-f0-9]{32}$/.test(ref))
      return NextResponse.json({ received: true });
    await verifyPayment(ref);
    after(async () => {
      await deliverNotifications().catch(() => {});
    });
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Verification pending; retry required" },
      { status: 503 },
    );
  }
}
