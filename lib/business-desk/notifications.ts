import "server-only";
import { intakeDatabase } from "@/lib/supabase/server";
import { emailReady } from "@/lib/notifications";
import { documentBytes } from "./pdf";
import type { BusinessDocument } from "./server";
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export async function deliverBusinessNotifications() {
  const db = intakeDatabase();
  const reminders = await db.rpc("msbd_queue_reminders");
  if (reminders.error) throw Error("Business reminder queue unavailable");
  if (!emailReady()) return { configured: false, sent: 0 };
  const { data, error } = await db.rpc("msbd_claim_email_jobs");
  if (error) throw Error("Business delivery queue unavailable");
  let sent = 0;
  for (const job of data || []) {
    try {
      let document: BusinessDocument | null = null;
      if (job.document_id) {
        const record = await db
          .from("msbd_documents")
          .select("*")
          .eq("id", job.document_id)
          .single();
        if (record.error || !record.data) throw Error();
        document = record.data as BusinessDocument;
      }
      const internal = job.context?.internal === true;
      const contact = internal
        ? await db.from("msbd_settings").select("profile").single()
        : document
          ? await db
              .from("msbd_clients")
              .select("email")
              .eq("id", document.client_id)
              .single()
          : null;
      if (contact?.error) throw Error("Recipient could not be verified");
      const contactData = contact?.data as {
        profile?: { email?: string };
        email?: string;
      } | null;
      const currentRecipient = internal
        ? contactData?.profile?.email
        : contactData?.email;
      if (!currentRecipient) throw Error("Current recipient is unavailable");
      if (
        currentRecipient &&
        String(currentRecipient).toLowerCase() !==
          String(job.recipient).toLowerCase()
      ) {
        await db
          .from("msbd_email_jobs")
          .update({
            status: "suppressed",
            last_error:
              "Contact details changed. Review the current recipient before queuing a new message.",
          })
          .eq("id", job.id);
        continue;
      }

      if (
        document &&
        !internal &&
        (!document.issued_at ||
          (["cancelled", "superseded"].includes(document.status) &&
            !["document_cancelled", "document_status_changed"].includes(
              job.event,
            )))
      ) {
        await db
          .from("msbd_email_jobs")
          .update({
            status: "suppressed",
            last_error: "Document is not current for this message.",
          })
          .eq("id", job.id);
        continue;
      }
      const number = document?.number || String(job.context?.number || "");
      const name = String(
        document?.company_snapshot?.name ||
          job.context?.company ||
          "Mega Stride Technologies Limited",
      );
      const body = String(job.template.body).replaceAll("{number}", number);
      const subject = String(job.template.subject).replaceAll(
        "{number}",
        number,
      );
      const url = internal
        ? "https://www.megastride.com.ng/business-desk"
        : "https://www.megastride.com.ng/client-portal";
      const text = `${name}\n\n${body}\n\nSecure workspace: ${url}\n\nIf this email was unexpected, contact info@megastride.com.ng.`;
      const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#112b4a"><img src="https://www.megastride.com.ng/brand/mega-stride-logo.jpg" alt="Mega Stride Technologies Limited" width="260"><h2>${escape(name)}</h2><p style="line-height:1.8;white-space:pre-line">${escape(body)}</p><p><a href="${url}">Open secure workspace</a></p><p style="font-size:12px">If unexpected, contact info@megastride.com.ng.</p></div>`;
      const attachments = document?.issued_at
        ? [
            {
              filename: `${document.number.replaceAll("/", "-")}.pdf`,
              content: (await documentBytes(document)).toString("base64"),
            },
          ]
        : [];
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `mega-stride-business/${job.id}`,
        },
        body: JSON.stringify({
          from: process.env.NOTIFICATION_FROM,
          to: [job.recipient],
          subject,
          text,
          html,
          ...(attachments.length ? { attachments } : {}),
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw Error();
      const result = await response.json();
      if (typeof result.id !== "string" || !result.id) throw Error();
      const saved = await db
        .from("msbd_email_jobs")
        .update({
          status: "accepted",
          provider_id: result.id,
          last_error: null,
        })
        .eq("id", job.id);
      if (saved.error) throw Error();
      sent++;
    } catch {
      await db
        .from("msbd_email_jobs")
        .update({
          status: "failed",
          next_attempt_at: new Date(
            Date.now() + Math.min(60, 2 ** job.attempts) * 60000,
          ).toISOString(),
          last_error:
            "Delivery not confirmed. Retry preserves provider idempotency; messages older than 23 hours require review.",
        })
        .eq("id", job.id);
    }
  }
  return { configured: true, sent };
}
