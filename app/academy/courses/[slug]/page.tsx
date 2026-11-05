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
        <p className="mt-6 font-bold">
          {c.price_minor === null
            ? "Contact the Academy for confirmed fees."
            : new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: c.currency,
              }).format(c.price_minor / 100)}
        </p>
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
          Independent professional training. Enrolment, schedule and any payment
          arrangements require confirmation by the Academy.
        </p>
        <a
          href={`/academy/register?course=${encodeURIComponent(c.title)}`}
          className="primary-button mt-7"
        >
          Enquire about this course ↗
        </a>
      </article>
    </PageShell>
  );
}
