import PageShell from "@/components/page-shell";
import { requireStaff } from "@/lib/staff";
import { emailReady } from "@/lib/notifications";
import { paymentMode } from "@/lib/payment-security";
import { retryEmails } from "./actions";
export const metadata = {
  title: "Email & payment operations",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const i = await requireStaff(["admin", "staff"]);
  const [jobs, transactions] = await Promise.all([
    i.db
      .from("email_jobs")
      .select("id,kind,status,attempts,provider_status,last_error,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    i.db
      .from("transactions")
      .select("id,reference,status,mode,amount_minor,currency,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (jobs.error || transactions.error) throw Error("Operations unavailable");
  return (
    <PageShell
      eyebrow="Delivery & reconciliation"
      title="See what actually happened."
    >
      <a href="/admin" className="text-link">
        ← Staff workspace
      </a>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          [
            "Email transport",
            emailReady() ? "Configured" : "Company sender credentials required",
          ],
          ["Payment mode", paymentMode() || "Disabled"],
          [
            "Public learner signup",
            process.env.ACADEMY_PUBLIC_SIGNUP_ENABLED === "true"
              ? "Enabled"
              : "Held until SMTP verification",
          ],
        ].map(([l, s]) => (
          <div className="platform-panel" key={l}>
            <h2 className="text-lg font-bold">{l}</h2>
            <p className="mt-4">{s}</p>
          </div>
        ))}
      </div>
      <section className="platform-panel mt-8">
        <h2 className="text-2xl font-bold">Email queue and delivery events</h2>
        <p className="mt-4 text-sm leading-7">
          Accepted means the email provider accepted the message. Delivered,
          bounced and complained are recorded only from signed provider events.
          New messages are attempted immediately; the free daily scheduler
          retries eligible pending work. Jobs beyond the 23-hour idempotency
          window require review.
        </p>
        <form action={retryEmails}>
          <button disabled={!emailReady()} className="primary-button mt-5">
            Process eligible queued messages
          </button>
        </form>
        <div className="mt-6 space-y-4">
          {!jobs.data?.length && <p>No email jobs yet.</p>}
          {jobs.data?.map((j) => (
            <div className="border-t border-slate-200 pt-4" key={j.id}>
              <strong>{j.kind}</strong>
              <p className="mt-2 text-sm">
                Queue: {j.status} · Provider:{" "}
                {j.provider_status || "No delivery event"} · Attempts:{" "}
                {j.attempts}
              </p>
              {j.last_error && (
                <p className="mt-2 text-sm text-amber-800">{j.last_error}</p>
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="platform-panel mt-8">
        <h2 className="text-2xl font-bold">Payment reconciliation</h2>
        <p className="mt-4 text-sm">
          Only verified live payments activate paid enrolments. Test records
          never grant course access. Refunds and disputes require authorised
          provider/account review.
        </p>
        {transactions.data?.map((t) => (
          <div className="mt-5 border-t border-slate-200 pt-4" key={t.id}>
            <p className="break-all font-bold">{t.reference}</p>
            <p className="mt-2 text-sm">
              {t.mode} · {t.status} · {t.currency}{" "}
              {(t.amount_minor / 100).toFixed(2)}
            </p>
          </div>
        ))}
      </section>
    </PageShell>
  );
}
