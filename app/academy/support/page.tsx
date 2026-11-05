import PageShell from "@/components/page-shell";
import { requireLearner } from "@/lib/academy";
import { createTicket, replyTicket } from "../actions";
export const metadata = {
  title: "Learner support",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const i = await requireLearner();
  const { data: tickets, error } = await i.db
    .from("support_tickets")
    .select("*,support_replies(id,body,created_at)")
    .eq("user_id", i.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw Error("Support requests unavailable");
  return (
    <PageShell
      eyebrow="Learner support"
      title="Let’s get you moving again."
      intro="Ask about course access, learning materials or your Academy experience."
    >
      <a href="/academy/dashboard" className="text-link">
        ← Learning workspace
      </a>
      <form action={createTicket} className="platform-panel mt-8 max-w-3xl">
        <h2 className="text-2xl font-bold">Open a support request</h2>
        <label className="form-label mt-5">
          Subject
          <input
            name="subject"
            required
            minLength={3}
            maxLength={180}
            className="form-input"
          />
        </label>
        <label className="form-label mt-5">
          How can we help?
          <textarea
            name="body"
            required
            minLength={10}
            maxLength={5000}
            rows={5}
            className="form-input"
          />
        </label>
        <p className="mt-4 text-sm text-slate-600">
          Include relevant references. Do not send passwords or payment-card
          details.
        </p>
        <button className="primary-button mt-5">Save support request</button>
      </form>
      <section className="mt-12 space-y-5">
        <h2 className="text-2xl font-bold">Your requests</h2>
        {!tickets?.length && <p>No support requests yet.</p>}
        {tickets?.map((t) => (
          <article className="platform-panel" key={t.id}>
            <p className="section-kicker">{t.status}</p>
            <h3 className="mt-3 text-xl font-bold">{t.subject}</h3>
            <p className="mt-4 whitespace-pre-wrap leading-8">{t.body}</p>
            {t.support_replies?.map(
              (r: { id: string; body: string; created_at: string }) => (
                <div
                  className="mt-5 border-l-2 border-blue-300 pl-5"
                  key={r.id}
                >
                  <p className="whitespace-pre-wrap leading-7">{r.body}</p>
                  <small>
                    {new Date(r.created_at).toLocaleString("en-NG", {
                      timeZone: "Africa/Lagos",
                    })}
                  </small>
                </div>
              ),
            )}
            <form action={replyTicket} className="mt-6">
              <input type="hidden" name="ticket" value={t.id} />
              <label className="form-label">
                Add a reply
                <textarea
                  name="body"
                  required
                  minLength={2}
                  maxLength={5000}
                  rows={3}
                  className="form-input"
                />
              </label>
              <button className="secondary-button mt-4">Save reply</button>
            </form>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
