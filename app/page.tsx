import { Suspense } from "react";
import SiteHeader from "@/components/site-header";
import { CTA, EditorialImage, SectionHeading } from "@/components/design";
import HeroCarousel from "@/components/hero-carousel";
import SolutionGallery from "@/components/solution-gallery";
import PublishedHighlights from "@/components/published-highlights";
import { industries, delivery } from "@/lib/presentation";
export default function Home() {
  return (
    <main id="main-content">
      <SiteHeader />
      <HeroCarousel />
      <section className="scope-strip" aria-label="Our capabilities">
        <div className="container">
          <p>
            One connected partner.
            <br />A world of possibility.
          </p>
          <span>Digital infrastructure</span>
          <span>Software & systems</span>
          <span>Professional learning</span>
          <span>Global ICT sourcing</span>
        </div>
      </section>
      <section className="editorial-section">
        <div className="container">
          <div className="intro-grid">
            <SectionHeading
              kicker="We are Mega Stride"
              title="Technology is the tool. Your progress is the purpose."
            />
            <div className="intro-copy">
              <p>
                Great technology starts with understanding what you need to
                achieve. Mega Stride Technologies Limited brings software
                engineering, ICT infrastructure, professional learning and
                technology trade into one practical conversation.
              </p>
              <p>
                From a connected campus to a business application or a
                well-defined procurement requirement, we help you plan a clear
                next step.
              </p>
              <a className="text-link" href="/about">
                Meet Mega Stride <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <div className="principles">
            {[
              [
                "01",
                "Connected expertise",
                "Software, networks, cloud, security and supply considered together.",
              ],
              [
                "02",
                "Practical engineering",
                "Technology decisions grounded in your real operating environment.",
              ],
              [
                "03",
                "A responsible approach",
                "Clear requirements, considered design and honest communication.",
              ],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span>{n} / OUR APPROACH</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="editorial-section soft" id="services">
        <div className="container">
          <div className="section-topline">
            <SectionHeading
              kicker="Our solutions"
              title="The right expertise. Connected."
              description="Build, connect, secure and evolve your technology environment with a capability that fits your needs."
            />
            <a className="text-link" href="/services">
              All solutions <span aria-hidden="true">↗</span>
            </a>
          </div>
          <SolutionGallery />
        </div>
      </section>
      <section className="editorial-section">
        <div className="container photo-split">
          <EditorialImage
            src="/images/mega-stride/hero/operations.webp"
            alt="AI illustration of technology professionals collaborating"
            className="split-photo"
          />
          <div className="split-copy">
            <SectionHeading
              kicker="Why Mega Stride"
              title="The bigger picture. The details that matter."
              description="Good engineering brings technical decisions and business realities into focus."
            />
            <div className="feature-list">
              {[
                [
                  "01",
                  "Business before technology",
                  "Understand the requirement before recommending the solution.",
                ],
                [
                  "02",
                  "Security from the start",
                  "Consider access, resilience and maintainability throughout the design.",
                ],
                [
                  "03",
                  "People are part of the system",
                  "Support adoption through knowledge transfer and professional learning.",
                ],
              ].map(([n, t, d]) => (
                <div key={n}>
                  <span>{n}</span>
                  <div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <a href="/about" className="text-link">
              Our approach to delivery ↗
            </a>
          </div>
        </div>
      </section>
      <section className="editorial-section soft">
        <div className="container">
          <div className="section-topline">
            <SectionHeading
              kicker="Industry applications"
              title="Different environments. Shared ambition."
              description="Explore how our capabilities can be applied to your organisation’s requirements."
            />
            <a href="/industries" className="text-link">
              Explore industries ↗
            </a>
          </div>
          <div className="industry-grid">
            {industries.map((x, i) => (
              <article key={x.slug} className="industry-card">
                <span>0{i + 1} / APPLICATIONS</span>
                <h3>{x.title}</h3>
                <p>{x.description}</p>
                <a href={`/industries#${x.slug}`}>
                  Explore <span aria-hidden="true">↗</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
      <Suspense
        fallback={
          <section className="editorial-section">
            <div className="container">
              <p role="status">Loading the latest publications…</p>
            </div>
          </section>
        }
      >
        <PublishedHighlights />
      </Suspense>
      <section className="editorial-section">
        <div className="container">
          <div className="academy-band">
            <div className="academy-band-copy">
              <p className="section-kicker">Mega Stride Academy</p>
              <h2>
                Your knowledge.
                <br />
                Your next advantage.
              </h2>
              <p>
                Practical technology learning for professionals, growing teams
                and the people building what comes next.
              </p>
              <div className="academy-tags">
                <span>Networking</span>
                <span>Cybersecurity</span>
                <span>Cloud</span>
                <span>Software</span>
              </div>
              <a href="/academy" className="primary-button light-button">
                Discover the Academy ↗
              </a>
            </div>
            <EditorialImage
              src="/images/mega-stride/academy/academy.webp"
              alt="AI illustration of a professional networking workshop"
            />
          </div>
        </div>
      </section>
      <section className="editorial-section soft">
        <div className="container photo-split">
          <div className="split-copy">
            <SectionHeading
              kicker="Global procurement & trade"
              title="Better specifications. Smarter sourcing."
              description="Connect your ICT procurement requirements with equipment supply, supplier coordination and deployment planning."
            />
            <div className="feature-list">
              <div>
                <span>01</span>
                <div>
                  <h3>Specify with clarity</h3>
                  <p>
                    Define equipment, compatibility, quantities and destination.
                  </p>
                </div>
              </div>
              <div>
                <span>02</span>
                <div>
                  <h3>Coordinate with purpose</h3>
                  <p>
                    Discuss sourcing, supply and logistics requirements before
                    commitments are made.
                  </p>
                </div>
              </div>
            </div>
            <a href="/trade" className="primary-button">
              Explore global trade ↗
            </a>
          </div>
          <EditorialImage
            src="/images/mega-stride/trade/trade.webp"
            alt="AI illustration of technology equipment ready for global logistics"
            className="split-photo"
          />
        </div>
      </section>
      <section className="editorial-section">
        <div className="container">
          <SectionHeading
            kicker="How we work"
            title="From the first question to your next stride."
          />
          <div className="process-grid">
            {delivery.map(([t, d], i) => (
              <article className="delivery-step" key={t}>
                <span>0{i + 1} / DELIVERY</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
          <div style={{ marginTop: 70 }}>
            <CTA />
          </div>
        </div>
      </section>
    </main>
  );
}
