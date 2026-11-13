import { FAQ, EditorialImage, SectionHeading } from "@/components/design";
import PageShell from "@/components/page-shell";
import { pathwayVisual } from "@/lib/visuals";
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
      image="/images/mega-stride/academy/academy.webp"
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
        <a href="/account/signup" className="self-center px-4 font-bold text-blue-700">Create an account →</a>
        <a href="/account" className="self-center px-4 font-bold text-blue-700">
          Learner sign in
        </a>
      </div>
      <div className="learner-banner">
        <div>
          <strong>Learning built around your objectives.</strong>
          <p>
            Availability, instructor, schedule, fees and terms are confirmed
            before enrolment.
          </p>
        </div>
        <a className="text-link" href="/academy/register">
          Discuss team training ↗
        </a>
      </div>
      <section className="mb-14">
        <SectionHeading
          kicker="For confirmed enrolments"
          title="A workspace that supports your progress."
          description="Course access and published materials depend on your enrolment. Each course defines its own lessons and assessment."
        />
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {[
            [
              "01",
              "Learn & track progress",
              "Open your enrolled courses, read lessons and download permitted private learning materials.",
            ],
            [
              "02",
              "Assess & complete",
              "Take published assessments and request a completion certificate after meeting the course requirements.",
            ],
            [
              "03",
              "Records & support",
              "Manage your profile, view verified payment receipts and ask the Academy for help.",
            ],
          ].map(([n, t, d]) => (
            <article key={n} className="platform-panel">
              <p className="section-kicker">{n} / LEARNER WORKSPACE</p>
              <h3 className="mt-5 text-xl font-bold">{t}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{d}</p>
            </article>
          ))}
        </div>
        <a className="text-link mt-7" href="/academy/dashboard">
          Sign in to your learning workspace ↗
        </a>
      </section>
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
              <article key={c.id} className="pathway-card">
                <EditorialImage
                  src={pathwayVisual(c.category || c.title)}
                  alt="Illustrative technology learning concept"
                  className="pathway-visual"
                />
                <p className="section-kicker">{c.category}</p>
                <h3 className="mt-5 text-xl font-bold">{c.title}</h3>
                <p className="mt-4 leading-7 text-slate-600">
                  {c.description.slice(0, 180)}
                </p>
                {c.price_minor !== null && (
                  <p className="mt-5 text-lg font-extrabold text-blue-800">
                    {new Intl.NumberFormat("en-NG", { style: "currency", currency: c.currency, maximumFractionDigits: 0 }).format(c.price_minor / 100)}
                    <span className="ml-2 text-sm font-normal text-slate-500">per course</span>
                  </p>
                )}
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
              <article key={title} className="pathway-card">
                <EditorialImage
                  src={pathwayVisual(title)}
                  alt={`AI illustration for the ${title} learning pathway`}
                  className="pathway-visual"
                />
                <p className="section-kicker mt-5">Training enquiries</p>
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
      <section className="faq-section">
        <SectionHeading
          kicker="Your learning journey"
          title="A clear next step."
        />
        <FAQ
          items={[
            [
              "How do I choose a pathway?",
              "Tell us your experience, objectives and preferred format. We can discuss the pathway that best fits your learning needs.",
            ],
            [
              "Are fees and schedules available?",
              "Confirmed course availability, fees, schedules and instructor information are shared before enrolment. A training enquiry does not commit you to payment.",
            ],
            [
              "Does training award a manufacturer certification?",
              "Mega Stride provides independent training. Manufacturer certifications are awarded under the relevant vendor’s own examination and eligibility requirements.",
            ],
            [
              "Where do existing learners sign in?",
              "Use Learner workspace or Learner sign in to access your account. Access to course materials depends on your confirmed enrolments.",
            ],
          ]}
        />
      </section>
    </PageShell>
  );
}
