type Submission = {
  id: string;
  user_id: string;
  score: number | null;
  body: string;
  feedback: string | null;
};
import PageShell from "@/components/page-shell";
import { requireStaff } from "@/lib/staff";
import { requireTeachingCourse } from "@/lib/teaching";
import {
  saveAcademicDocument,
  gradePractical,
  savePracticalTask,
  learningOverride,
  addAcademicDocument,
} from "./actions";
export const metadata = {
  title: "Instructor workspace",
  robots: { index: false, follow: false },
};
export default async function Instructor({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const i = await requireStaff(["admin", "instructor"]);
  const { course } = await searchParams;
  let q = i.db
    .from("courses")
    .select("id,title,status,academic_status,instructor_id")
    .order("title");
  if (i.role !== "admin") q = q.eq("instructor_id", i.user.id);
  const { data: courses, error } = await q;
  if (error) throw Error("Teaching workspace unavailable.");
  const selected = courses?.find((c) => c.id === course);
  if (selected) await requireTeachingCourse(selected.id);
  const [docs, tasks, enrolments, lessons] = selected
    ? await Promise.all([
        i.db
          .from("academic_documents")
          .select("*")
          .eq("course_id", selected.id)
          .order("title"),
        i.db
          .from("academy_tasks")
          .select("*,academy_submissions(*)")
          .eq("course_id", selected.id)
          .order("title"),
        i.db
          .from("enrolments")
          .select("user_id,status,created_at")
          .eq("course_id", selected.id),
        i.db
          .from("lessons")
          .select("id,title,module_id,lesson_progress(user_id)")
          .eq("course_id", selected.id)
          .eq("published", true)
          .order("position"),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ];
  if (docs.error || tasks.error || enrolments.error || lessons.error)
    throw Error("Course records unavailable.");
  const learnerIds = [
    ...new Set((enrolments.data || []).map((e) => e.user_id)),
  ];
  const { data: profiles, error: pe } = learnerIds.length
    ? await i.db.from("profiles").select("id,display_name").in("id", learnerIds)
    : { data: [], error: null };
  if (pe) throw Error("Learner profiles unavailable.");
  const learnerName = (id: string) =>
    profiles?.find((p) => p.id === id)?.display_name ||
    "Learner profile pending";
  return (
    <PageShell
      eyebrow="Instructor workspace"
      title="Teach with clarity. Support every learner."
      intro="Assigned courses, protected academic content and practical feedback in one workspace."
    >
      <nav className="mb-8 flex flex-wrap gap-5">
        <a className="text-link" href="/academy/dashboard">
          Learner workspace ↗
        </a>
        {i.role === "admin" && (
          <a className="text-link" href="/admin/learning">
            Academy administration ↗
          </a>
        )}
      </nav>
      <div className="grid gap-4 md:grid-cols-2">
        {courses?.map((c) => (
          <a
            key={c.id}
            href={`/instructor?course=${c.id}`}
            className="platform-panel"
          >
            <strong>{c.title}</strong>
            <p className="mt-3 text-sm">
              {c.status} · Academic review: {c.academic_status}
            </p>
          </a>
        ))}
        {!courses?.length && (
          <p>No courses have been assigned to this account.</p>
        )}
      </div>
      {selected && (
        <>
          <form action={addAcademicDocument} className="platform-panel mt-8">
            <h2 className="text-2xl font-bold">Create academic material</h2>
            <input type="hidden" name="course" value={selected.id} />
            <label className="form-label mt-4">
              Title
              <input
                className="form-input"
                name="title"
                minLength={2}
                maxLength={180}
                required
              />
            </label>
            <label className="form-label mt-4">
              Material type
              <select className="form-input" name="kind">
                <option value="lecture">Lecture</option>
                <option value="lab">Lab</option>
                <option value="question_bank">Question bank</option>
                <option value="answer_key">Restricted answer key</option>
                <option value="lesson_plan">Lesson plan</option>
                <option value="project">Project brief</option>
              </select>
            </label>
            <label className="form-label mt-4">
              Audience
              <select className="form-input" name="audience">
                <option value="student">Student draft</option>
                <option value="instructor">Instructor only</option>
              </select>
            </label>
            <label className="form-label mt-4">
              Content
              <textarea
                className="form-input"
                name="body"
                minLength={20}
                maxLength={200000}
                rows={10}
                required
              />
            </label>
            <p className="my-4 text-sm">
              New material is saved as a draft. Answer keys are always
              instructor-only. An administrator must approve student release.
            </p>
            <button className="primary-button">Save academic draft</button>
          </form>

          <section className="platform-panel mt-8">
            <h2 className="text-2xl font-bold">
              {selected.title} · Learner progress
            </h2>
            <p className="my-4 text-sm">
              Progress counts completed published lesson records. No unreliable
              time-spent estimate is reported. Financial transaction details are
              restricted to administration.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th>Learner</th>
                    <th>Access record</th>
                    <th>Lessons complete</th>
                    <th>Next action</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolments.data?.map((e) => {
                    const done =
                      lessons.data?.filter((l) =>
                        l.lesson_progress?.some((p) => p.user_id === e.user_id),
                      ).length || 0;
                    return (
                      <tr key={e.user_id}>
                        <td className="py-4 break-all">{e.user_id}</td>
                        <td>{e.status}</td>
                        <td>
                          {done} / {lessons.data?.length}
                        </td>
                        <td>
                          {done === 0
                            ? "Offer onboarding support"
                            : done < (lessons.data?.length || 0)
                              ? "Review next lesson"
                              : "Review practical work"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <section className="mt-10">
            <h2 className="text-2xl font-bold">Academic library</h2>
            <p className="my-4">
              Instructor documents and answer keys are restricted to this
              course’s teaching team. Draft material is not ready for student
              delivery.
            </p>
            {docs.data?.map((d) => (
              <details className="platform-panel mt-4" key={d.id}>
                <summary>
                  {d.title} · {d.audience} · {d.status} · v{d.version}
                </summary>
                <form action={saveAcademicDocument} className="mt-6">
                  <input type="hidden" name="course" value={selected.id} />
                  <input type="hidden" name="id" value={d.id} />
                  <label className="form-label">
                    Title
                    <input
                      className="form-input"
                      name="title"
                      defaultValue={d.title}
                      maxLength={180}
                      required
                    />
                  </label>
                  <label className="form-label mt-4">
                    Academic content
                    <textarea
                      className="form-input"
                      name="body"
                      rows={16}
                      defaultValue={d.body}
                      maxLength={200000}
                      required
                    />
                  </label>
                  <label className="form-label mt-4">
                    Review status
                    <select
                      className="form-input"
                      name="status"
                      defaultValue={d.status}
                    >
                      <option value="draft">Draft</option>
                      <option value="review">Ready for review</option>
                      {i.role === "admin" && (
                        <option value="approved">Approved</option>
                      )}
                    </select>
                  </label>
                  <button className="primary-button mt-5">
                    Save reviewed changes
                  </button>
                </form>
              </details>
            ))}
          </section>
          <section className="mt-10">
            <h2 className="text-2xl font-bold">Practical work & feedback</h2>
            {tasks.data?.map((t) => (
              <article className="platform-panel mt-5" key={t.id}>
                <h3 className="text-xl font-bold">{t.title}</h3>
                <p className="mt-3">
                  {t.kind} · {t.published ? "Published" : "Draft"} · Pass{" "}
                  {t.pass_marks}/{t.max_marks}
                </p>
                <p className="mt-4 whitespace-pre-wrap">{t.instructions}</p>
                {t.academy_submissions?.map((s: Submission) => (
                  <details className="mt-5 border-t pt-5" key={s.id}>
                    <summary>
                      Submission from {learnerName(s.user_id)} ·{" "}
                      {s.score === null
                        ? "Awaiting grade"
                        : `${s.score}/${t.max_marks}`}
                    </summary>
                    <p className="my-5 whitespace-pre-wrap">{s.body}</p>
                    <form action={gradePractical}>
                      <input type="hidden" name="course" value={selected.id} />
                      <input type="hidden" name="submission" value={s.id} />
                      <label className="form-label">
                        Mark
                        <input
                          className="form-input"
                          name="score"
                          type="number"
                          min={0}
                          max={t.max_marks}
                          required
                          defaultValue={s.score ?? ""}
                        />
                      </label>
                      <label className="form-label mt-4">
                        Feedback
                        <textarea
                          className="form-input"
                          name="feedback"
                          minLength={10}
                          maxLength={5000}
                          rows={4}
                          required
                          defaultValue={s.feedback || ""}
                        />
                      </label>
                      <button className="primary-button mt-4">
                        Record grade & feedback
                      </button>
                    </form>
                  </details>
                ))}
              </article>
            ))}
          </section>
          <form action={savePracticalTask} className="platform-panel mt-8">
            <h2 className="text-2xl font-bold">Create a practical task</h2>
            <input type="hidden" name="course" value={selected.id} />
            <label className="form-label mt-4">
              Title
              <input
                className="form-input"
                name="title"
                minLength={2}
                maxLength={180}
                required
              />
            </label>
            <label className="form-label mt-4">
              Type
              <select className="form-input" name="kind">
                <option value="lab">Laboratory exercise</option>
                <option value="assignment">Assignment</option>
                <option value="project">Final project</option>
                <option value="short_answer">Short answer</option>
              </select>
            </label>
            <label className="form-label mt-4">
              Student instructions
              <textarea
                className="form-input"
                name="instructions"
                minLength={20}
                maxLength={20000}
                rows={7}
                required
              />
            </label>
            <label className="form-label mt-4">
              Maximum marks
              <input
                className="form-input"
                name="max_marks"
                type="number"
                min={1}
                max={1000}
                defaultValue={100}
                required
              />
            </label>
            <label className="form-label mt-4">
              Pass marks
              <input
                className="form-input"
                name="pass_marks"
                type="number"
                min={1}
                max={1000}
                defaultValue={70}
                required
              />
            </label>
            {i.role === "admin" && (
              <label className="mt-4 flex gap-3">
                <input name="published" type="checkbox" />
                Approve publication
              </label>
            )}
            <button className="primary-button mt-5">Save task</button>
          </form>
          {i.role === "admin" && (
            <form action={learningOverride} className="platform-panel mt-8">
              <h2 className="text-2xl font-bold">
                Audited administrator access exception
              </h2>
              <p className="mt-4">
                Use only for an approved scholarship or documented access
                decision. This does not create a payment or receipt. Every
                decision is recorded in the audit log.
              </p>
              <input type="hidden" name="course" value={selected.id} />
              <label className="form-label mt-4">
                Learner account ID
                <input className="form-input" name="user" required />
              </label>
              <label className="form-label mt-4">
                Reason
                <textarea
                  className="form-input"
                  name="reason"
                  minLength={20}
                  maxLength={2000}
                  rows={3}
                  required
                />
              </label>
              <label className="mt-4 flex gap-3">
                <input name="revoke" type="checkbox" />
                Revoke this exception
              </label>
              <button className="secondary-button mt-5">
                Record access decision
              </button>
            </form>
          )}
        </>
      )}
    </PageShell>
  );
}
