import { redirect, notFound } from "next/navigation";
import PageShell from "@/components/page-shell";
import { currentIdentity } from "@/lib/supabase/server";
import { databaseReady } from "@/lib/supabase/config";
import { completeLesson } from "./actions";
export const metadata = {
  title: "Course learning",
  robots: { index: false, follow: false },
};
export default async function Learn({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!databaseReady()) redirect("/account?notice=unavailable");
  const i = await currentIdentity();
  if (!i) redirect("/account");
  const { id } = await params;
  const { data: enrolment } = await i.db
    .from("enrolments")
    .select("id")
    .eq("course_id", id)
    .eq("user_id", i.user.id)
    .in("status", ["active", "completed"])
    .maybeSingle();
  if (!enrolment) notFound();
  const [course, lessons, progress] = await Promise.all([
    i.db.from("courses").select("title").eq("id", id).single(),
    i.db
      .from("lessons")
      .select("id,title,body,resources(id,title)")
      .eq("course_id", id)
      .eq("published", true)
      .order("position"),
    i.db.from("lesson_progress").select("lesson_id").eq("user_id", i.user.id),
  ]);
  if (course.error || lessons.error || progress.error)
    throw Error("The course could not be loaded.");
  const done = new Set(progress.data.map((p) => p.lesson_id));
  return (
    <PageShell eyebrow="Your learning" title={course.data.title}>
      <a className="font-bold text-blue-700" href="/academy/dashboard">
        ← My courses
      </a>
      <p className="my-6 text-slate-600">
        {lessons.data.filter((l) => done.has(l.id)).length} of{" "}
        {lessons.data.length} published lessons marked complete.
      </p>
      <div className="space-y-6">
        {lessons.data.length === 0 && (
          <p className="platform-panel">
            Your instructor has not published lessons yet.
          </p>
        )}
        {lessons.data.map((l) => (
          <article key={l.id} className="platform-panel">
            <h2 className="text-2xl font-bold">{l.title}</h2>
            <p className="mt-5 whitespace-pre-wrap leading-8 text-slate-700">
              {l.body}
            </p>
            {l.resources?.map((r) => (
              <a
                className="mt-5 block font-bold text-blue-700"
                key={r.id}
                href={`/api/resources/${r.id}`}
              >
                Download {r.title} (PDF) ↓
              </a>
            ))}
            {done.has(l.id) ? (
              <p className="mt-5 font-bold text-green-800">Marked complete</p>
            ) : (
              <form action={completeLesson}>
                <input type="hidden" name="lesson" value={l.id} />
                <input type="hidden" name="course" value={id} />
                <button className="primary-button mt-6">
                  Mark lesson complete
                </button>
              </form>
            )}
          </article>
        ))}
      </div>
    </PageShell>
  );
}
