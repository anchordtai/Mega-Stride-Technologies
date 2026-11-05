import PageShell from "@/components/page-shell";
import { CTA, EditorialImage, SectionHeading } from "@/components/design";
import { delivery } from "@/lib/presentation";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "About Mega Stride",
  "Technology engineering, ICT infrastructure, professional training and technology trade in Abuja, Nigeria.",
  "/about",
);
export default function Page() {
  return (
    <PageShell
      eyebrow="Our company"
      title="Progress starts with a different kind of technology partner."
      intro="Mega Stride Technologies Limited brings technical thinking, practical delivery and a connected view of your business needs."
      image="/images/editorial/team.webp"
    >
      <div className="intro-grid">
        <SectionHeading
          kicker="Who we are"
          title="Built around the work you need to do."
        />
        <div className="intro-copy">
          <p>
            Based in Abuja, Nigeria, we work across software engineering,
            enterprise networking, cloud infrastructure, systems integration,
            technology supply and professional learning.
          </p>
          <p>
            Our approach begins with the operating environment, the people using
            it and the outcome required. We bring these requirements together to
            shape a practical, maintainable solution.
          </p>
          <p>
            We are positioned to support public institutions, educational
            organisations, businesses and technology professionals.
          </p>
        </div>
      </div>
      <div className="principles">
        {[
          [
            "01",
            "Practical",
            "Technology decisions grounded in operational needs.",
          ],
          [
            "02",
            "Responsible",
            "Clear scope, honest communication and security-conscious delivery.",
          ],
          [
            "03",
            "Forward-looking",
            "Maintainable foundations that can evolve with your organisation.",
          ],
        ].map(([n, t, d]) => (
          <div key={n}>
            <span>{n} / OUR PRINCIPLES</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </div>
      <section className="photo-split section-divider">
        <EditorialImage
          src="/images/editorial/engineering.webp"
          alt="Software engineering workspace, illustrative photography"
          className="split-photo"
        />
        <div className="split-copy">
          <SectionHeading
            kicker="Connected capabilities"
            title="See the whole environment. Engineer the right next step."
            description="Applications depend on infrastructure. Infrastructure needs security. People need the knowledge to use it well. We consider those connections when discussing your project."
          />
          <a href="/services" className="primary-button">
            Explore our capabilities ↗
          </a>
        </div>
      </section>
      <section className="section-divider">
        <SectionHeading
          kicker="Our delivery approach"
          title="Clarity at every stage."
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
      <CTA />
    </PageShell>
  );
}
