import { notFound } from "next/navigation";
import { CTA, FAQ, SectionHeading } from "@/components/design";
import { delivery } from "@/lib/presentation";
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
    <PageShell
      eyebrow="Services & solutions"
      title={s.title}
      intro={s.summary}
      image={
        s.slug === "software-engineering" || s.slug === "ai-automation-iot"
          ? "/images/editorial/engineering.webp"
          : "/images/editorial/infrastructure.webp"
      }
    >
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
      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-3xl font-bold">
            A clear scope. A practical solution.
          </h2>
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
      <section className="section-divider">
        <SectionHeading
          kicker="From requirement to delivery"
          title="An approach built around your environment."
        />
        <div className="process-grid">
          {delivery.map(([t, d], i) => (
            <article className="delivery-step" key={t}>
              <span>0{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="faq-section">
        <SectionHeading
          kicker="Useful to know"
          title="Start with the right questions."
        />
        <FAQ
          items={[
            [
              "What information should I share?",
              "Tell us your objectives, current systems, project location, users or capacity, and preferred delivery timeframe. For equipment, include specifications and quantities.",
            ],
            [
              "Can this connect with our existing systems?",
              "Integration and compatibility are assessed against your current environment. Share the relevant technical requirements so that scope, constraints and dependencies can be reviewed.",
            ],
            [
              "How are pricing and delivery confirmed?",
              "Requirements are clarified before a formal quotation. Scope, availability, delivery arrangements, commercial terms and any ongoing support are agreed for the engagement.",
            ],
            [
              "Can you help our team use the solution?",
              "Discuss the knowledge transfer, documentation and training your team needs. These can be scoped alongside implementation and support.",
            ],
          ]}
        />
      </section>
      <section className="section-divider">
        <SectionHeading
          kicker="Connected capabilities"
          title="Explore the wider picture."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {serviceCategories
            .filter((x) => x.slug !== slug)
            .slice(0, 3)
            .map((x) => (
              <a
                className="platform-panel service-link"
                href={`/services/${x.slug}`}
                key={x.slug}
              >
                <h3 className="text-lg font-bold">{x.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {x.summary}
                </p>
                <span className="text-link mt-5">Explore ↗</span>
              </a>
            ))}
        </div>
      </section>
      <CTA />
    </PageShell>
  );
}
