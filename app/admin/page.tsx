import PageShell from "@/components/page-shell";
import { requireStaff } from "@/lib/staff";
import { accountAction } from "@/app/account/actions";
import {
  manageEnquiry,
  saveContent,
  saveCourse,
  saveLesson,
  setEnrolment,
  uploadResource,
  saveQuote,
  approveQuote,
} from "./actions";
export const metadata = {
  title: "Staff workspace",
  robots: { index: false, follow: false },
};
function Field({
  name,
  label,
  type = "text",
  required = true,
  value = "",
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  value?: string;
}) {
  return (
    <label className="form-label mt-4">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={value}
        className="form-input"
        maxLength={type === "text" ? 180 : undefined}
      />
    </label>
  );
}
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; edit?: string }>;
}) {
  const i = await requireStaff();
  const { q = "", status = "", edit = "" } = await searchParams;
  const operational = ["admin", "staff"].includes(i.role!);
  const publishing = ["admin", "editor"].includes(i.role!);
  const teaching = ["admin", "instructor"].includes(i.role!);
  const [enquiries, content, courses, lessons, quotes] = await Promise.all([
    operational
      ? i.db
          .from("enquiries")
          .select("*,enquiry_notes(body,created_at)")
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [], error: null }),
    publishing
      ? i.db
          .from("content")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [], error: null }),
    i.db
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    teaching
      ? i.db.from("lessons").select("id,title,course_id").limit(200)
      : Promise.resolve({ data: [], error: null }),
    operational
      ? i.db
          .from("quotations")
          .select("id,number,total_minor,currency,status")
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if ([enquiries, content, courses, lessons, quotes].some((r) => r.error))
    throw Error("The staff workspace could not load its records.");
  const selected = content.data?.find((x) => x.id === edit);
  const filtered = (enquiries.data || []).filter(
    (e) =>
      (!status || e.status === status) &&
      (!q ||
        `${e.reference} ${e.name} ${e.email} ${e.service}`
          .toLowerCase()
          .includes(q.toLowerCase())),
  );
  return (
    <PageShell
      eyebrow={`Staff workspace · ${i.role}`}
      title="Manage the next stride."
    >
      <div className="mb-10 flex flex-wrap gap-5">
        <form action={accountAction}>
          <input type="hidden" name="mode" value="logout" />
          <button className="font-bold text-blue-700">Sign out</button>
        </form>
        {operational && (
          <>
            <a href="#enquiries">Enquiries</a>
            <a href="#quotes">Quotations</a>
            <a href="/api/admin/export">Export enquiries (CSV)</a>
          </>
        )}
        {publishing && <a href="#publishing">Publishing</a>}
        {teaching && <a href="#academy">Academy</a>}
      </div>
      {operational && (
        <section id="enquiries">
          <h2 className="text-3xl font-bold">
            Enquiries · {filtered.length} shown
          </h2>
          <form className="my-6 flex flex-wrap gap-4">
            <label className="form-label">
              Search
              <input
                name="q"
                defaultValue={q}
                className="form-input"
                maxLength={120}
              />
            </label>
            <label className="form-label">
              Status
              <select
                name="status"
                defaultValue={status}
                className="form-input"
              >
                <option value="">All statuses</option>
                {[
                  "new",
                  "under_review",
                  "contacted",
                  "quotation_sent",
                  "negotiation",
                  "won",
                  "lost",
                  "closed",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <button className="primary-button self-end">Filter</button>
          </form>
          <p className="mb-5 text-sm text-slate-600">
            Showing the latest 100 enquiries. Export includes up to 1,000 most
            recent records.
          </p>
          <div className="space-y-5">
            {filtered.length === 0 && (
              <p className="platform-panel">No matching enquiries.</p>
            )}
            {filtered.map((e) => (
              <article className="platform-panel" key={e.id}>
                <p className="section-kicker">
                  {e.reference} · {e.kind} · {e.status}
                </p>
                <h3 className="mt-4 text-xl font-bold">
                  {e.name} · {e.service}
                </h3>
                <p className="mt-3 text-sm">
                  {e.email} · {e.phone} · {e.company} · {e.country}
                </p>
                <p className="mt-4 whitespace-pre-wrap leading-7">
                  {e.message}
                </p>
                {e.kind === "trade" && (
                  <p className="mt-4 text-sm">{JSON.stringify(e.details)}</p>
                )}
                <p className="mt-3 break-all text-xs text-slate-500">
                  ID: {e.id}
                </p>
                <form
                  action={manageEnquiry}
                  className="mt-5 grid gap-4 sm:grid-cols-2"
                >
                  <input type="hidden" name="id" value={e.id} />
                  <label className="form-label">
                    Status
                    <select
                      name="status"
                      defaultValue={e.status}
                      className="form-input"
                    >
                      {[
                        "new",
                        "under_review",
                        "contacted",
                        "quotation_sent",
                        "negotiation",
                        "won",
                        "lost",
                        "closed",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <Field
                    name="assigned_to"
                    label="Assign to staff user ID"
                    value={e.assigned_to || ""}
                    required={false}
                  />
                  <Field
                    name="follow_up_at"
                    label="Follow up (ISO date with timezone)"
                    value={e.follow_up_at || ""}
                    required={false}
                  />
                  <label className="form-label">
                    Add internal note
                    <textarea
                      name="note"
                      maxLength={5000}
                      className="form-input"
                      rows={3}
                    />
                  </label>
                  <button className="primary-button justify-center">
                    Save follow-up
                  </button>
                </form>
                {e.enquiry_notes?.map(
                  (n: { body: string; created_at: string }) => (
                    <p
                      key={n.created_at + n.body}
                      className="mt-4 border-l-2 border-blue-200 pl-4 text-sm"
                    >
                      {n.body}
                    </p>
                  ),
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      {publishing && (
        <section id="publishing" className="mt-16">
          <h2 className="text-3xl font-bold">Publishing</h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <form action={saveContent} className="platform-panel">
              <h3 className="text-xl font-bold">
                {selected ? "Edit publication" : "Create publication"}
              </h3>
              <input type="hidden" name="id" value={selected?.id || ""} />
              <label className="form-label mt-4">
                Content type
                <select
                  name="kind"
                  defaultValue={selected?.kind || "post"}
                  className="form-input"
                >
                  {[
                    "post",
                    "project",
                    "page",
                    "service",
                    "team",
                    "testimonial",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <Field
                name="slug"
                label="Unique URL slug"
                value={selected?.slug || ""}
              />
              <Field name="title" label="Title" value={selected?.title || ""} />
              <Field
                name="category"
                label="Category"
                value={selected?.category || ""}
                required={false}
              />
              <label className="form-label mt-4">
                Summary
                <textarea
                  name="summary"
                  defaultValue={selected?.summary || ""}
                  className="form-input"
                  maxLength={500}
                />
              </label>
              <label className="form-label mt-4">
                Body (plain text)
                <textarea
                  name="body"
                  defaultValue={selected?.body || ""}
                  required
                  maxLength={50000}
                  rows={8}
                  className="form-input"
                />
              </label>
              <label className="form-label mt-4">
                Publication status
                <select
                  name="status"
                  defaultValue={selected?.status || "draft"}
                  className="form-input"
                >
                  <option>draft</option>
                  <option>published</option>
                  <option>archived</option>
                </select>
              </label>
              <p className="mt-4 text-xs leading-6 text-slate-600">
                Publish only approved facts, photographs, client names and
                testimonials. General pages/team/service records are stored for
                later page composition; posts and projects have public routes.
              </p>
              <button className="primary-button mt-6">Save publication</button>
            </form>
            <div className="space-y-4">
              {content.data?.map((x) => (
                <article key={x.id} className="platform-panel">
                  <p className="section-kicker">
                    {x.kind} · {x.status}
                  </p>
                  <h3 className="mt-3 text-lg font-bold">{x.title}</h3>
                  <div className="mt-4 flex gap-5 text-sm font-bold text-blue-700">
                    <a href={`/admin?edit=${x.id}#publishing`}>Edit</a>
                    <a href={`/admin/preview/${x.id}`}>Preview</a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
      {(teaching || operational) && (
        <section id="academy" className="mt-16">
          <h2 className="text-3xl font-bold">Academy administration</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {teaching && (
              <>
                <form action={saveCourse} className="platform-panel">
                  <h3 className="text-xl font-bold">Create course</h3>
                  <Field name="slug" label="Course slug" />
                  <Field name="title" label="Title" />
                  <Field name="category" label="Category" required={false} />
                  <label className="form-label mt-4">
                    Description
                    <textarea
                      name="description"
                      required
                      rows={5}
                      maxLength={15000}
                      className="form-input"
                    />
                  </label>
                  <Field
                    name="price_minor"
                    type="number"
                    label="Approved price in minor units (optional)"
                    required={false}
                  />
                  <Field name="currency" label="Currency" value="NGN" />
                  <label className="form-label mt-4">
                    Status
                    <select name="status" className="form-input">
                      <option>draft</option>
                      <option>published</option>
                      <option>archived</option>
                    </select>
                  </label>
                  <button className="primary-button mt-6">Create course</button>
                </form>
                <form action={saveLesson} className="platform-panel">
                  <h3 className="text-xl font-bold">Create lesson</h3>
                  <label className="form-label mt-4">
                    Course
                    <select name="course_id" className="form-input" required>
                      {courses.data?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field name="title" label="Title" />
                  <Field
                    name="position"
                    label="Lesson order (unique per course)"
                    type="number"
                  />
                  <label className="form-label mt-4">
                    Lesson text
                    <textarea
                      name="body"
                      required
                      maxLength={50000}
                      rows={8}
                      className="form-input"
                    />
                  </label>
                  <label className="mt-4 flex gap-3 text-sm">
                    <input type="checkbox" name="published" />
                    Publish lesson
                  </label>
                  <button className="primary-button mt-6">Save lesson</button>
                </form>
                <form action={uploadResource} className="platform-panel">
                  <h3 className="text-xl font-bold">
                    Upload learning material
                  </h3>
                  <label className="form-label mt-4">
                    Lesson
                    <select required name="lesson_id" className="form-input">
                      {lessons.data?.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field name="title" label="Resource title" />
                  <label className="form-label mt-4">
                    PDF (maximum 3 MiB)
                    <input
                      required
                      type="file"
                      name="file"
                      accept="application/pdf"
                      className="form-input"
                    />
                  </label>
                  <button className="primary-button mt-6">
                    Upload private resource
                  </button>
                </form>
              </>
            )}
            {operational && (
              <form action={setEnrolment} className="platform-panel">
                <h3 className="text-xl font-bold">Manage enrolment</h3>
                <Field name="user_id" label="Student user ID" />
                <label className="form-label mt-4">
                  Course
                  <select required name="course_id" className="form-input">
                    {courses.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-label mt-4">
                  Status
                  <select name="status" className="form-input">
                    <option>pending</option>
                    <option>active</option>
                    <option>completed</option>
                    <option>cancelled</option>
                  </select>
                </label>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Activate only after confirming the agreed enrolment
                  requirements. This does not record or verify a payment.
                </p>
                <button className="primary-button mt-6">Save enrolment</button>
              </form>
            )}
          </div>
        </section>
      )}
      {operational && (
        <section id="quotes" className="mt-16">
          <h2 className="text-3xl font-bold">Quotations</h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <form action={saveQuote} className="platform-panel">
              <h3 className="text-xl font-bold">Prepare a draft quotation</h3>
              <Field name="enquiry_id" label="Enquiry ID" />
              <Field name="currency" label="Currency" value="NGN" />
              <Field name="valid_until" type="date" label="Valid until" />
              <label className="form-label mt-5">
                Items
                <textarea
                  name="items"
                  required
                  rows={7}
                  className="form-input"
                  placeholder='[{"description":"Approved scope","quantity":1,"unit_minor":10000}]'
                />
              </label>
              <p className="mt-4 text-xs leading-6 text-slate-600">
                Enter unit prices in minor units (100 kobo = ₦1). Totals are
                calculated on the server. Administrator approval is required for
                a final PDF.
              </p>
              <button className="primary-button mt-6">
                Save draft quotation
              </button>
            </form>
            <div className="space-y-5">
              {quotes.data?.map((q) => (
                <article key={q.id} className="platform-panel">
                  <h3 className="font-bold">{q.number}</h3>
                  <p className="mt-3">
                    {q.currency}{" "}
                    {(q.total_minor / 100).toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    · {q.status}
                  </p>
                  <a
                    href={`/api/admin/quotes/${q.id}`}
                    className="mt-4 inline-block font-bold text-blue-700"
                  >
                    Download PDF ↓
                  </a>
                  {i.role === "admin" && q.status === "draft" && (
                    <form action={approveQuote}>
                      <input type="hidden" name="id" value={q.id} />
                      <button className="primary-button mt-4">
                        Approve quotation
                      </button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}
