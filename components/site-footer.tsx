import Image from "next/image";
import { company, serviceCategories } from "@/lib/company";
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <a
            className="wordmark"
            href="/"
            aria-label="Mega Stride Technologies home"
          >
            <Image src="/brand/mega-stride-logo.webp" alt="Mega Stride Technologies Ltd" width={1100} height={304} className="company-logo" />
          </a>
          <p>
            Technology. Infrastructure.
            <br />
            Innovation. Global solutions.
          </p>
          <a href="/contact" className="footer-contact-link">
            Start a conversation ↗
          </a>
        </div>
        <div className="footer-grid">
          <div>
            <p className="footer-label">Built for your next stride</p>
            <p className="footer-description">
              Technology engineering, digital infrastructure, professional
              learning and ICT trade. Based in Abuja. Focused on your next step.
            </p>
            <a
              href="https://www.facebook.com/profile.php?id=61590753162681"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook ↗
            </a>
          </div>
          <nav aria-label="Footer solutions">
            <p className="footer-label">Solutions</p>
            {serviceCategories.map((s) => (
              <a key={s.slug} href={`/services/${s.slug}`}>
                {s.title
                  .replace(" & Digital Products", "")
                  .replace("Enterprise ", "")}
              </a>
            ))}
          </nav>
          <nav aria-label="Footer navigation">
            <p className="footer-label">Explore</p>
            {[
              ["Our company", "/about"],
              ["Industries", "/industries"],
              ["Projects", "/projects"],
              ["Academy", "/academy"],
              ["Insights", "/insights"],
              ["Global trade", "/trade"],
              ["Learner sign in", "/account"],
              ["Create an Academy account", "/account/signup"],
              ["Client portal", "/client-portal"],
              ["Verify a document", "/document/verify"],
            ].map(([l, h]) => (
              <a href={h} key={h}>
                {l}
              </a>
            ))}
          </nav>
          <div>
            <p className="footer-label">Get in touch</p>
            <a href={`mailto:${company.email}`}>{company.email}</a>
            <a href={`tel:${company.phone}`}>{company.phoneDisplay}</a>
            <p className="footer-description">{company.location}</p>
            <a href="/quotation">Request a quotation ↗</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {company.name}. RC{" "}
            {company.registration}.
          </p>
          <nav aria-label="Policies">
            <a href="/privacy">Privacy & cookies</a>
            <a href="/terms">Website terms</a>
            <a href="/academy/terms">Academy terms</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
