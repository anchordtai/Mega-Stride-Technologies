import PageShell from "@/components/page-shell";
import { pathways } from "@/lib/company";
import { databaseReady } from "@/lib/supabase/config";
import { userDatabase } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Mega Stride Academy",
  "Explore independent technology training in networking, software, cybersecurity, Linux, cloud and emerging technologies in Abuja, Nigeria.",
  "/academy",
);
export default async function Academy() {
  let courses: {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: string;
    price_minor: number | null;
    currency: string;
  }[] = [];
  let unavailable = false;
  if (databaseReady()) {
    const db = await userDatabase();
    const result = await db
      .from("courses")
      .select("id,slug,title,description,category,price_minor,currency")
      .eq("status", "published")
      .order("title");
    courses = result.data || [];
    unavailable = !!result.error;
  }
  return (
    <PageShell
      eyebrow="Mega Stride Academy"
      title="Practical skills. A stronger next step."
      intro="Professional learning pathways for people building careers and organisations developing technical capability."
    >
      <div className="mb-12 flex flex-wrap gap-4">
        <a href="/academy/register" className="primary-button">
          Discuss your training goals ↗
        </a>
        <a
          href="/academy/dashboard"
          className="rounded-full border border-slate-300 px-6 py-4 font-bold"
        >
          Learner workspace →
        </a>
        <a href="/account" className="self-center px-4 font-bold text-blue-700">
          Sign in / create account
        </a>
      </div>
      <section id="courses">
        <p className="section-kicker">Learning pathways</p>
        <h2 className="mt-4 text-3xl font-bold">
          Build capability with purpose.
        </h2>
        <p className="mt-5 max-w-3xl leading-8 text-slate-600">
          Training can support professional development and preparation for
          certification journeys. Independent training does not confer
          manufacturer certification or imply manufacturer authorisation.
        </p>
        {unavailable && (
          <p role="status" className="mt-6">
            Published course details are temporarily unavailable.
          </p>
        )}
        {courses.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <article key={c.id} className="platform-panel">
                <p className="section-kicker">{c.category}</p>
                <h3 className="mt-5 text-xl font-bold">{c.title}</h3>
                <p className="mt-4 leading-7 text-slate-600">
                  {c.description.slice(0, 180)}
                </p>
                <a
                  className="mt-6 inline-block font-bold text-blue-700"
                  href={`/academy/courses/${c.slug}`}
                >
                  View course →
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pathways.map((title) => (
              <article key={title} className="platform-panel">
                <p className="section-kicker">Training enquiries</p>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <a
                  className="mt-6 inline-block font-bold text-blue-700"
                  href={`/academy/register?course=${encodeURIComponent(title)}`}
                >
                  Ask about this pathway →
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="platform-panel mt-12">
        <h2 className="text-2xl font-bold">Plan your learning arrangement.</h2>
        <p className="mt-5 max-w-3xl leading-8 text-slate-600">
          Share your experience level, objectives and preferred format. We will
          confirm course availability, instructor, schedule, fees and terms
          before you enrol.
        </p>
      </section>
    </PageShell>
  );
}
