import PageShell from "@/components/page-shell";
import { CTA, Icon, SectionHeading } from "@/components/design";
import { industries } from "@/lib/presentation";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Industry Applications",
  "Explore technology applications for education, public institutions, enterprise and growing organisations.",
  "/industries",
);
export default function Page() {
  return (
    <PageShell
      eyebrow="Industry applications"
      title="Technology shaped around your environment."
      intro="Every organisation operates differently. Explore potential applications of our capabilities, then discuss the scope that fits your needs."
      image="/images/mega-stride/hero/operations.webp"
    >
      <SectionHeading
        kicker="Where capabilities meet context"
        title="A practical starting point for your industry."
        description="These are application areas for discussion, rather than claims of completed projects or existing client relationships."
      />
      {industries.map((x, i) => (
        <section
          id={x.slug}
          key={x.slug}
          className="section-divider intro-grid"
        >
          <div>
            <span className="icon-tile">
              <Icon index={i} />
            </span>
            <h2 className="mt-6 text-3xl font-medium">{x.title}</h2>
            <p className="mt-5 leading-8 text-slate-600">{x.description}</p>
          </div>
          <div>
            <p className="section-kicker">Potential requirements</p>
            <ul className="mt-5 space-y-4">
              {x.needs.map((n) => (
                <li
                  key={n}
                  className="border-b border-slate-200 pb-4 text-slate-600"
                >
                  {n}
                </li>
              ))}
            </ul>
            <a href={`/services/${x.service}`} className="text-link mt-6">
              Explore a relevant capability ↗
            </a>
            <br />
            <a
              href={`/quotation?service=${encodeURIComponent(x.title)}`}
              className="primary-button mt-6"
            >
              Discuss your requirements ↗
            </a>
          </div>
        </section>
      ))}
      <CTA />
    </PageShell>
  );
}
