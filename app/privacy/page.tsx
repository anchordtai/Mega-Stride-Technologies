import PageShell from "@/components/page-shell";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Privacy Notice",
  "How Mega Stride handles website enquiries, account information and privacy requests.",
  "/privacy",
);
export default function Privacy() {
  return (
    <PageShell eyebrow="Privacy notice" title="Your information deserves care.">
      <article className="platform-panel max-w-4xl space-y-7 leading-8">
        <p>
          Mega Stride Technologies Limited, Abuja, Nigeria, handles the
          information submitted through this website. Contact{" "}
          <a className="underline" href="mailto:info@megastride.com.ng">
            info@megastride.com.ng
          </a>{" "}
          about privacy or your personal information.
        </p>
        <section>
          <h2 className="text-xl font-bold">What we collect and why</h2>
          <p>
            Enquiry forms collect your name, contact details, country,
            organisation and requirements so we can respond, discuss a quotation
            or arrange training. Your form consent covers this use; it does not
            subscribe you to marketing. Confirmed learner accounts use identity,
            enrolment and permitted learning records to provide course access.
            We also process limited security information, including hashed
            network identifiers, to prevent abuse.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Who can access it</h2>
          <p>
            Access is restricted to authorised staff and the technology
            providers supporting the service. This website uses Vercel for
            hosting and Supabase for database, authentication and storage. The
            dedicated database is in Ireland, and service processing may occur
            outside Nigeria. We do not sell enquiry details. Please do not
            submit passwords, card details or unnecessary sensitive information
            in a message.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Cookies and external content</h2>
          <p>
            Essential cookies support account sessions and secure enquiry
            submission. This release does not include optional advertising or
            analytics cookies. Some illustrative images are loaded from external
            image providers, which receive the network information needed to
            deliver those images.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Retention and your requests</h2>
          <p>
            We retain information for handling the enquiry or service and
            related operational or legal requirements. You may contact us to
            request access, correction, deletion, or withdrawal of consent. We
            may need to verify your identity and explain any records that must
            be retained. You can also contact the{" "}
            <a
              href="https://ndpc.gov.ng/"
              className="underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Nigeria Data Protection Commission
            </a>{" "}
            about a privacy concern.
          </p>
        </section>
        <p className="text-sm text-slate-600">Last updated: 5 November 2026.</p>
      </article>
    </PageShell>
  );
}
