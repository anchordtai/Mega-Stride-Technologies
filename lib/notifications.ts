import "server-only";
import { intakeDatabase } from "./supabase/server";
export async function deliverNotifications() {
  const key = process.env.RESEND_API_KEY,
    from = process.env.NOTIFICATION_FROM,
    to = process.env.NOTIFICATION_TO;
  if (!key || !from || !to) return { configured: false, sent: 0 };
  const db = intakeDatabase();
  const { data, error } = await db.rpc("claim_notifications");
  if (error) throw Error("Notification queue unavailable.");
  let sent = 0;
  for (const item of data || []) {
    try {
      const result = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `mega-stride-enquiry/${item.id}`,
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: `Mega Stride enquiry ${item.reference}`,
          text: `A new business enquiry has been received. Reference: ${item.reference}. Sign in to the Mega Stride staff workspace to review the details.`,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!result.ok)
        throw Error("Delivery provider did not accept the notification.");
      const { error: saveError } = await db
        .from("notification_outbox")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", item.id);
      if (saveError)
        throw Error("Delivery acknowledgement could not be saved.");
      sent++;
    } catch {
      await db
        .from("notification_outbox")
        .update({
          status: "failed",
          last_error:
            "Delivery failed. Review provider status and retry configuration.",
        })
        .eq("id", item.id);
    }
  }
  return { configured: true, sent };
}
