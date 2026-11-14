import PageShell from "@/components/page-shell";
import { intakeDatabase } from "@/lib/supabase/server";
import {
  businessIdentity,
  type BusinessDocument,
  type BusinessPayment,
  documentStatus,
} from "@/lib/business-desk/server";
import { money } from "@/lib/business-desk/money";
import { clientResponse } from "@/app/business-desk/actions";
export const maxDuration = 60;
export const metadata = {
  title: "Secure client portal",
  robots: { index: false, follow: false },
};
export default async function Portal({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; page?: string }>;
}) {
  const i = await businessIdentity();
  const { notice } = await searchParams;
  if (!i)
    return (
      <PageShell
        eyebrow="Mega Stride Client Services"
        title="Your business documents. One secure place."
        intro="Sign in to view documents shared with your verified client account."
      >
        <a className="primary-button" href="/account?next=%2Fclient-portal">
          Sign in to the client portal →
        </a>
        <p className="mt-6 leading-8">
          The company must verify your identity and link your account to the
          client record. Signing up alone does not grant access to client
          documents.
        </p>
        <a className="text-link mt-5" href="/document/verify">
          Verify a document →
        </a>
      </PageShell>
    );
  const page = Math.min(
    100000,
    Math.max(1, Math.floor(Number((await searchParams).page) || 1)),
  );
  const clients = await i.db
    .from("msbd_clients")
    .select("id,name,number,email,profile")
    .eq("portal_user", i.user.id);
  if (clients.error) throw Error("Client portal unavailable.");
  const ids = new Set((clients.data || []).map((c) => c.id));
  const docs = ids.size
    ? await i.db
        .from("msbd_documents")
        .select("*")
        .in("client_id", [...ids])
        .not("issued_at", "is", null)
        .order("created_at", { ascending: false })
        .range((page - 1) * 25, page * 25 - 1)
    : { data: [], error: null };
  if (docs.error) throw Error("Client documents unavailable.");
  const documents = (docs.data || []) as BusinessDocument[];
  const ownPayments: BusinessPayment[] = [];
  const balances = new Map<
    string,
    { paid: number; credit: number; outstanding: number }
  >();
  await Promise.all(
    documents
      .filter((d) => d.kind === "invoice")
      .map(async (d) => {
        const { data, error } = await intakeDatabase().rpc(
          "msbd_invoice_balance",
          { p_actor: i.user.id, p_invoice: d.id },
        );
        if (error || !data) throw Error("Invoice balance unavailable");
        balances.set(d.id, {
          paid: data.paid_minor,
          credit: data.credit_minor,
          outstanding: data.outstanding_minor,
        });
      }),
  );
  return (
    <PageShell
      eyebrow="Secure client portal"
      title="A clear view of your documents."
      intro="Review quotations, respond explicitly and keep track of invoices and official payment receipts."
    >
      {notice && (
        <p role="status" className="platform-panel mb-7">
          {notice === "response-saved"
            ? "Your response was saved against the issued document version."
            : notice === "staff-access"
              ? "Your account does not have staff access. Your own linked client documents appear below."
              : "Your response was not saved. Check the quotation status, expiry and required confirmation."}
        </p>
      )}
      {!ids.size && (
        <p className="platform-panel">
          No client record is linked to your verified account yet.{" "}
          <a className="text-link" href="/contact">
            Contact Mega Stride
          </a>{" "}
          to arrange identity verification and access.
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {clients.data?.map((c) => (
          <article className="platform-panel" key={c.id}>
            <p className="section-kicker">{c.number}</p>
            <h2 className="mt-4 text-2xl font-bold">{c.name}</h2>
            <p className="mt-3">{c.email}</p>
            <p className="mt-3 whitespace-pre-wrap">{c.profile.address}</p>
          </article>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {documents.map((d) => {
          const balance = balances.get(d.id) || null;
          const state =
            balance && !["cancelled", "written_off"].includes(d.status)
              ? balance.outstanding === 0
                ? "paid"
                : balance.paid > 0
                  ? "partially_paid"
                  : d.due_date &&
                      d.due_date < new Date().toISOString().slice(0, 10)
                    ? "overdue"
                    : "unpaid"
              : documentStatus(d, ownPayments, documents);
          return (
            <article key={d.id} className="platform-panel">
              <p className="section-kicker">
                {d.kind.replaceAll("_", " ")} · {state.replaceAll("_", " ")}
              </p>
              <h2 className="mt-4 text-2xl font-bold">{d.content.title}</h2>
              <p className="mt-4">{d.number}</p>
              <p className="mt-3 font-bold">
                {money(d.content.total_minor, d.content.currency)}
              </p>
              {balance && (
                <p className="mt-3">
                  Confirmed payments: {money(balance.paid, d.content.currency)}{" "}
                  · Outstanding:{" "}
                  {money(balance.outstanding, d.content.currency)}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-4">
                <a
                  className="text-link"
                  href={`/api/business-desk/documents/${d.id}`}
                >
                  Download PDF ↓
                </a>
                <a className="text-link" href={`/document/verify/${d.token}`}>
                  Verify status →
                </a>
              </div>
              {d.kind === "quotation" &&
                ["issued", "sent", "viewed"].includes(state) && (
                  <details className="mt-6">
                    <summary className="cursor-pointer font-bold">
                      Respond to this quotation
                    </summary>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7">
                      {d.content.terms}
                    </p>
                    <p className="mt-3 text-sm leading-7">
                      Read the complete issued PDF and its terms before
                      accepting. Opening or downloading a document does not
                      accept it.
                    </p>
                    <form action={clientResponse} className="mt-4">
                      <input name="document" type="hidden" value={d.id} />
                      <label className="form-label">
                        Response
                        <select name="response" className="form-input">
                          <option value="accepted">
                            Accept this quotation
                          </option>
                          <option value="rejected">Reject quotation</option>
                          <option value="revision_requested">
                            Request a revision
                          </option>
                        </select>
                      </label>
                      <label className="form-label mt-4">
                        Comments
                        <textarea
                          name="reason"
                          className="form-input"
                          maxLength={2000}
                        />
                      </label>
                      <label className="mt-4 block text-sm leading-7">
                        <input name="terms" type="checkbox" /> If accepting, I
                        accept the issued quotation’s terms and exact version.
                      </label>
                      <label className="mt-4 block text-sm leading-7">
                        <input name="confirm" type="checkbox" required /> I am
                        authorised to submit this response for this client.
                      </label>
                      <button className="primary-button mt-5">
                        Submit my response
                      </button>
                    </form>
                  </details>
                )}
            </article>
          );
        })}
      </div>
      <nav className="mt-8 flex gap-6" aria-label="Client document pages">
        {page > 1 && (
          <a className="text-link" href={`/client-portal?page=${page - 1}`}>
            ← Previous documents
          </a>
        )}
        {documents.length === 25 && (
          <a className="text-link" href={`/client-portal?page=${page + 1}`}>
            Next documents →
          </a>
        )}
      </nav>
      <a className="text-link mt-8" href="/contact">
        Contact Mega Stride about your documents →
      </a>
    </PageShell>
  );
}
