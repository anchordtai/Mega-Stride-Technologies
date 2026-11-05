import PageShell from "@/components/page-shell";
import { CTA, Icon, SectionHeading } from "@/components/design";
import { serviceCategories } from "@/lib/company";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Services & Solutions",
  "Software engineering, networking, cloud, cybersecurity, digital transformation and ICT supply services in Abuja, Nigeria.",
  "/services",
);
export default function Page() {
  return (
    <PageShell
      eyebrow="Solutions & expertise"
      title="Connected expertise for a changing world."
      intro="From the first requirement to implementation and support, find the capabilities that fit your next move."
      image="/images/editorial/infrastructure.webp"
    >
      <div className="section-topline">
        <SectionHeading
          kicker="Explore our capabilities"
          title="Build. Connect. Secure. Evolve."
          description="Choose a discipline to explore its scope, delivery approach and the requirements we can help you clarify."
        />
      </div>
      <div className="solution-grid">
        {serviceCategories.map((s, i) => (
          <article className="solution-card" key={s.slug}>
            <div className="card-top">
              <span className="icon-tile">
                <Icon index={i} />
              </span>
              <span className="card-index">0{i + 1}</span>
            </div>
            <h3>{s.title}</h3>
            <p>{s.summary}</p>
            <a href={`/services/${s.slug}`} className="text-link">
              Explore solution ↗
            </a>
          </article>
        ))}
      </div>
      <CTA title="Start with the challenge. We’ll help connect the expertise." />
    </PageShell>
  );
}
