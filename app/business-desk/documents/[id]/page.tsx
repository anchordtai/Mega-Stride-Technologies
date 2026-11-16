import { notFound } from "next/navigation";
import { z } from "zod";
import { intakeDatabase } from "@/lib/supabase/server";
import {
  requireBusiness,
  type BusinessDocument,
  type BusinessPayment,
  type BusinessClient,
  documentStatus,
  invoiceBalance,
} from "@/lib/business-desk/server";
import { money, amountInWords } from "@/lib/business-desk/money";
import { changeBusiness } from "../../actions";
import BusinessDocumentEditor from "@/components/business-document-editor";
function Control({
  action,
  id,
  label,
  reason = false,
  confirm = false,
}: {
  action: string;
  id: string;
  label: string;
  reason?: boolean;
  confirm?: boolean;
}) {
  return (
    <form action={changeBusiness} className="bd-item">
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="id" value={id} />
      {reason && (
        <label>
          Reason
          <textarea name="reason" minLength={20} maxLength={2000} required />
        </label>
      )}
      {confirm && (
        <label>
          <input type="checkbox" name="confirm" required />I confirm this action
          is authorised for this exact document.
        </label>
      )}
      <button className="bd-secondary">{label}</button>
    </form>
  );
}
export default async function Document({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const i = await requireBusiness();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const result = await i.db
    .from("msbd_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (result.error || !result.data) notFound();
  const d = result.data as BusinessDocument;
  const [client, events, payments, related, services, settings] =
    await Promise.all([
      i.db.from("msbd_clients").select("*").eq("id", d.client_id).single(),
      i.db
        .from("msbd_events")
        .select("action,reason,created_at")
        .eq("document_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
      i.db.from("msbd_payments").select("*").eq("invoice_id", id),
      i.db.from("msbd_documents").select("*").eq("source_id", id),
      i.db.from("msbd_services").select("*").eq("active", true).limit(250),
      i.db.from("msbd_settings").select("profile").single(),
    ]);
  if (
    client.error ||
    events.error ||
    payments.error ||
    related.error ||
    services.error ||
    settings.error
  )
    throw Error("Document details unavailable");
  const c = client.data as BusinessClient;
  const ps = payments.data as BusinessPayment[];
  const ds = related.data as BusinessDocument[];
  const status = documentStatus(d, ps, ds);
  const edit = ["super_admin", "admin", "sales"].includes(i.businessRole);
  const approve = ["super_admin", "admin"].includes(i.businessRole);
  const finance = ["super_admin", "finance", "admin", "management"].includes(
    i.businessRole,
  );
  const balance =
    d.kind === "invoice" && finance ? invoiceBalance(d, ps, ds) : null;
  return (
    <>
      <header className="bd-heading">
        <p className="bd-label">
          {d.kind.replaceAll("_", " ")} / {d.number}
        </p>
        <h1>{d.content.title}</h1>
        <p>
          Every approval, issue, payment and controlled correction is recorded.
        </p>
      </header>
      <article className="bd-panel">
        <span className="bd-status">{status.replaceAll("_", " ")}</span>
        <h2 className="mt-5">{c.name}</h2>
        <p>
          {d.number}
          <br />
          {d.issued_at
            ? `Issued ${new Date(d.issued_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}`
            : "Draft · not issued"}
          <br />
          {d.due_date ? `Valid until / due: ${d.due_date}` : ""}
        </p>
        <div className="bd-list">
          {d.content.items.map((x, n) => (
            <div className="bd-row" key={n}>
              <div>
                <strong>{x.description}</strong>
                <small>
                  {x.quantity_milli / 1000} ×{" "}
                  {money(x.unit_minor, d.content.currency)}
                  {x.discount_minor
                    ? ` · discount ${money(x.discount_minor, d.content.currency)}`
                    : ""}
                </small>
              </div>
              <strong>{money(x.total_minor, d.content.currency)}</strong>
            </div>
          ))}
        </div>
        <div className="bd-grid">
          {[
            ["Subtotal", d.content.subtotal_minor],
            ["Item discounts", d.content.line_discount_minor || 0],
            ["Overall discount", d.content.discount_minor || 0],
            ["Tax", d.content.tax_minor || 0],
            ["Additional charges", d.content.charges_minor || 0],
            ["Delivery", d.content.delivery_minor || 0],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="bd-label">{label}</div>
              <p>{money(Number(value), d.content.currency)}</p>
            </div>
          ))}
        </div>
        <h2>Total {money(d.content.total_minor, d.content.currency)}</h2>
        <p>{amountInWords(d.content.total_minor, d.content.currency)}</p>
        {balance && (
          <div className="bd-note">
            Confirmed received: {money(balance.paid, d.content.currency)} ·
            Credit notes: {money(balance.credit, d.content.currency)} ·
            Outstanding:{" "}
            <strong>{money(balance.outstanding, d.content.currency)}</strong>
          </div>
        )}
        <p className="whitespace-pre-wrap">{d.content.terms}</p>
        <div className="bd-actions">
          {d.kind === "invoice" &&
            d.issued_at &&
            ["super_admin", "finance"].includes(i.businessRole) && (
              <a
                className="bd-secondary"
                href={`/business-desk/payments?invoice=${d.id}`}
              >
                Record / reconcile payment →
              </a>
            )}
          <a
            className="bd-primary"
            href={`/api/business-desk/documents/${d.id}`}
          >
            Download {d.issued_at ? "issued" : "draft"} PDF
          </a>
          <a
            className="bd-secondary"
            target="_blank"
            rel="noopener noreferrer"
            href={`/api/business-desk/documents/${d.id}?view=inline`}
          >
            Preview / print PDF
          </a>
          {d.issued_at && (
            <a className="bd-secondary" href={`/document/verify/${d.token}`}>
              Verify document →
            </a>
          )}
        </div>
        {!d.issued_at && (
          <p>
            A draft PDF is watermarked and is not an issued quotation, invoice
            or payment receipt.
          </p>
        )}
      </article>
      {d.status === "draft" && edit && (
        <>
          <BusinessDocumentEditor
            clients={[{ id: c.id, name: c.name }]}
            services={services.data || []}
            existing={d}
            taxBps={Number(settings.data.profile.tax_bps) || 0}
          />
          <Control action="submit" id={id} label="Submit for approval" />
        </>
      )}
      {d.status === "pending_approval" && approve && (
        <Control
          action="approve"
          id={id}
          label="Approve this exact version"
          confirm
        />
      )}
      {d.status === "approved" && approve && (
        <Control
          action="issue"
          id={id}
          label="Issue official document"
          confirm
        />
      )}
      {["pending_approval", "approved"].includes(d.status) && approve && (
        <Control
          action="return_draft"
          id={id}
          label="Return for correction"
          reason
        />
      )}
      {d.issued_at &&
        edit &&
        d.kind === "quotation" &&
        ["issued", "sent", "viewed", "accepted"].includes(d.status) && (
          <section className="bd-panel">
            <h2>Continue this quotation</h2>
            <form action={changeBusiness}>
              <input type="hidden" name="action" value="quotation_convert" />
              <input type="hidden" name="id" value={id} />
              <label>
                Invoice due date
                <input type="date" name="due_date" required />
              </label>
              <button className="bd-primary">
                Convert approved quotation to draft invoice
              </button>
            </form>
            <form action={changeBusiness}>
              <input type="hidden" name="action" value="document_revise" />
              <input type="hidden" name="id" value={id} />
              <label>
                Revised quotation expiry
                <input name="due_date" type="date" required />
              </label>
              <label>
                Reason for revision
                <textarea
                  name="reason"
                  required
                  minLength={20}
                  maxLength={2000}
                />
              </label>
              <button className="bd-secondary">
                Create controlled revision
              </button>
            </form>
          </section>
        )}
      {d.issued_at &&
        ["super_admin", "admin", "finance", "sales"].includes(i.businessRole) &&
        !["cancelled", "superseded"].includes(d.status) && (
          <section className="bd-panel">
            <h2>Send to the client</h2>
            <p>
              The issued PDF will be attached and sent to the snapshotted client
              email {c.email}. Provider acceptance and delivery are tracked
              separately. No email is marked delivered simply because it was
              queued.
            </p>
            <Control
              action="document_email"
              id={id}
              label="Queue document email"
            />
          </section>
        )}
      {i.businessRole === "super_admin" &&
        d.kind !== "receipt" &&
        !["cancelled", "superseded"].includes(d.status) && (
          <details className="bd-panel">
            <summary>Controlled cancellation / credit</summary>
            <Control
              action="cancel"
              id={id}
              label="Cancel this document"
              reason
              confirm
            />
            {d.kind === "invoice" && (
              <>
                <Control
                  action="write_off"
                  id={id}
                  label="Write off invoice"
                  reason
                  confirm
                />
                <form action={changeBusiness}>
                  <input type="hidden" name="action" value="credit_note" />
                  <input type="hidden" name="invoice_id" value={id} />
                  <label>
                    Credit amount · {d.content.currency}
                    <input name="amount" required inputMode="decimal" />
                  </label>
                  <label>
                    Reason
                    <textarea
                      name="reason"
                      minLength={20}
                      maxLength={2000}
                      required
                    />
                  </label>
                  <label>
                    <input name="confirm" type="checkbox" required />I authorise
                    this credit against the unpaid balance.
                  </label>
                  <button className="bd-secondary">Issue credit note</button>
                </form>
              </>
            )}
          </details>
        )}
      <DeliveryHistory document={id} />
      <section className="bd-panel">
        <h2>Document history</h2>
        {events.data?.map((e, n) => (
          <div className="bd-row" key={n}>
            <div>
              <strong>{e.action.replaceAll("_", " ")}</strong>
              <p>{e.reason}</p>
            </div>
            <small>
              {new Date(e.created_at).toLocaleString("en-NG", {
                timeZone: "Africa/Lagos",
              })}
            </small>
          </div>
        ))}
        {d.acceptance && (
          <p>
            Client response: {String(d.acceptance.action)} ·{" "}
            {String(d.acceptance.recorded_at)}. The response is bound to the
            issued document hash.
          </p>
        )}
        {ds.map((x) => (
          <p key={x.id}>
            <a className="bd-quiet" href={`/business-desk/documents/${x.id}`}>
              {x.number} · {x.kind}
            </a>
          </p>
        ))}
      </section>
    </>
  );
}

async function DeliveryHistory({ document }: { document: string }) {
  const i = await requireBusiness();
  if (!["super_admin", "admin", "finance"].includes(i.businessRole))
    return null;
  const { data, error } = await i.db
    .from("msbd_email_jobs")
    .select("event,status,attempts,provider_status,last_error,created_at")
    .eq("document_id", document)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw Error("Delivery history unavailable");
  return (
    <section className="bd-panel">
      <h2>Email delivery record</h2>
      {!data?.length && <p>No email has been queued for this document.</p>}
      {data?.map((j, n) => (
        <div className="bd-row" key={n}>
          <div>
            <strong>{j.event.replaceAll("_", " ")}</strong>
            <p>
              Queue: {j.status} · Attempts: {j.attempts} · Provider:{" "}
              {j.provider_status || "Delivery not confirmed"}
            </p>
            {j.last_error && <small>{j.last_error}</small>}
          </div>
          <small>
            {new Date(j.created_at).toLocaleString("en-NG", {
              timeZone: "Africa/Lagos",
            })}
          </small>
        </div>
      ))}
    </section>
  );
}
