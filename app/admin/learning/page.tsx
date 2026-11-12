import { redirect } from "next/navigation";
import PageShell from "@/components/page-shell";
import { requireStaff } from "@/lib/staff";
import AssessmentEditor from "@/components/assessment-editor";
import {
  saveAssessment,
  editCourse,
  editLesson,
  updateTicket,
  certificateStatus,
} from "./actions";
import { replyTicket } from "@/app/academy/actions";
export const metadata = {
  title: "Academy administration",
  robots: { index: false, follow: false },
};
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
    <label className="form-label mt-4">
      {label}
      <input
        className="form-input"
        name={name}
        type={type}
        defaultValue={value}
        required={required}
      />
    </label>
  );
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const i = await requireStaff(["admin", "staff", "instructor"]);
  if (i.role === "instructor") redirect("/instructor");
  const teaching = ["admin", "instructor"].includes(i.role!);
  const sales = ["admin", "staff"].includes(i.role!);
  const { course } = await searchParams;
  const [courses, tickets, certs] = await Promise.all([
    i.db.from("courses").select("*").order("title"),
    sales
      ? i.db
          .from("support_tickets")
          .select("*,support_replies(id,body)")
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [], error: null }),
    i.db
      .from("certificates")
      .select("id,code,holder_name,course_title,revoked_at")
      .order("issued_at", { ascending: false })
      .limit(100),
  ]);
  if (courses.error || tickets.error || certs.error)
    throw Error("Academy administration unavailable");
  const selected = courses.data?.find((c) => c.id === course);
  const { data: lessons, error: lessonError } =
    selected && teaching
      ? await i.db
          .from("lessons")
          .select("*")
          .eq("course_id", selected.id)
          .order("position")
      : { data: [], error: null };
  if (lessonError) throw Error("Lessons unavailable");
  return (
    <PageShell
      eyebrow="Academy administration"
      title="Develop learning. Support progress."
    >
      <div className="mb-8 flex flex-wrap gap-5">
        <a className="text-link" href="/admin">
          ← Main staff workspace
        </a>
        <a className="text-link" href="/admin/integrations">
          Email & payments
        </a>
        <a className="text-link" href="/api/admin/academy-export">
          Export Academy records (CSV)
        </a>
      </div>
      <section className="platform-panel">
        <h2 className="text-2xl font-bold">Courses</h2>
        <p className="mt-4 text-slate-600">
          Create courses and enrol learners in the main workspace. Select a
          course here to edit its learning details and assessment.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {courses.data?.map((c) => (
            <a
              key={c.id}
              className="platform-panel service-link"
              href={`/admin/learning?course=${c.id}`}
            >
              <strong>{c.title}</strong>
              <p className="mt-2 text-sm">{c.status}</p>
            </a>
          ))}
          {!courses.data?.length && <p>No courses created yet.</p>}
        </div>
      </section>
      {teaching && selected && (
        <>
          <form action={editCourse} className="platform-panel mt-8">
            <h2 className="text-2xl font-bold">Edit {selected.title}</h2>
            <input type="hidden" name="id" value={selected.id} />
            <Field
              name="title"
              label="Course title"
              value={selected.title}
              required
            />
            <Field name="category" label="Category" value={selected.category} />
            <label className="form-label mt-4">
              Description
              <textarea
                name="description"
                className="form-input"
                rows={5}
                maxLength={15000}
                required
                defaultValue={selected.description}
              />
            </label>
            <Field
              name="duration_text"
              label="Duration / arrangement (approved details only)"
              value={selected.duration_text}
            />
            <label className="form-label mt-4">
              Learning objectives
              <textarea
                name="objectives"
                maxLength={5000}
                className="form-input"
                rows={4}
                defaultValue={selected.objectives}
              />
            </label>
            <label className="form-label mt-4">
              Prerequisites
              <textarea
                name="prerequisites"
                maxLength={5000}
                className="form-input"
                rows={3}
                defaultValue={selected.prerequisites}
              />
            </label>
            <Field
              name="price_minor"
              label="Fee in kobo (NGN); leave blank for enquiry, 0 for free"
              value={selected.price_minor ?? ""}
              type="number"
            />
            <Field
              name="instructor_id"
              label="Verified instructor account ID (optional)"
              value={selected.instructor_id || ""}
            />
            <label className="form-label mt-4">
              Publication
              <select
                className="form-input"
                name="status"
                defaultValue={selected.status}
              >
                {["draft", "published", "archived"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <button className="primary-button mt-6">Save course</button>
          </form>
          <section className="mt-8">
            <h2 className="text-2xl font-bold">Lessons</h2>
            {lessons?.map((l) => (
              <form
                className="platform-panel mt-5"
                key={l.id}
                action={editLesson}
              >
                <input type="hidden" name="id" value={l.id} />
                <Field
                  name="title"
                  label="Lesson title"
                  value={l.title}
                  required
                />
                <label className="form-label mt-4">
                  Lesson body
                  <textarea
                    name="body"
                    required
                    className="form-input"
                    rows={7}
                    maxLength={50000}
                    defaultValue={l.body}
                  />
                </label>
                <Field
                  name="position"
                  label="Position"
                  type="number"
                  value={l.position}
                  required
                />
                <label className="mt-4 flex gap-3">
                  <input
                    type="checkbox"
                    name="published"
                    defaultChecked={l.published}
                  />{" "}
                  Published
                </label>
                <button className="primary-button mt-5">Save lesson</button>
              </form>
            ))}
          </section>
          <form action={saveAssessment} className="platform-panel mt-8">
            <h2 className="text-2xl font-bold">
              Create or replace course assessment
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Replacing an assessment creates a new version. Existing results
              remain in history; learners must pass the current version for a
              new completion certificate.
            </p>
            <input type="hidden" name="course" value={selected.id} />
            <Field name="title" label="Assessment title" required />
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                name="pass_percent"
                label="Pass percentage"
                type="number"
                value={70}
                required
              />
              <Field
                name="max_attempts"
                label="Maximum attempts (1–10)"
                type="number"
                value={3}
                required
              />
            </div>
            <AssessmentEditor />
            <label className="mt-5 flex gap-3">
              <input name="published" type="checkbox" />
              Publish assessment to enrolled learners
            </label>
            <button className="primary-button mt-5">Save assessment</button>
          </form>
        </>
      )}
      {sales && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold">Support requests</h2>
          {tickets.data?.map((t) => (
            <article key={t.id} className="platform-panel mt-5">
              <p className="section-kicker">{t.status}</p>
              <h3 className="mt-3 text-xl font-bold">{t.subject}</h3>
              <p className="mt-4 whitespace-pre-wrap leading-7">{t.body}</p>
              {t.support_replies?.map((r: { id: string; body: string }) => (
                <p key={r.id} className="mt-4 border-l-2 border-blue-300 pl-5">
                  {r.body}
                </p>
              ))}
              <form action={replyTicket} className="mt-5">
                <input type="hidden" name="ticket" value={t.id} />
                <label className="form-label">
                  Reply
                  <textarea
                    name="body"
                    className="form-input"
                    required
                    minLength={2}
                    maxLength={5000}
                  />
                </label>
                <button className="secondary-button mt-4">Save reply</button>
              </form>
              <form action={updateTicket} className="mt-5 flex gap-4">
                <input type="hidden" name="id" value={t.id} />
                <select
                  name="status"
                  defaultValue={t.status}
                  className="form-input"
                >
                  {["open", "in_progress", "resolved"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button className="primary-button">Update status</button>
              </form>
            </article>
          ))}
        </section>
      )}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Completion certificates</h2>
        {!certs.data?.length && (
          <p className="mt-5">No certificates issued yet.</p>
        )}
        {certs.data?.map((c) => (
          <article className="platform-panel mt-5" key={c.id}>
            <h3 className="font-bold">
              {c.holder_name} · {c.course_title}
            </h3>
            <a
              className="text-link mt-4"
              href={`/academy/certificates/${c.code}`}
            >
              Verify record ↗
            </a>
            {i.role === "admin" && (
              <form action={certificateStatus} className="mt-4">
                <input type="hidden" name="id" value={c.id} />
                <input
                  type="hidden"
                  name="restore"
                  value={c.revoked_at ? "yes" : "no"}
                />
                <button className="secondary-button">
                  {c.revoked_at
                    ? "Restore certificate validity"
                    : "Withdraw certificate validity"}
                </button>
              </form>
            )}
          </article>
        ))}
      </section>
    </PageShell>
  );
}
