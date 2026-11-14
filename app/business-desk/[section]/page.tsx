import BusinessCharts from "@/components/business-charts";
import { notFound } from "next/navigation";
import {
  requireBusiness,
  type BusinessClient,
  type BusinessDocument,
  type BusinessPayment,
  documentStatus,
} from "@/lib/business-desk/server";
import { intakeDatabase } from "@/lib/supabase/server";
import { money } from "@/lib/business-desk/money";
import { changeBusiness, saveClientNote, saveBranding } from "../actions";
import BusinessDocumentEditor from "@/components/business-document-editor";
const sections = [
  "dashboard",
  "clients",
  "quotation-requests",
  "quotations",
  "invoices",
  "receipts",
  "payments",
  "services",
  "reports",
  "settings",
];
function Field({
  name,
  label,
  value = "",
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  value?: string | number;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        maxLength={type === "text" ? 3000 : undefined}
      />
    </label>
  );
}
function Reason() {
  return (
    <label>
      Reason / reconciliation record
      <textarea
        name="reason"
        required
        minLength={20}
        maxLength={2000}
        placeholder="At least 20 characters; retained in the audit record"
      />
    </label>
  );
}
function Confirm({
  label = "I confirm this change is authorised.",
}: {
  label?: string;
}) {
  return (
    <label>
      <input type="checkbox" name="confirm" required />
      {label}
    </label>
  );
}
function Act({
  action,
  id,
  label,
  danger = false,
}: {
  action: string;
  id: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <form action={changeBusiness}>
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="id" value={id} />
      {danger && (
        <>
          <Reason />
          <Confirm />
        </>
      )}
      <button className="bd-secondary">{label}</button>
    </form>
  );
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();
  const i = await requireBusiness();
  const search = await searchParams;
  const page = Math.min(
    100000,
    Math.max(1, Math.floor(Number(search.page) || 1)),
  );
  const q = (search.q || "").replace(/[%_]/g, "").slice(0, 100);
  const finance = ["super_admin", "admin", "finance", "management"].includes(
      i.businessRole,
    ),
    edit = ["super_admin", "admin", "sales"].includes(i.businessRole),
    owner = i.businessRole === "super_admin";
  if (section === "settings" && !owner) notFound();
  if (["reports", "payments", "receipts"].includes(section) && !finance)
    notFound();
  const [{ data: settings, error: se }, clientResult, serviceResult] =
    await Promise.all([
      i.db.from("msbd_settings").select("profile").single(),
      section === "clients"
        ? i.db
            .from("msbd_clients")
            .select("*")
            .ilike("name", `%${q}%`)
            .order("name")
            .range((page - 1) * 25, page * 25 - 1)
        : i.db.from("msbd_clients").select("*").order("name").limit(250),
      i.db.from("msbd_services").select("*").order("name").limit(250),
    ]);
  if (se || clientResult.error || serviceResult.error)
    throw Error(
      "Business Desk records could not load. Confirm the database migration and role setup.",
    );
  const profile = settings.profile as Record<string, string | number | boolean>;
  const clients = clientResult.data as BusinessClient[];
  if (
    search.client &&
    section !== "clients" &&
    !clients.some((c) => c.id === search.client)
  ) {
    const chosen = await i.db
      .from("msbd_clients")
      .select("*")
      .eq("id", search.client)
      .maybeSingle();
    if (chosen.data) clients.push(chosen.data as BusinessClient);
  }

  const services = serviceResult.data || [];
  const headings: Record<string, [string, string]> = {
    dashboard: [
      "Business, clearly connected.",
      "Your clients, documents and confirmed payment records in one protected workspace.",
    ],
    clients: [
      "Know every client.",
      "Maintain client records and link verified portal accounts after an identity review.",
    ],
    "quotation-requests": [
      "Turn enquiries into opportunities.",
      "Review quotation requests, claim follow-up responsibility and prepare a client quotation.",
    ],
    quotations: [
      "Proposals with a clear purpose.",
      "Prepare, approve and issue professional quotations. Historical issued versions are preserved.",
    ],
    invoices: [
      "A clear record of what is due.",
      "Create invoices from approved quotations or prepare a new invoice. Payments are reconciled separately.",
    ],
    receipts: [
      "Proof of confirmed payment.",
      "Official receipts are generated only when authorised finance personnel confirm actual received funds.",
    ],
    payments: [
      "Reconcile with confidence.",
      "Pending entries are not receipts. Confirm actual received funds using evidence before generating an official receipt.",
    ],
    services: [
      "A catalogue built for your business.",
      "Maintain service descriptions and reference pricing. Custom quotation lines remain available.",
    ],
    reports: [
      "See the numbers that matter.",
      "Invoiced amounts, confirmed receipts and receivables remain distinct. Currencies are reported separately.",
    ],
    settings: [
      "Your company. Your controls.",
      "Company details are snapshotted at document issue; changing these settings never changes issued documents.",
    ],
  };
  let report: Record<string, unknown> | null = null;
  if (["dashboard", "reports"].includes(section) && finance) {
    const r = await intakeDatabase().rpc("msbd_report", {
      p_actor: i.user.id,
      p_from: search.from || null,
      p_to: search.to || null,
      p_client: search.client || null,
      p_category: search.category || null,
      p_status: search.status || null,
      p_method: search.method || null,
      p_staff: search.staff || null,
    });
    if (r.error)
      throw Error("Financial report could not load. Check the filters.");
    report = r.data;
  }
  const staff: { id: string; name: string; email: string; role: string }[] = [];
  if (finance && ["reports", "clients"].includes(section)) {
    const result = await intakeDatabase().rpc("msbd_staff_directory", {
      p_actor: i.user.id,
    });
    if (result.error) throw Error("Staff directory unavailable");
    staff.push(...result.data);
  }
  const notice = search.notice;
  return (
    <>
      <header className="bd-heading">
        <p className="bd-label">
          Business Desk / {section.replaceAll("-", " ")}
        </p>
        <h1>{headings[section][0]}</h1>
        <p>{headings[section][1]}</p>
      </header>
      {notice && (
        <p
          role="status"
          className={`bd-note ${notice === "change-error" ? "bd-error" : ""}`}
        >
          {notice === "saved"
            ? "Your change was saved and recorded."
            : "The change was not saved. Check required fields, role permissions, document status, duplicate references and the explicit confirmation. No successful payment or delivery should be assumed."}
        </p>
      )}
      {(section === "dashboard" || section === "reports") && (
        <>
          {report && (
            <>
              <div className="bd-grid">
                {Object.entries({
                  Clients: report.clients,
                  "Open quotation requests": report.requests,
                  ...(report.documents as Record<string, number>),
                }).map(([label, n]) => (
                  <section className="bd-panel" key={label}>
                    <div className="bd-label">{label}</div>
                    <div className="bd-kpi">{Number(n) || 0}</div>
                  </section>
                ))}
              </div>
              <div className="bd-grid">
                {(
                  report.finance as {
                    currency: string;
                    retained_minor: number;
                    gross_confirmed_minor: number;
                    reversed_minor: number;
                  }[]
                ).map((row) => (
                  <section className="bd-panel" key={row.currency}>
                    <p className="bd-label">
                      Confirmed retained payments · {row.currency}
                    </p>
                    <div className="bd-kpi">
                      {money(row.retained_minor || 0, row.currency)}
                    </div>
                    <p>
                      Gross confirmed:{" "}
                      {money(row.gross_confirmed_minor || 0, row.currency)}
                      <br />
                      Reversed: {money(row.reversed_minor || 0, row.currency)}
                    </p>
                  </section>
                ))}
                {(
                  report.receivables as {
                    currency: string;
                    outstanding_minor: number;
                    invoiced_minor: number;
                  }[]
                ).map((row) => (
                  <section className="bd-panel" key={row.currency}>
                    <p className="bd-label">
                      Outstanding receivables · {row.currency}
                    </p>
                    <div className="bd-kpi">
                      {money(row.outstanding_minor, row.currency)}
                    </div>
                    <p>
                      Issued invoice value:{" "}
                      {money(row.invoiced_minor, row.currency)}
                    </p>
                  </section>
                ))}
              </div>
              <section className="bd-panel">
                <h2>Document performance</h2>
                <div className="bd-grid">
                  {Object.entries(
                    report.statuses as Record<string, number>,
                  ).map(([status, n]) => (
                    <div key={status}>
                      <span className="bd-status">
                        {status.replaceAll("_", " ")}
                      </span>
                      <strong className="block mt-3 text-2xl">{n}</strong>
                    </div>
                  ))}
                </div>
              </section>
              <section className="bd-panel">
                <h2>Monthly confirmed receipts</h2>
                {!(report.monthly as unknown[]).length && (
                  <p>No confirmed business payments yet.</p>
                )}
                {(
                  report.monthly as {
                    month: string;
                    currency: string;
                    amount_minor: number;
                  }[]
                ).map((row) => (
                  <div key={row.month + row.currency}>
                    <div className="flex flex-wrap justify-between gap-3">
                      <span>
                        {row.month} · {row.currency}
                      </span>
                      <strong>{money(row.amount_minor, row.currency)}</strong>
                    </div>
                    <div className="bd-bar">
                      <span
                        style={{
                          width: `${Math.max(2, (row.amount_minor / Math.max(...(report!.monthly as { amount_minor: number; currency: string }[]).filter((x) => x.currency === row.currency).map((x) => x.amount_minor), 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </section>
              <BusinessCharts report={report} />
            </>
          )}
          {section === "dashboard" && <Alerts />}
          {section === "dashboard" && (
            <section className="bd-panel">
              <h2>Your next action</h2>
              <div className="bd-actions">
                <a className="bd-primary" href="/business-desk/clients">
                  Manage clients
                </a>
                {edit && (
                  <a
                    className="bd-secondary"
                    href="/business-desk/quotations?new=1"
                  >
                    Prepare a quotation
                  </a>
                )}
                {["super_admin", "finance"].includes(i.businessRole) && (
                  <a className="bd-secondary" href="/business-desk/payments">
                    Reconcile payments
                  </a>
                )}
              </div>
              <p>
                Receipt creation requires a confirmed payment. Documents are
                emailed only through the recorded delivery queue. Check
                notification status before assuming delivery.
              </p>
            </section>
          )}
          {section === "reports" && (
            <section className="bd-panel">
              <h2>Filter & export</h2>
              <form className="bd-grid">
                <Field
                  name="from"
                  label="From date"
                  type="date"
                  value={search.from || ""}
                />
                <Field
                  name="to"
                  label="To date"
                  type="date"
                  value={search.to || ""}
                />
                <label>
                  Client
                  <select name="client" defaultValue={search.client || ""}>
                    <option value="">All clients</option>
                    {clients.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  name="category"
                  label="Service category"
                  value={search.category || ""}
                />
                <Field
                  name="status"
                  label="Document status"
                  value={search.status || ""}
                />
                <label>
                  Payment method
                  <select name="method" defaultValue={search.method || ""}>
                    <option value="">All methods</option>
                    {["bank_transfer", "cash", "pos", "gateway", "other"].map(
                      (m) => (
                        <option key={m}>{m}</option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  Staff member
                  <select name="staff" defaultValue={search.staff || ""}>
                    <option value="">All staff</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.role}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="bd-primary">Apply filters</button>
              </form>
              <a
                className="bd-secondary"
                href={`/api/business-desk/reports?${new URLSearchParams(Object.fromEntries(Object.entries(search).filter(([k, v]) => ["from", "to", "client", "category", "status", "method", "staff"].includes(k) && v) as [string, string][]))}`}
              >
                Download CSV
              </a>
              <a
                className="bd-secondary"
                href={`/api/business-desk/reports?format=pdf&${new URLSearchParams(Object.fromEntries(Object.entries(search).filter(([k, v]) => ["from", "to", "client", "category", "status", "method", "staff"].includes(k) && v) as [string, string][]))}`}
              >
                Download report PDF
              </a>
              <p>
                Exports are limited to 5,000 matching document rows; narrow the
                date range if the report reports a limit. Unpaid invoices are
                never counted as received revenue.
              </p>
            </section>
          )}
        </>
      )}
      {section === "clients" && (
        <>
          <form className="bd-panel">
            <label>
              Search client name
              <input name="q" defaultValue={q} maxLength={100} />
            </label>
            <button className="bd-secondary">Search</button>
          </form>
          {edit && (
            <details className="bd-panel" open={search.new === "1"}>
              <summary>Add a client</summary>
              <ClientForm staff={staff} />
            </details>
          )}
          <div className="bd-grid">
            {clients.map((c) => (
              <article className="bd-panel" key={c.id}>
                <span className="bd-status">
                  {c.archived ? "Archived" : c.kind}
                </span>
                <h2>{c.name}</h2>
                <p>
                  {c.number}
                  <br />
                  {c.email}
                  <br />
                  {c.profile.phone}
                  <br />
                  {c.profile.address}
                </p>
                <a
                  className="bd-secondary"
                  href={`/business-desk/quotations?new=1&client=${c.id}`}
                >
                  Prepare quotation
                </a>
                <a
                  className="bd-secondary"
                  href={`/business-desk/invoices?client=${c.id}`}
                >
                  Documents
                </a>
                {edit && (
                  <details>
                    <summary>Edit client</summary>
                    <ClientForm client={c} staff={staff} />
                  </details>
                )}
                {edit && (
                  <Act
                    action="client_archive"
                    id={c.id}
                    label={c.archived ? "Restore client" : "Archive client"}
                  />
                )}
                {["super_admin", "finance"].includes(i.businessRole) && (
                  <details>
                    <summary>Issue account statement</summary>
                    <form action={changeBusiness}>
                      <input name="action" type="hidden" value="statement" />
                      <input name="client_id" type="hidden" value={c.id} />
                      <label>
                        Currency
                        <select name="currency">
                          {["NGN", "USD", "GBP", "EUR"].map((k) => (
                            <option key={k}>{k}</option>
                          ))}
                        </select>
                      </label>
                      <Confirm label="Issue a statement from the current confirmed ledger." />
                      <button className="bd-secondary">
                        Create account statement PDF
                      </button>
                    </form>
                  </details>
                )}
                {finance && (
                  <a
                    className="bd-secondary"
                    href={`/business-desk/reports?client=${c.id}`}
                  >
                    Client reports
                  </a>
                )}{" "}
                <ClientNotes client={c.id} />
                <p>
                  Portal:{" "}
                  {c.portal_user ? "Verified account linked" : "Not linked"}
                </p>
                {["super_admin", "admin"].includes(i.businessRole) && (
                  <details>
                    <summary>Link verified client portal</summary>
                    <form action={changeBusiness}>
                      <input
                        type="hidden"
                        name="action"
                        value="client_portal"
                      />
                      <input type="hidden" name="id" value={c.id} />
                      <p>The verified account must use {c.email}.</p>
                      <label>
                        Portal access
                        <select name="portal_action">
                          <option value="link">
                            Link the matching verified account
                          </option>
                          <option value="unlink">
                            Remove the existing portal link
                          </option>
                        </select>
                      </label>
                      <Reason />
                      <Confirm label="I have verified this account belongs to this client." />
                      <button className="bd-secondary">
                        Save portal access
                      </button>
                    </form>
                  </details>
                )}
              </article>
            ))}
          </div>
          <div className="bd-pagination">
            {page > 1 && (
              <a
                href={`/business-desk/clients?${new URLSearchParams({ q, page: String(page - 1) })}`}
              >
                ← Previous
              </a>
            )}
            {clients.length === 25 && (
              <a
                href={`/business-desk/clients?${new URLSearchParams({ q, page: String(page + 1) })}`}
              >
                Next →
              </a>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Client records are paginated, with 25 accessible clients per page.
            Search before creating a new client to prevent duplicates.
          </p>
        </>
      )}
      {section === "services" && (
        <>
          <section className="bd-panel">
            <h2>Service catalogue</h2>
            {!services.length && (
              <p>
                No services have been entered. Add the company’s approved
                offerings and pricing.
              </p>
            )}
            {services.map((s) => (
              <div className="bd-row" key={s.id}>
                <div>
                  <strong>{s.name}</strong>
                  <small>
                    {s.category} · {s.pricing} · {s.unit}
                  </small>
                  <p>{s.description}</p>
                </div>
                <span>
                  {s.price_minor === null
                    ? "Custom quotation"
                    : money(s.price_minor, s.currency)}
                </span>
              </div>
            ))}
          </section>
          {["super_admin", "admin"].includes(i.businessRole) && (
            <details className="bd-panel">
              <summary>Add / update service</summary>
              <form action={changeBusiness}>
                <input type="hidden" name="action" value="service_save" />
                <label>
                  Existing service to update
                  <select name="id">
                    <option value="">New service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="bd-grid">
                  <Field name="name" label="Service name" required />
                  <Field name="category" label="Category" />
                  <Field
                    name="unit"
                    label="Unit of measurement"
                    value="project"
                  />
                  <Field
                    name="price"
                    label="Default price · leave empty for custom"
                  />
                  <label>
                    Currency
                    <select name="currency">
                      {["NGN", "USD", "GBP", "EUR"].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Pricing model
                    <select name="pricing">
                      {[
                        "custom",
                        "fixed",
                        "hourly",
                        "daily",
                        "monthly",
                        "per_user",
                        "per_device",
                        "per_project",
                      ].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Description
                  <textarea name="description" maxLength={5000} />
                </label>
                <label>
                  <input type="checkbox" name="active" defaultChecked />
                  Available in catalogue
                </label>
                <button className="bd-primary">Save service</button>
              </form>
            </details>
          )}
        </>
      )}
      {section === "settings" && (
        <>
          <form className="bd-panel" action={changeBusiness}>
            <input type="hidden" name="action" value="settings" />
            <h2>Company profile & financial controls</h2>
            <div className="bd-grid">
              {(
                [
                  ["name", "Registered company name"],
                  ["trading_name", "Trading name"],
                  ["address", "Registered office address"],
                  ["branch_address", "Branch address"],
                  ["phone", "Company telephone"],
                  ["email", "Company email"],
                  ["website", "Website"],
                  ["registration", "RC / registration number"],
                  ["tax_id", "Tax identification · optional"],
                  ["vat_registration", "VAT registration · optional"],
                  ["quotation_contact", "Quotation contact"],
                  ["invoice_contact", "Invoice contact"],
                  ["signatory", "Authorised signatory"],
                  ["designation", "Signatory designation"],
                  ["signature_note", "Signature / authorisation note"],
                  ["prefix", "Document number prefix"],
                  ["tax_label", "Tax label"],
                  ["tax_bps", "Authorised tax rate (%)"],
                  ["sales_discount_bps", "Maximum sales discount (%)"],
                  ["reminder_days", "Reminder interval · days"],
                ] as const
              ).map(([k, l]) => (
                <Field
                  key={k}
                  name={k}
                  label={l}
                  value={
                    k === "tax_bps" || k === "sales_discount_bps"
                      ? (Number(profile[k] || 0) / 100).toFixed(2)
                      : String(profile[k] ?? "")
                  }
                />
              ))}
            </div>
            <label>
              Official bank details · do not enter payment-card credentials
              <textarea
                name="bank_details"
                defaultValue={String(profile.bank_details || "")}
                maxLength={3000}
              />
            </label>
            <label>
              Payment instructions
              <textarea
                name="payment_instructions"
                defaultValue={String(profile.payment_instructions || "")}
                maxLength={3000}
              />
            </label>
            <label>
              <input
                type="checkbox"
                name="require_owner_approval"
                defaultChecked={!!profile.require_owner_approval}
              />
              Require owner approval before issuing quotations and invoices
            </label>
            <label>
              <input
                type="checkbox"
                name="notifications_enabled"
                defaultChecked={!!profile.notifications_enabled}
              />
              Enable automatic Business Desk transactional notifications
            </label>
            <label>
              <input
                type="checkbox"
                name="reminders_enabled"
                defaultChecked={!!profile.reminders_enabled}
              />
              Enable configured invoice reminder emails
            </label>
            <p>
              Tax defaults to zero. Enter a rate only after the company has
              authorised its applicability. Existing issued documents retain
              their original company information and financial totals.
            </p>
            <button className="bd-primary">Save company settings</button>
          </form>
          <form action={saveBranding} className="bd-panel">
            <h2>Company branding & authorised signature</h2>
            <p>
              The supplied company logo is used by default. Upload only
              authorised company assets. Issued documents keep their original
              branding snapshot.
            </p>
            <label>
              Asset type
              <select name="asset_kind">
                <option>logo</option>
                <option>signature</option>
                <option>stamp</option>
              </select>
            </label>
            <label>
              PNG or JPEG image · up to 2 MiB
              <input
                type="file"
                name="asset"
                accept="image/png,image/jpeg"
                required
              />
            </label>
            <button className="bd-primary">Save new branding assets</button>
          </form>
          <Roles actor={i.user.id} />
          <Templates db={i.db} />
          <Audit actor={i.user.id} />
          <section className="bd-panel">
            <h2>Integrations</h2>
            <p>
              Transactional email:{" "}
              {process.env.RESEND_API_KEY && process.env.NOTIFICATION_FROM
                ? "Credentials present; verify delivery status"
                : "Sender configuration required"}
              . Academy online payments use their existing gateway; Business
              Desk bank, cash and POS payments use evidence-based
              reconciliation. No live charge is initiated by recording a
              payment.
            </p>
          </section>
        </>
      )}
      {[
        "quotations",
        "invoices",
        "receipts",
        "payments",
        "quotation-requests",
      ].includes(section) && (
        <Records
          section={section}
          search={search}
          page={page}
          edit={edit}
          clients={clients}
          services={services}
          taxBps={Number(profile.tax_bps) || 0}
        />
      )}
    </>
  );
}
function ClientForm({
  client,
  staff = [],
}: {
  client?: BusinessClient;
  staff?: { id: string; name: string; role: string }[];
}) {
  return (
    <form action={changeBusiness}>
      <input type="hidden" name="action" value="client_save" />
      {client && <input type="hidden" name="id" value={client.id} />}
      <div className="bd-grid">
        <Field
          name="name"
          label="Registered organisation / full name"
          value={client?.name}
          required
        />
        <Field
          name="email"
          label="Client email"
          type="email"
          value={client?.email}
          required
        />
        <label>
          Client classification
          <select name="kind" defaultValue={client?.kind || "corporate"}>
            <option>corporate</option>
            <option>individual</option>
          </select>
        </label>
        {(
          [
            ["contact", "Contact person"],
            ["department", "Department"],
            ["phone", "Primary phone"],
            ["alternative_phone", "Alternative phone"],
            ["address", "Billing address"],
            ["delivery_address", "Delivery / service address"],
            ["city", "City"],
            ["state", "State"],
            ["country", "Country"],
            ["registration", "Client registration number"],
            ["tax_id", "Client tax ID"],
            ["website", "Client website"],
            ["category", "Client category"],
          ] as const
        ).map(([k, l]) => (
          <Field key={k} name={k} label={l} value={client?.profile[k]} />
        ))}
        {staff.length > 0 && (
          <label>
            Assigned account
            <select name="assigned_to" defaultValue={client?.assigned_to || ""}>
              <option value="">My account / keep existing assignment</option>
              {staff
                .filter((s) =>
                  ["super_admin", "admin", "sales"].includes(s.role),
                )
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.role}
                  </option>
                ))}
            </select>
          </label>
        )}
      </div>
      <button className="bd-primary">Save client</button>
    </form>
  );
}
async function Roles({ actor }: { actor: string }) {
  const { data, error } = await intakeDatabase().rpc("msbd_roles_list", {
    p_actor: actor,
  });
  if (error) throw Error("Staff role records unavailable");
  return (
    <section className="bd-panel">
      <h2>Staff permissions</h2>
      <p>
        Only verified accounts can be assigned Business Desk roles. Academy
        instructor access does not grant business or finance permissions.
      </p>
      {(data || []).map((u: { id: string; email: string; role: string }) =>
        u.role === "super_admin" ? (
          <article className="bd-item" key={u.id}>
            <strong>{u.email}</strong>
            <p>Protected super administrator · verified company owner</p>
          </article>
        ) : (
          <form action={changeBusiness} className="bd-item" key={u.id}>
            <strong>{u.email}</strong>
            <small className="block mt-2">Account ID: {u.id}</small>
            <input type="hidden" name="action" value="role" />
            <input type="hidden" name="id" value={u.id} />
            <label>
              Business role
              <select name="role" defaultValue={u.role}>
                {["none", "sales", "admin", "finance", "management"].map(
                  (r) => (
                    <option key={r}>{r}</option>
                  ),
                )}
              </select>
            </label>
            <Reason />
            <Confirm />
            <button className="bd-secondary">Save staff role</button>
          </form>
        ),
      )}
    </section>
  );
}
async function Templates({
  db,
}: {
  db: Awaited<ReturnType<typeof requireBusiness>>["db"];
}) {
  const { data, error } = await db.from("msbd_templates").select("*");
  if (error) throw Error("Email templates unavailable");
  return (
    <section className="bd-panel">
      <h2>Email templates</h2>
      {data?.map((t) => (
        <form action={changeBusiness} className="bd-item" key={t.event}>
          <h3>{t.event.replaceAll("_", " ")}</h3>
          <input type="hidden" name="action" value="template_save" />
          <input type="hidden" name="event" value={t.event} />
          <Field name="subject" label="Subject" value={t.subject} required />
          <label>
            Message · {"{number}"} inserts the document reference
            <textarea
              name="body"
              defaultValue={t.body}
              required
              maxLength={5000}
            />
          </label>
          <label>
            <input type="checkbox" name="enabled" defaultChecked={t.enabled} />
            Template enabled
          </label>
          <button className="bd-secondary">Save template</button>
        </form>
      ))}
    </section>
  );
}
async function Records({
  section,
  search,
  page,
  edit,
  clients,
  services,
  taxBps,
}: {
  section: string;
  search: Record<string, string | undefined>;
  page: number;
  edit: boolean;
  clients: BusinessClient[];
  services: {
    id: string;
    name: string;
    description: string;
    price_minor: number | null;
    unit: string;
    currency: string;
  }[];
  taxBps: number;
}) {
  const i = await requireBusiness();
  if (section === "quotation-requests") {
    const { data, error } = await i.db
      .from("enquiries")
      .select(
        "id,reference,name,company,email,phone,service,subject,message,details,status,assigned_to,created_at",
      )
      .eq("kind", "quotation")
      .order("created_at", { ascending: false })
      .range((page - 1) * 25, page * 25 - 1);
    if (error) throw Error("Requests unavailable");
    return (
      <section className="bd-panel">
        <h2>Quotation request inbox</h2>
        {!data?.length && <p>No quotation requests in this page.</p>}
        {data?.map((e) => (
          <article className="bd-item" key={e.id}>
            <span className="bd-status">{e.status}</span>
            <h3>{e.subject || e.service}</h3>
            <p>
              {e.reference} · {e.company || e.name}
              <br />
              {e.email} · {e.phone}
            </p>
            <p className="whitespace-pre-wrap">{e.message}</p>
            <p>
              {Object.entries(e.details || {})
                .filter(([, v]) => v)
                .map(([k, v]) => `${k.replaceAll("_", " ")}: ${String(v)}`)
                .join(" · ")}
            </p>
            {edit && (
              <>
                <Act
                  action="enquiry_claim"
                  id={e.id}
                  label="Claim / review this request"
                />
                <Act
                  action="request_convert"
                  id={e.id}
                  label="Convert request to client & prepare quote"
                />
                <a
                  className="bd-secondary"
                  href="/business-desk/quotations?new=1"
                >
                  Prepare quotation →
                </a>
              </>
            )}
            <RequestAttachments enquiry={e.id} />
          </article>
        ))}
        <Pagination
          section={section}
          page={page}
          count={data?.length || 0}
          search={search}
        />
      </section>
    );
  }
  if (section === "payments") {
    const { data, error } = await i.db
      .from("msbd_payments")
      .select("*")
      .order("created_at", { ascending: false })
      .range((page - 1) * 25, page * 25 - 1);
    if (error) throw Error("Payments unavailable");
    const invoices = await i.db
      .from("msbd_documents")
      .select("id,number,content")
      .eq("kind", "invoice")
      .not("issued_at", "is", null)
      .not("status", "in", "(cancelled,written_off)")
      .limit(250);
    if (
      search.invoice &&
      !invoices.data?.some((d) => d.id === search.invoice)
    ) {
      const selected = await i.db
        .from("msbd_documents")
        .select("id,number,content")
        .eq("id", search.invoice)
        .eq("kind", "invoice")
        .not("issued_at", "is", null)
        .maybeSingle();
      if (selected.data) invoices.data?.push(selected.data);
    }
    const reconcile = ["super_admin", "finance"].includes(i.businessRole);
    return (
      <>
        {reconcile && (
          <form action={changeBusiness} className="bd-panel">
            <h2>Record a payment · pending reconciliation</h2>
            <input type="hidden" name="action" value="payment_record" />
            <label>
              Issued invoice
              <select
                required
                name="invoice_id"
                defaultValue={search.invoice || ""}
              >
                <option value="">Choose invoice</option>
                {invoices.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.number} ·{" "}
                    {money(d.content.total_minor, d.content.currency)}
                  </option>
                ))}
              </select>
            </label>
            <div className="bd-grid">
              <Field
                name="reference"
                label="Unique bank / transaction reference"
                required
              />
              <Field
                name="amount"
                label="Amount received · invoice currency"
                required
              />
              <Field
                name="payment_date"
                label="Payment date"
                type="date"
                required
              />
              <label>
                Payment method
                <select name="method">
                  {["bank_transfer", "cash", "pos", "gateway", "other"].map(
                    (m) => (
                      <option key={m}>{m}</option>
                    ),
                  )}
                </select>
              </label>
              <Field name="provider" label="Bank / provider" />
            </div>
            <label>
              Supporting reconciliation evidence / statement reference
              <textarea
                name="evidence"
                required
                minLength={5}
                maxLength={2000}
              />
            </label>
            <p>
              Recording this entry does not confirm funds or issue a receipt.
            </p>
            <button className="bd-primary">Save pending payment</button>
          </form>
        )}
        <div className="bd-grid">
          {((data as BusinessPayment[]) || []).map((p) => (
            <article key={p.id} className="bd-panel">
              <span className="bd-status">{p.status}</span>
              <h2>{money(p.amount_minor, p.currency)}</h2>
              <p>
                {p.reference}
                <br />
                {p.method} · {p.payment_date}
                <br />
                {p.provider}
              </p>
              <p>{p.evidence}</p>
              {!!p.refunded_minor && (
                <p>
                  Actual refunds / reversals recorded:{" "}
                  {money(p.refunded_minor, p.currency)}
                </p>
              )}
              <a
                className="bd-secondary"
                href={`/business-desk/documents/${p.invoice_id}`}
              >
                View invoice
              </a>
              {p.receipt_id && (
                <a
                  className="bd-secondary"
                  href={`/business-desk/documents/${p.receipt_id}`}
                >
                  View receipt
                </a>
              )}
              {reconcile && p.status === "pending" && (
                <details>
                  <summary>Reconcile this payment</summary>
                  <form action={changeBusiness}>
                    <input
                      type="hidden"
                      name="action"
                      value="payment_confirm"
                    />
                    <input type="hidden" name="id" value={p.id} />
                    <Reason />
                    <label>
                      <input
                        type="checkbox"
                        name="confirmed_received"
                        required
                      />
                      I have confirmed that these funds were actually received
                      against this invoice.
                    </label>
                    <Confirm label="Issue the official receipt for this confirmed amount." />
                    <button className="bd-primary">
                      Confirm received funds & create receipt
                    </button>
                  </form>
                  <Act
                    action="payment_reject"
                    id={p.id}
                    label="Reject pending entry"
                    danger
                  />
                </details>
              )}
              {i.businessRole === "super_admin" && p.status === "confirmed" && (
                <details>
                  <summary>Record an actual refund / reversal</summary>
                  <form action={changeBusiness}>
                    <input
                      type="hidden"
                      name="action"
                      value="payment_reverse"
                    />
                    <input type="hidden" name="id" value={p.id} />
                    <Field
                      name="reversal_reference"
                      label="Actual bank refund / reversal reference"
                      required
                    />
                    <Field
                      name="amount"
                      label="Refund amount · leave empty for full unrefunded balance"
                    />
                    <Reason />
                    <label>
                      <input type="checkbox" name="refund_completed" required />
                      The refund / reversal was actually completed. This action
                      records it; it does not transfer money.
                    </label>
                    <Confirm />
                    <button className="bd-secondary">
                      Record reversal & cancel receipt
                    </button>
                  </form>
                </details>
              )}
            </article>
          ))}
        </div>
        <Pagination
          section={section}
          page={page}
          count={data?.length || 0}
          search={search}
        />
      </>
    );
  }
  const kind =
    section === "quotations"
      ? "quotation"
      : section === "invoices"
        ? "invoice"
        : "receipt";
  const { data: listing, error } = await i.db.rpc("msbd_document_list", {
    p_kind: kind,
    p_state: search.status || null,
    p_client: search.client || null,
    p_query: (search.q || "").replace(/[%_]/g, "").slice(0, 100),
    p_page: page,
  });
  if (error) throw Error("Documents unavailable");
  const data =
    (listing?.rows as (BusinessDocument & { current_status: string })[]) || [];
  return (
    <>
      <form className="bd-panel bd-grid">
        <label>
          Search reference or title
          <input name="q" defaultValue={search.q || ""} maxLength={100} />
        </label>
        <label>
          Document status
          <select name="status" defaultValue={search.status || ""}>
            <option value="">All statuses</option>
            {[
              "draft",
              "pending_approval",
              "approved",
              "issued",
              "sent",
              "viewed",
              "accepted",
              "rejected",
              "expired",
              "superseded",
              "converted",
              "unpaid",
              "partially_paid",
              "paid",
              "overdue",
              "partially_refunded",
              "cancelled",
              "written_off",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {search.client && (
          <input name="client" type="hidden" value={search.client} />
        )}
        <button className="bd-secondary">Filter documents</button>
      </form>
      {edit && kind !== "receipt" && (
        <a className="bd-primary" href={`/business-desk/${section}?new=1`}>
          + Prepare {kind}
        </a>
      )}
      {search.new === "1" && edit && kind !== "receipt" && (
        <BusinessDocumentEditor
          clients={clients.filter((c) => !c.archived)}
          services={services}
          taxBps={taxBps}
          preferredClient={search.client}
        />
      )}
      <div className="bd-grid">
        {(
          (data as (BusinessDocument & { current_status: string })[]) || []
        ).map((d) => (
          <article key={d.id} className="bd-panel">
            <span className="bd-status">{d.current_status}</span>
            <h2>{d.content.title}</h2>
            <p>
              {d.number}
              <br />
              {clients.find((c) => c.id === d.client_id)?.name ||
                d.client_snapshot?.name}
            </p>
            <strong>{money(d.content.total_minor, d.content.currency)}</strong>
            <a className="bd-primary" href={`/business-desk/documents/${d.id}`}>
              Open document →
            </a>
          </article>
        ))}
      </div>
      {!data?.length && (
        <p className="bd-panel">
          No {section} in this page.{" "}
          {kind === "receipt"
            ? "Receipts appear after confirmed payment."
            : "Create a draft to begin."}
        </p>
      )}
      <Pagination
        section={section}
        page={page}
        count={data?.length || 0}
        search={search}
      />
    </>
  );
}
function Pagination({
  section,
  page,
  count,
  search = {},
}: {
  section: string;
  page: number;
  count: number;
  search?: Record<string, string | undefined>;
}) {
  const href = (n: number) =>
    `/business-desk/${section}?${new URLSearchParams({ ...Object.fromEntries(Object.entries(search).filter(([k, v]) => ["q", "status", "client"].includes(k) && v) as [string, string][]), page: String(n) })}`;
  return (
    <div className="bd-pagination">
      {page > 1 && <a href={href(page - 1)}>← Previous</a>}
      {count === 25 && <a href={href(page + 1)}>Next →</a>}
    </div>
  );
}
async function RequestAttachments({ enquiry }: { enquiry: string }) {
  const i = await requireBusiness();
  const { data, error } = await i.db
    .from("msbd_attachments")
    .select("id,name,size_bytes")
    .eq("enquiry_id", enquiry);
  if (error) throw Error("Attachment list unavailable");
  return (
    <ul>
      {data?.map((a) => (
        <li key={a.id}>
          <a
            className="bd-quiet"
            href={`/api/business-desk/attachments/${a.id}`}
          >
            {a.name} · {Math.ceil(a.size_bytes / 1024)} KB
          </a>
        </li>
      ))}
    </ul>
  );
}

async function ClientNotes({ client }: { client: string }) {
  const i = await requireBusiness();
  const { data, error } = await i.db
    .from("msbd_client_notes")
    .select("body,created_at")
    .eq("client_id", client)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw Error("Notes unavailable");
  return (
    <details>
      <summary>Internal client notes</summary>
      {data?.map((n, k) => (
        <p key={k}>
          {n.body}
          <small className="block">
            {new Date(n.created_at).toLocaleDateString("en-GB")}
          </small>
        </p>
      ))}
      {i.businessRole !== "management" && (
        <form action={saveClientNote}>
          <input type="hidden" name="client_id" value={client} />
          <label>
            Private note
            <textarea name="body" minLength={2} maxLength={5000} required />
          </label>
          <button className="bd-secondary">Add private note</button>
        </form>
      )}
    </details>
  );
}

async function Alerts() {
  const i = await requireBusiness();
  const [documents, events] = await Promise.all([
    i.db
      .from("msbd_documents")
      .select("id,number,kind,status,due_date")
      .or(
        `status.eq.pending_approval,due_date.lte.${new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)}`,
      )
      .not(
        "status",
        "in",
        "(cancelled,superseded,converted,accepted,rejected,written_off)",
      )
      .limit(20),
    i.db
      .from("msbd_events")
      .select("action,reason,created_at,document_id")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  if (documents.error || events.error)
    throw Error("Notification centre unavailable");
  return (
    <section className="bd-panel">
      <h2>Notification centre</h2>
      {!documents.data?.length && !events.data?.length && (
        <p>No items need your attention.</p>
      )}
      {documents.data?.map((d) => (
        <div className="bd-row" key={d.id}>
          <a className="bd-quiet" href={`/business-desk/documents/${d.id}`}>
            {d.number}
          </a>
          <span className="bd-status">
            {d.status === "pending_approval"
              ? "Approval required"
              : `Review due date ${d.due_date}`}
          </span>
        </div>
      ))}
      {events.data?.map((e, n) => (
        <p key={n}>
          {e.action.replaceAll("_", " ")} ·{" "}
          {new Date(e.created_at).toLocaleDateString("en-GB")}
          {e.document_id && (
            <a
              className="bd-quiet ml-2"
              href={`/business-desk/documents/${e.document_id}`}
            >
              Open record →
            </a>
          )}
        </p>
      ))}
    </section>
  );
}
async function Audit({ actor }: { actor: string }) {
  const { data, error } = await intakeDatabase().rpc("msbd_audit_list", {
    p_actor: actor,
  });
  if (error) throw Error("Audit history unavailable");
  return (
    <details className="bd-panel">
      <summary>Protected administration audit · latest 100 changes</summary>
      {data?.map(
        (e: {
          id: number;
          actor: string;
          action: string;
          entity_id: string;
          reason: string;
          created_at: string;
        }) => (
          <article className="bd-item" key={e.id}>
            <strong>{e.action.replaceAll("_", " ")}</strong>
            <p>{e.reason}</p>
            <small>
              {new Date(e.created_at).toLocaleString("en-NG", {
                timeZone: "Africa/Lagos",
              })}{" "}
              · Actor {e.actor} · Record {e.entity_id}
            </small>
          </article>
        ),
      )}
    </details>
  );
}
