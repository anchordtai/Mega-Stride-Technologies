import PageShell from "@/components/page-shell";
import { requireLearner } from "@/lib/academy";
import { accountAction } from "@/app/account/actions";
export const metadata = {
  title: "Learner dashboard",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const i = await requireLearner();
  const [enrolments, progress, certs, profile] = await Promise.all([
    i.db
      .from("enrolments")
      .select("id,status,course_id,courses(id,title,slug)")
      .eq("user_id", i.user.id)
      .order("created_at", { ascending: false }),
    i.db.from("lesson_progress").select("lesson_id").eq("user_id", i.user.id),
    i.db
      .from("certificates")
      .select("code,course_title,revoked_at")
      .eq("user_id", i.user.id),
    i.db
      .from("profiles")
      .select("display_name")
      .eq("id", i.user.id)
      .maybeSingle(),
  ]);
  if (enrolments.error || progress.error || certs.error || profile.error)
    throw Error("Learning records could not be loaded");
  const ids = (enrolments.data || []).map((e) => e.course_id);
  const { data: lessons, error: lessonError } = ids.length
    ? await i.db
        .from("lessons")
        .select("id,course_id")
        .in("course_id", ids)
        .eq("published", true)
    : { data: [], error: null };
  if (lessonError) throw Error("Progress unavailable");
  const completed = new Set(progress.data?.map((p) => p.lesson_id));
  return (
    <PageShell
      eyebrow="Mega Stride Academy"
      title={
        profile.data?.display_name
          ? `Welcome, ${profile.data.display_name}.`
          : "Your learning workspace."
      }
      intro="Your courses, progress, assessments and support in one place."
    >
      <nav aria-label="Learner workspace" className="mb-8 flex flex-wrap gap-5">
        {[
          ["Profile", "/academy/profile"],
          ["Payments & receipts", "/academy/payments"],
          ["Support", "/academy/support"],
          ["Course catalogue", "/academy"],
        ].map(([l, h]) => (
          <a className="text-link" key={h} href={h}>
            {l} ↗
          </a>
        ))}
        {i.role && (
          <a className="text-link" href={i.isSuperAdmin ? "/super-admin" : i.role === "instructor" ? "/instructor" : "/admin"}>
            {i.isSuperAdmin ? "Super-admin dashboard" : i.role === "instructor" ? "Instructor workspace" : "Staff workspace"} ↗
          </a>
        )}
        <form action={accountAction}>
          <input name="mode" type="hidden" value="logout" />
          <button className="text-link">Sign out</button>
        </form>
      </nav>
      {!profile.data && (
        <p className="platform-panel mb-8">
          Add your name in{" "}
          <a className="text-link" href="/academy/profile">
            your learner profile
          </a>{" "}
          before requesting certificates.
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        {[
          [
            "Active courses",
            (enrolments.data || []).filter((e) =>
              ["active", "completed"].includes(e.status),
            ).length,
          ],
          ["Lessons marked complete", completed.size],
          [
            "Valid certificates",
            (certs.data || []).filter((c) => !c.revoked_at).length,
          ],
        ].map(([l, n]) => (
          <div className="platform-panel" key={l}>
            <p className="section-kicker">{l}</p>
            <p className="mt-4 text-4xl font-bold">{n}</p>
          </div>
        ))}
      </div>
      <section className="mt-10">
        <h2 className="text-3xl font-bold">Your courses</h2>
        {!enrolments.data?.length && (
          <div className="platform-panel mt-6">
            <p>
              No enrolments yet. Explore the published courses or discuss a
              learning pathway.
            </p>
            <a href="/academy" className="primary-button mt-5">
              Explore the Academy ↗
            </a>
          </div>
        )}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {enrolments.data?.map((e) => {
            const c = Array.isArray(e.courses) ? e.courses[0] : e.courses;
            const total = (lessons || []).filter(
              (l) => l.course_id === e.course_id,
            );
            const done = total.filter((l) => completed.has(l.id)).length;
            return (
              <article key={e.id} className="platform-panel">
                <p className="section-kicker">{e.status}</p>
                <h3 className="mt-4 text-2xl font-bold">
                  {c?.title || "Course"}
                </h3>
                <p className="mt-4 text-sm">
                  {done} of {total.length} published lessons marked complete
                </p>
                <progress
                  className="mt-4 w-full"
                  max={Math.max(total.length, 1)}
                  value={done}
                  aria-label={`Lesson progress for ${c?.title || "course"}`}
                />
                {["active", "completed"].includes(e.status) ? (
                  <a
                    className="primary-button mt-5"
                    href={`/academy/learn/${e.course_id}`}
                  >
                    Continue learning ↗
                  </a>
                ) : (
                  <a className="text-link mt-5" href="/academy/support">
                    Ask about access ↗
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </section>
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Your certificates</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {certs.data?.map((c) => (
            <article key={c.code} className="platform-panel">
              <h3 className="text-xl font-bold">{c.course_title}</h3>
              <p className="mt-3 text-sm">
                {c.revoked_at
                  ? "Withdrawn — contact the Academy"
                  : "Completion verified"}
              </p>
              <a
                className="text-link mt-5"
                href={`/academy/certificates/${c.code}`}
              >
                Verification record ↗
              </a>
              {!c.revoked_at && (
                <a
                  className="primary-button mt-5"
                  href={`/api/academy/certificates/${c.code}`}
                >
                  Download PDF ↓
                </a>
              )}
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
