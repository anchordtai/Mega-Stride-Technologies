import "server-only";
import { intakeDatabase } from "./supabase/server";
import { paymentMode, verifiedCharge } from "./payment-security";
export async function verifyPayment(reference: string) {
  const mode = paymentMode();
  if (!mode) throw Error("Payments unavailable");
  const db = intakeDatabase();
  const { data: stored, error } = await db
    .from("transactions")
    .select("reference,mode")
    .eq("reference", reference)
    .eq("provider", "paystack")
    .maybeSingle();
  if (error) throw Error("Payment records unavailable");
  if (!stored) return false;
  if (stored.mode !== mode) throw Error("Payment mode requires review");
  const r = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!r.ok) throw Error("Provider verification unavailable");
  const result = await r.json();
  if (result.status !== true) throw Error("Payment unconfirmed");
  const charge = verifiedCharge(result.data, reference, mode);
  const { error: save } = await db.rpc("settle_payment", {
    p_reference: reference,
    p_amount: charge.amount,
    p_currency: charge.currency,
    p_event: charge.event,
    p_mode: mode,
    p_email: charge.email,
  });
  if (save) throw Error("Payment reconciliation requires review");
  return true;
}
