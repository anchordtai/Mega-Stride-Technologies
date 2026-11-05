import "server-only";
import { intakeDatabase } from "./supabase/server";
import { emailContent } from "./email-content";
export function emailReady() {
  return !!(
    process.env.RESEND_API_KEY &&
    process.env.NOTIFICATION_FROM &&
    /@(?:[a-z0-9-]+\.)*megastride\.com\.ng(?:>|$)/i.test(
      process.env.NOTIFICATION_FROM,
    ) &&
    process.env.NOTIFICATION_TO
  );
}
export async function deliverNotifications() {
  if (!emailReady()) return { configured: false, sent: 0 };
  const db = intakeDatabase();
  const { data, error } = await db.rpc("claim_email_jobs");
  if (error) throw Error("Email queue unavailable");
  let sent = 0;
  for (const job of data || []) {
    try {
      const message = emailContent(job.kind, job.payload);
      const to = job.recipient || process.env.NOTIFICATION_TO;
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `mega-stride/${job.id}`,
        },
        body: JSON.stringify({
          from: process.env.NOTIFICATION_FROM,
          to: [to],
          ...message,
        }),
        signal: AbortSignal.timeout(7000),
      });
      if (!response.ok) throw Error("Provider rejected");
      const result = await response.json();
      if (typeof result.id !== "string" || !result.id)
        throw Error("No provider reference");
      const saved = await db
        .from("email_jobs")
        .update({
          status: "accepted",
          provider_id: result.id,
          last_error: null,
        })
        .eq("id", job.id);
      if (saved.error) throw Error("Acknowledgement not saved");
      sent++;
    } catch {
      const failed = await db
        .from("email_jobs")
        .update({
          status: "failed",
          next_attempt_at: new Date(
            Date.now() + Math.min(60, 2 ** job.attempts) * 60000,
          ).toISOString(),
          last_error:
            "Delivery attempt not confirmed. Retry uses the same provider idempotency key; jobs older than 23 hours after first attempt require review.",
        })
        .eq("id", job.id);
      if (failed.error) throw Error("Email status could not be recorded");
    }
  }
  return { configured: true, sent };
}
