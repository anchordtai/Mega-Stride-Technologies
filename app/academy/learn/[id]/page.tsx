import { notFound } from "next/navigation";
import AcademicText from "@/components/academic-text";
import PageShell from "@/components/page-shell";
import { requireLearner } from "@/lib/academy";
import { requestCertificate } from "@/app/academy/actions";
import { completeLesson, resumeLesson } from "./actions";
export const metadata = {
  title: "Course learning",
  robots: { index: false, follow: false },
};
export default async function Learn({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lesson?: string; notice?: string }>;
}) {
  const i = await requireLearner();
  const { id } = await params;
  const { lesson: requested, notice } = await searchParams;
  const { data: access, error: ae } = await i.db.rpc("my_learning_access", {
    p_course: id,
  });
  if (ae) throw Error("Course access could not be verified.");
  if (!access) notFound();
  const [
    course,
    lessons,
    progress,
    position,
    modules,
    docs,
    tasks,
    assessment,
  ] = await Promise.all([
    i.db.from("courses").select("title").eq("id", id).single(),
    i.db
      .from("lessons")
      .select("id,title,module_id,position")
      .eq("course_id", id)
      .eq("published", true)
      .order("position"),
    i.db.from("lesson_progress").select("lesson_id").eq("user_id", i.user.id),
    i.db
      .from("learning_positions")
      .select("lesson_id")
      .eq("user_id", i.user.id)
      .eq("course_id", id)
      .maybeSingle(),
    i.db
      .from("academy_modules")
      .select("id,title,position")
      .eq("course_id", id)
      .eq("published", true)
      .order("position"),
    i.db
      .from("academic_documents")
      .select("id,title,kind")
      .eq("course_id", id)
      .eq("audience", "student")
      .eq("status", "approved")
      .order("title"),
    i.db
      .from("academy_tasks")
      .select("id,title,kind")
      .eq("course_id", id)
      .eq("published", true)
      .order("title"),
    i.db
      .from("assessments")
      .select("id,title")
      .eq("course_id", id)
      .eq("published", true)
      .maybeSingle(),
  ]);
  if (
    [
      course,
      lessons,
      progress,
      position,
      modules,
      docs,
      tasks,
      assessment,
    ].some((r) => r.error)
  )
    throw Error("Your learning workspace could not be loaded.");
  const done = new Set(progress.data?.map((p) => p.lesson_id));
  const selected =
    lessons.data?.find(
      (l) => l.id === (requested || position.data?.lesson_id),
    ) ||
    lessons.data?.find((l) => !done.has(l.id)) ||
    lessons.data?.[0];
  const { data: detail, error: de } = selected
    ? await i.db
        .from("lessons")
        .select("body,resources(id,title)")
        .eq("id", selected.id)
        .single()
    : { data: null, error: null };
  if (de) throw Error("Lesson unavailable.");
  const complete = lessons.data?.filter((l) => done.has(l.id)).length || 0,
    total = lessons.data?.length || 0;
  return (
    <PageShell
      eyebrow="Your learning"
      title={course.data!.title}
      intro="Learn, practise and build evidence of your competence."
    >
      <a className="text-link" href="/academy/dashboard">
        ← My courses
      </a>
      {notice && (
        <p className="platform-panel mt-5" role="status">
          We could not complete that request. Check the course requirements or
          contact the Academy for help.
        </p>
      )}
      <section className="platform-panel mt-6">
        <p>
          {complete} / {total} lessons complete ·{" "}
          {total ? Math.floor((100 * complete) / total) : 0}%
        </p>
        <progress
          className="mt-4 w-full"
          value={complete}
          max={total || 1}
          aria-label="Course progress"
        />
      </section>
      <div className="mt-8 grid gap-8 lg:grid-cols-[.7fr_1.8fr]">
        <aside className="platform-panel">
          <h2 className="text-xl font-bold">Learning sequence</h2>
          {modules.data?.map((m) => (
            <section className="mt-6" key={m.id}>
              <h3 className="font-bold">{m.title}</h3>
              <p className="my-3 text-xs">
                {
                  lessons.data?.filter(
                    (l) => l.module_id === m.id && done.has(l.id),
                  ).length
                }{" "}
                / {lessons.data?.filter((l) => l.module_id === m.id).length}{" "}
                lessons complete
              </p>
              {lessons.data
                ?.filter((l) => l.module_id === m.id)
                .map((l) => (
                  <a
                    aria-current={l.id === selected?.id ? "page" : undefined}
                    className="my-3 block text-sm text-blue-700"
                    href={`?lesson=${l.id}`}
                    key={l.id}
                  >
                    {done.has(l.id) ? "✓ " : ""}
                    {l.title}
                  </a>
                ))}
            </section>
          ))}
          {lessons.data
            ?.filter((l) => !l.module_id)
            .map((l) => (
              <a
                className="my-4 block text-sm text-blue-700"
                href={`?lesson=${l.id}`}
                key={l.id}
              >
                {done.has(l.id) ? "✓ " : ""}
                {l.title}
              </a>
            ))}
        </aside>
        <div>
          {selected && detail ? (
            <article className="platform-panel">
              <h2 className="text-2xl font-bold">{selected.title}</h2>
              <AcademicText body={detail.body} />
              {detail.resources?.map((r) => (
                <a
                  key={r.id}
                  className="text-link mt-5"
                  href={`/api/resources/${r.id}`}
                >
                  Download {r.title} ↓
                </a>
              ))}
              <form action={resumeLesson} className="mt-6">
                <input type="hidden" name="course" value={id} />
                <input type="hidden" name="lesson" value={selected.id} />
                <button className="secondary-button">
                  Resume here next time
                </button>
              </form>
              {done.has(selected.id) ? (
                <p className="mt-5 text-green-800">Lesson marked complete</p>
              ) : (
                <form action={completeLesson} className="mt-5">
                  <input type="hidden" name="course" value={id} />
                  <input type="hidden" name="lesson" value={selected.id} />
                  <button className="primary-button">
                    Mark lesson complete
                  </button>
                </form>
              )}
            </article>
          ) : (
            <p className="platform-panel">
              Your instructor has not published lessons yet.
            </p>
          )}
          <section className="platform-panel mt-6">
            <h2 className="text-xl font-bold">Academic library</h2>
            {docs.data?.map((d) => (
              <a
                className="mt-4 block text-blue-700"
                key={d.id}
                href={`/academy/library/${d.id}`}
              >
                {d.title} · {d.kind} ↗
              </a>
            ))}
          </section>
          <section className="platform-panel mt-6">
            <h2 className="text-xl font-bold">Practical work</h2>
            {tasks.data?.map((t) => (
              <a
                className="mt-4 block text-blue-700"
                key={t.id}
                href={`/academy/tasks/${t.id}`}
              >
                {t.title} · {t.kind} ↗
              </a>
            ))}
          </section>
          <section className="platform-panel mt-6">
            <h2 className="text-xl font-bold">
              Assessment & certificate eligibility
            </h2>
            <p className="mt-4 leading-8">
              Complete the required lessons, pass the current final assessment
              and obtain passing grades for required practical work and the
              final project. Course-specific verified payment or an audited
              administrator exception is required.
            </p>
            {assessment.data && (
              <a
                className="primary-button mt-5"
                href={`/academy/assessments/${assessment.data.id}`}
              >
                Open {assessment.data.title} ↗
              </a>
            )}
            <form action={requestCertificate} className="mt-6">
              <input name="course" type="hidden" value={id} />
              <label className="flex gap-3 text-sm">
                <input type="checkbox" name="confirm" required />I have checked
                my profile name and want to issue my completion certificate. I
                understand that its name, course, date and status will be
                publicly verifiable by its unique certificate code.
              </label>
              <button className="secondary-button mt-5">
                Check eligibility & issue certificate
              </button>
            </form>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
