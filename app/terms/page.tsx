import PageShell from "@/components/page-shell";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Website Terms",
  "Website use and business enquiry information for Mega Stride Technologies Limited.",
  "/terms",
);
export default function Terms() {
  return (
    <PageShell
      eyebrow="Website terms"
      title="Clear expectations. Responsible engagement."
    >
      <article className="platform-panel max-w-4xl space-y-6 leading-8">
        <section>
          <h2 className="text-xl font-bold">Enquiries and engagements</h2>
          <p>
            This website introduces Mega Stride Technologies Limited's services
            and accepts enquiries. Submitting a form requests a discussion; it
            does not create a service contract or confirm an order. Scope,
            availability, pricing, taxes, delivery and engagement terms are
            confirmed separately in an approved quotation or written agreement.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Appropriate use</h2>
          <p>
            Provide accurate information and share only material you are
            entitled to disclose. Do not impersonate another person, attempt
            unauthorised access, interfere with the service or submit unlawful
            content. Do not include confidential credentials or payment-card
            information in enquiry messages.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Trade and procurement</h2>
          <p>
            Product sourcing and international trade are subject to applicable
            approvals, product eligibility and agreed commercial arrangements.
            Website content does not guarantee stock, supplier authorisation, a
            delivery date or a final price.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Payments and third-party links</h2>
          <p>
            Online payment collection is not currently available on this
            website. Payment, cancellation and refund arrangements must be
            confirmed before a transaction. External links lead to services with
            their own terms and privacy information.
          </p>
        </section>
        <p>
          For clarification, contact{" "}
          <a href="mailto:info@megastride.com.ng" className="underline">
            info@megastride.com.ng
          </a>
          .
        </p>
      </article>
    </PageShell>
  );
}
