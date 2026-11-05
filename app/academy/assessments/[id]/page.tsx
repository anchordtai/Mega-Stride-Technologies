import { notFound } from "next/navigation";
import PageShell from "@/components/page-shell";
import { requireLearner } from "@/lib/academy";
import { submitAssessment } from "../../actions";
export const metadata = {
  title: "Course assessment",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const i = await requireLearner();
  const { id } = await params;
  const { notice } = await searchParams;
  const { data: a, error } = await i.db
    .from("assessments")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  if (error) throw Error("Assessment unavailable");
  if (!a) notFound();
  const { data: attempts, error: attemptError } = await i.db
    .from("assessment_attempts")
    .select("score,passed,attempt_no,submitted_at")
    .eq("assessment_id", id)
    .eq("version", a.version)
    .eq("user_id", i.user.id)
    .order("attempt_no");
  if (attemptError) throw Error("Assessment history unavailable");
  const questions = a.questions as { prompt: string; options: string[] }[];
  const used = attempts?.length || 0;
  return (
    <PageShell
      eyebrow="Course assessment"
      title={a.title}
      intro={`Pass mark ${a.pass_percent}%. ${used} of ${a.max_attempts} attempts used for this version.`}
    >
      <a href={`/academy/learn/${a.course_id}`} className="text-link">
        ← Course lessons
      </a>
      {notice === "review" && (
        <p role="alert" className="platform-panel mt-6">
          We could not record this attempt. Check your enrolment, attempt limit
          and current assessment version, then refresh.
        </p>
      )}
      {!!attempts?.length && (
        <section className="platform-panel mt-7">
          <h2 className="text-xl font-bold">Your results</h2>
          {attempts.map((t) => (
            <p key={t.attempt_no} className="mt-3">
              Attempt {t.attempt_no}: {t.score}% ·{" "}
              {t.passed ? "Passed" : "Not passed"}
            </p>
          ))}
        </section>
      )}
      {used < a.max_attempts ? (
        <form action={submitAssessment} className="mt-8 space-y-6">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="version" value={a.version} />
          <input type="hidden" name="count" value={questions.length} />
          {questions.map((q, n) => (
            <fieldset key={n} className="platform-panel">
              <legend className="font-bold">Question {n + 1}</legend>
              <p className="mb-5 text-lg">{q.prompt}</p>
              {q.options.map((o, j) => (
                <label
                  key={j}
                  className="my-3 flex items-start gap-3 leading-7"
                >
                  <input
                    className="mt-2"
                    type="radio"
                    required
                    name={`answer_${n}`}
                    value={j}
                  />
                  <span>{o}</span>
                </label>
              ))}
            </fieldset>
          ))}
          <button className="primary-button">Submit assessment</button>
          <p className="text-sm text-slate-500">
            Submitting uses one attempt. Answers are graded on the server.
          </p>
        </form>
      ) : (
        <p className="platform-panel mt-7">
          You have used the available attempts. Contact the Academy if you need
          a review.
        </p>
      )}
    </PageShell>
  );
}
