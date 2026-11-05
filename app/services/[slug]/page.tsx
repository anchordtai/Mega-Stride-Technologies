import { notFound } from "next/navigation";
import PageShell from "@/components/page-shell";
import { serviceCategories } from "@/lib/company";
import { canonicalOrigin, pageMetadata } from "@/lib/seo";
export function generateStaticParams() {
  return serviceCategories.map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = serviceCategories.find((s) => s.slug === slug);
  return s ? pageMetadata(s.title, s.summary, `/services/${slug}`) : {};
}
export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = serviceCategories.find((s) => s.slug === slug);
  if (!s) notFound();
  return (
    <PageShell eyebrow="Services & solutions" title={s.title} intro={s.summary}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: s.title,
            description: s.summary,
            provider: {
              "@type": "Organization",
              name: "Mega Stride Technologies Limited",
              url: canonicalOrigin,
            },
          }).replace(/</g, "\u003c"),
        }}
      />
      <nav aria-label="Breadcrumb" className="mb-10 text-sm">
        <a href="/">Home</a> / <a href="/services">Services</a> /{" "}
        <span>{s.title}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-3xl font-bold">What we can help you plan.</h2>
          <ul className="mt-6 space-y-4">
            {s.items.map((x) => (
              <li
                key={x}
                className="border-b border-slate-200 pb-4 text-lg text-slate-700"
              >
                {x}
              </li>
            ))}
          </ul>
        </section>
        <aside className="platform-panel">
          <p className="section-kicker">Your next step</p>
          <h2 className="mt-4 text-3xl font-bold">{s.outcome}</h2>
          <p className="mt-5 leading-7 text-slate-600">
            Share your objectives, current environment, location and delivery
            timeframe. We will clarify the scope, capabilities and delivery
            requirements before proposing an engagement.
          </p>
          <a
            href={`/quotation?service=${encodeURIComponent(s.title)}`}
            className="primary-button mt-7"
          >
            Request a quotation ↗
          </a>
        </aside>
      </div>
    </PageShell>
  );
}
