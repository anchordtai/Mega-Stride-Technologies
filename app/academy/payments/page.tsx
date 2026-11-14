import PageShell from "@/components/page-shell";
import { requireLearner } from "@/lib/academy";
import PaymentVerification from "@/components/payment-verification";
export const metadata = {
  title: "Payment history",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; verified?: string }>;
}) {
  const i = await requireLearner();
  const { reference, verified } = await searchParams;
  const { data, error } = await i.db
    .from("transactions")
    .select(
      "id,reference,amount_minor,currency,status,mode,course_id,created_at,courses(title,slug)",
    )
    .eq("user_id", i.user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw Error("Payment history unavailable");
  return (
    <PageShell
      eyebrow="Payments & receipts"
      title="A clear record of your learning investment."
    >
      <a href="/academy/dashboard" className="text-link mb-8">
        ← Learning workspace
      </a>
      {verified && (
        <p role="status" className="platform-panel mb-6">
          Payment verification completed. Review the record below. Test payments
          do not grant access.
        </p>
      )}
      {reference && /^MS-(test|live)-[a-f0-9]{32}$/.test(reference) && (
        <PaymentVerification reference={reference} auto />
      )}
      <div className="space-y-5">
        {!data?.length && (
          <p className="platform-panel">No payment records yet.</p>
        )}
        {data?.map((t) => (
          <article key={t.id} className="platform-panel">
            <p className="section-kicker">
              {t.mode === "test" ? "TEST · NO REAL PAYMENT" : "PAYMENT"} ·{" "}
              {t.status}
            </p>
            <h2 className="mt-4 text-2xl font-bold">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: t.currency,
              }).format(t.amount_minor / 100)}
            </h2>
            <p className="mt-3 break-all text-sm">{t.reference}</p>
            {t.status === "verified" && t.mode === "live" && <a className="primary-button mt-5 mr-4" href={`/academy/learn/${t.course_id}`}>Open paid course →</a>}
            {t.status === "verified" ? (
              <a
                className="text-link mt-5"
                href={`/api/academy/receipts/${t.id}`}
              >
                Download {t.mode === "test" ? "test " : ""}receipt (PDF) ↓
              </a>
            ) : t.status === "refunded" ? <p className="mt-5">This payment was refunded. Contact Academy support about course access.</p> : (
              <div className="mt-5">
                <PaymentVerification reference={t.reference} />
              </div>
            )}
          </article>
        ))}
      </div>
    </PageShell>
  );
}
