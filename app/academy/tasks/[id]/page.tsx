import { notFound } from "next/navigation";
import PageShell from "@/components/page-shell";
import { requireLearner } from "@/lib/academy";
import { submitPractical } from "../actions";
export const metadata = {
  title: "Practical learning task",
  robots: { index: false, follow: false },
};
export default async function Task({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const i = await requireLearner();
  const { id } = await params;
  const { data: t, error } = await i.db
    .from("academy_tasks")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  if (error) throw Error("Task unavailable.");
  if (!t) notFound();
  const { data: access } = await i.db.rpc("my_learning_access", {
    p_course: t.course_id,
  });
  if (!access) notFound();
  const { data: submissions, error: se } = await i.db
    .from("academy_submissions")
    .select("id,version,body,score,feedback,submitted_at")
    .eq("task_id", id)
    .eq("user_id", i.user.id)
    .order("submitted_at", { ascending: false });
  if (se) throw Error("Submission history unavailable.");
  return (
    <PageShell
      eyebrow="Practical learning"
      title={t.title}
      intro={`${t.kind} · ${t.max_marks} marks · Pass mark ${t.pass_marks}`}
    >
      <a className="text-link" href={`/academy/learn/${t.course_id}`}>
        ← Return to course
      </a>
      <article className="platform-panel mt-7 whitespace-pre-wrap leading-8">
        {t.instructions}
      </article>
      <form action={submitPractical} className="platform-panel mt-7">
        <input type="hidden" name="task" value={t.id} />
        <label className="form-label">
          Your evidence and explanation
          <textarea
            className="form-input"
            name="body"
            rows={12}
            minLength={20}
            maxLength={30000}
            required
          />
        </label>
        <p className="my-4 text-sm text-slate-600">
          Explain your process, test results and troubleshooting. Include
          sanitized evidence text. Do not submit passwords, API keys or personal
          customer data. Up to five submissions per task version are allowed.
        </p>
        <button className="primary-button">Submit for instructor review</button>
      </form>
      <section className="mt-10">
        <h2 className="text-2xl font-bold">Your submission history</h2>
        {submissions?.map((s) => (
          <article className="platform-panel mt-5" key={s.id}>
            <p className="section-kicker">
              {s.score === null
                ? "Awaiting instructor review"
                : `${s.score}/${t.max_marks} marks`}{" "}
              · Version {s.version}
            </p>
            <p className="mt-4 whitespace-pre-wrap">
              {s.feedback || "Feedback will appear here after review."}
            </p>
            <details className="mt-4">
              <summary>View your submitted evidence</summary>
              <p className="mt-4 whitespace-pre-wrap">{s.body}</p>
            </details>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
