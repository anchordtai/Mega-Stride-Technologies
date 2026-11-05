import { redirect } from "next/navigation";
import PageShell from "@/components/page-shell";
import { currentIdentity } from "@/lib/supabase/server";
import { databaseReady } from "@/lib/supabase/config";
import { accountAction } from "@/app/account/actions";
export const metadata = {
  title: "Learner dashboard",
  robots: { index: false, follow: false },
};
export default async function Dashboard() {
  if (!databaseReady()) redirect("/account?notice=unavailable");
  const identity = await currentIdentity();
  if (!identity) redirect("/account");
  const { data, error } = await identity.db
    .from("enrolments")
    .select("id,status,courses(id,title,slug)")
    .eq("user_id", identity.user.id)
    .in("status", ["active", "completed"]);
  if (error) throw Error("Your learning records could not be loaded.");
  return (
    <PageShell
      eyebrow="Mega Stride Academy"
      title="Your learning workspace."
      intro="Access the courses in which your enrolment has been confirmed."
    >
      <div className="mb-8 flex flex-wrap gap-5">
        <form action={accountAction}>
          <input type="hidden" name="mode" value="logout" />
          <button className="font-bold text-blue-700">Sign out</button>
        </form>
        {identity.role && (
          <a href="/admin" className="font-bold text-blue-700">
            Staff workspace →
          </a>
        )}
      </div>
      {!data?.length ? (
        <div className="platform-panel">
          <h2 className="text-2xl font-bold">No active enrolments yet.</h2>
          <p className="mt-4 leading-7 text-slate-600">
            The Academy team will confirm your course access after reviewing the
            enrolment requirements.
          </p>
          <a href="/academy" className="primary-button mt-6">
            Explore learning pathways →
          </a>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {data.map((e) => {
            const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
            return (
              <article className="platform-panel" key={e.id}>
                <p className="section-kicker">{e.status}</p>
                <h2 className="mt-4 text-2xl font-bold">{course?.title}</h2>
                <a
                  href={`/academy/learn/${course?.id}`}
                  className="primary-button mt-6"
                >
                  Open course →
                </a>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
