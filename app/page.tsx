import SiteHeader from "@/components/site-header";
import { CTA, EditorialImage, Icon, SectionHeading } from "@/components/design";
import { serviceCategories } from "@/lib/company";
import { industries, delivery } from "@/lib/presentation";
export default function Home() {
  return (
    <main id="main-content">
      <SiteHeader />
      <section className="home-hero">
        <div className="container hero-layout">
          <div className="hero-copy">
            <p className="section-kicker">
              Technology. Infrastructure. Possibility.
            </p>
            <h1>
              Engineering
              <br />
              your next
              <br />
              <em>great stride.</em>
            </h1>
            <p>
              Intelligent technology. Dependable infrastructure. Practical
              expertise. We connect the pieces that help your organisation move
              forward.
            </p>
            <div className="hero-actions">
              <a href="/services" className="primary-button">
                Explore our solutions <span aria-hidden="true">↗</span>
              </a>
              <a href="/contact" className="secondary-button">
                Request a consultation
              </a>
            </div>
            <div className="hero-footnote">
              <span>Built around your business</span>
              <span>Based in Abuja, Nigeria</span>
            </div>
          </div>
          <div className="hero-composition">
            <EditorialImage
              src="/images/editorial/infrastructure.webp"
              alt="Server racks illustrating enterprise digital infrastructure"
              className="hero-photo"
              priority
            />
            <span className="hero-side-label">
              MEGA STRIDE · TECHNOLOGY IN MOTION
            </span>
            <div className="hero-caption">
              <span className="icon-tile">
                <Icon index={1} />
              </span>
              <div>
                <strong>Built to connect. Engineered to last.</strong>
                <p>Infrastructure · Software · Security · Cloud</p>
              </div>
              <span className="caption-arrow" aria-hidden="true">
                ↗
              </span>
            </div>
          </div>
        </div>
      </section>
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
                <a className="text-link" href={`/services/${s.slug}`}>
                  Explore solution <span aria-hidden="true">↗</span>
                </a>
              </article>
            ))}
            <div className="featured-card">
              <h3>A challenge that crosses disciplines?</h3>
              <p>
                Start with your business need. We’ll help clarify the
                combination of capabilities it requires.
              </p>
              <a className="text-link" href="/contact">
                Talk to our team ↗
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="editorial-section">
        <div className="container photo-split">
          <EditorialImage
            src="/images/editorial/team.webp"
            alt="Technology professionals collaborating, illustrative photography"
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
              src="/images/editorial/academy.webp"
              alt="Collaborative learning environment, illustrative photography"
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
            src="/images/editorial/trade.webp"
            alt="Container logistics illustrating global trade"
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
