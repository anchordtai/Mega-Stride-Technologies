import PageShell from "@/components/page-shell";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Privacy Notice",
  "How to contact Mega Stride about personal information and website enquiries.",
  "/privacy",
);
export default function Privacy() {
  return (
    <PageShell
      eyebrow="Privacy notice · draft for management review"
      title="Your information deserves care."
    >
      <article className="platform-panel max-w-4xl space-y-7 leading-8">
        <p>
          This notice is a draft for approval before the upgraded online
          platform is activated. It does not certify regulatory compliance.
          Contact info@megastride.com.ng for questions about personal
          information.
        </p>
        <section>
          <h2 className="text-xl font-bold">Information and purpose</h2>
          <p>
            Enquiry forms request your name, contact information, country,
            organisation and requirements so Mega Stride Technologies Limited
            can respond and manage the business enquiry. Training accounts and
            enrolments use account identity and permitted learning records to
            provide the Academy service. Do not submit payment-card details,
            passwords or unnecessary sensitive information in enquiries.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Access and service providers</h2>
          <p>
            Access is restricted according to staff responsibilities. The
            proposed platform uses hosting, authentication/database and security
            verification providers. Its final provider list, processing
            locations and safeguards must be confirmed before collection begins.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Cookies</h2>
          <p>
            Account authentication uses essential session cookies. Optional
            analytics or marketing tools require separate review before
            activation. No optional analytics integration is included in this
            development version.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Requests and retention</h2>
          <p>
            You may contact info@megastride.com.ng to ask about access,
            correction, deletion or concerns regarding your information. Mega
            Stride must confirm identity before disclosing records. Management
            must approve the applicable lawful bases, retention periods,
            complaint route and handling of international transfers before
            production activation.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
