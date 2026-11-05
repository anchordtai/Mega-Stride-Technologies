import PageShell from "@/components/page-shell";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Website Terms",
  "Draft website and business enquiry terms for Mega Stride Technologies Limited.",
  "/terms",
);
export default function Terms() {
  return (
    <PageShell
      eyebrow="Website terms · draft for management review"
      title="Clear expectations. Responsible engagement."
    >
      <article className="platform-panel max-w-4xl space-y-6 leading-8">
        <p>
          These draft terms require management and appropriate legal review
          before the upgraded business platform is activated.
        </p>
        <h2 className="text-xl font-bold">Enquiries and quotations</h2>
        <p>
          Website content introduces our areas of work. An enquiry is a request
          for discussion. Scope, pricing, taxes, availability, delivery,
          warranty and contractual commitments must be confirmed in an approved
          quotation and agreed engagement terms.
        </p>
        <h2 className="text-xl font-bold">Appropriate use</h2>
        <p>
          Do not submit unlawful material, impersonate another person, attempt
          unauthorised access or upload information you are not entitled to
          share. Confidential credentials and card details must not be included
          in enquiry messages.
        </p>
        <h2 className="text-xl font-bold">Trade and procurement</h2>
        <p>
          Product sourcing and international trade are subject to applicable
          approvals, eligibility and agreed commercial arrangements. Website
          content does not guarantee stock, supplier authorisation or delivery
          dates.
        </p>
        <h2 className="text-xl font-bold">Contact and final review</h2>
        <p>
          Contact info@megastride.com.ng for clarification. Final provisions
          concerning governing law, liability, intellectual property,
          cancellation and dispute handling remain subject to management and
          legal approval.
        </p>
      </article>
    </PageShell>
  );
}
