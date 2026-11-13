import CourseShare from "@/components/course-share";
import { courseRegistrationPath } from "@/lib/academy-navigation";
import { paymentMode } from "@/lib/payment-security";
import { notFound } from "next/navigation";
import PageShell from "@/components/page-shell";
import { userDatabase } from "@/lib/supabase/server";
import { databaseReady } from "@/lib/supabase/config";
import { pageMetadata } from "@/lib/seo";
async function course(slug: string) {
  if (!databaseReady()) return null;
  const db = await userDatabase();
  const { data } = await db
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await course(slug);
  return c
    ? pageMetadata(
        c.title,
        c.description.slice(0, 160),
        `/academy/courses/${slug}`,
      )
    : {};
}
export default async function Course({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await course(slug);
  if (!c) notFound();
  const mode = paymentMode();
  return (
    <PageShell eyebrow={c.category || "Mega Stride Academy"} title={c.title}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            name: c.title,
            description: c.description,
            provider: {
              "@type": "Organization",
              name: "Mega Stride Technologies Limited",
            },
          }).replace(/</g, "\u003c"),
        }}
      />
      <article className="platform-panel max-w-4xl">
        <p className="whitespace-pre-wrap text-lg leading-9">{c.description}</p>
        {c.duration_text && <p className="mt-6 font-bold">{c.duration_text}</p>}
        {c.objectives && (
          <section className="mt-7">
            <h2 className="text-xl font-bold">What you will learn</h2>
            <p className="mt-4 whitespace-pre-wrap leading-8">{c.objectives}</p>
          </section>
        )}
        {c.prerequisites && (
          <section className="mt-7">
            <h2 className="text-xl font-bold">Before you begin</h2>
            <p className="mt-4 whitespace-pre-wrap leading-8">
              {c.prerequisites}
            </p>
          </section>
        )}
        <p className="mt-6 font-bold">
          {c.price_minor === null
            ? "Contact the Academy for confirmed fees."
            : new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: c.currency,
              }).format(c.price_minor / 100)}
        </p>
        {c.price_minor > 0 && mode !== "live" && (
          <p role="status" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
            You can register your interest in this course now. Online payment is awaiting activation; your saved registration will remain pending until payment is available and verified.
          </p>
        )}
        {c.starts_at && (
          <p className="mt-4">
            Starts:{" "}
            {new Intl.DateTimeFormat("en-NG", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Africa/Lagos",
            }).format(new Date(c.starts_at))}{" "}
            (West Africa Time)
          </p>
        )}
        <p className="mt-6 text-sm leading-7 text-slate-600">
          Independent professional training. Read the course details and Academy terms before registering. Paid lessons
          unlock after verified payment.
        </p>
        {c.price_minor !== null && <a className="primary-button mt-7" href={courseRegistrationPath(c.slug)}>Register for this course →</a>}
        <a
          href={`/academy/enquire?course=${encodeURIComponent(c.title)}`}
          className="secondary-button mt-7 ml-3"
        >
          Enquire about this course ↗
        </a>
        <CourseShare title={c.title} slug={c.slug}/>
      </article>
    </PageShell>
  );
}
