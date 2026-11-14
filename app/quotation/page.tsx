import PageShell from "@/components/page-shell";
import EnquiryForm from "@/components/enquiry-form";
import { intakeReady } from "@/lib/supabase/config";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Request a Quotation",
  "Send your ICT equipment, software, infrastructure, consultancy or training requirements to Mega Stride.",
  "/quotation",
);
export default async function QuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  return (
    <PageShell
      image="/images/mega-stride/services/equipment.webp"
      imageAlt="AI illustration of unbranded enterprise hardware for procurement planning"
      eyebrow="Procurement & project enquiries"
      title="Define the requirement. Take the next stride."
      intro="Request a quotation for technology equipment, infrastructure, software, consulting or training. Include specifications, quantity, location and expected timeframe."
    >
      <div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]">
        <aside>
          <p className="section-kicker">Make your requirements clear</p>
          <h2 className="mt-4 text-3xl font-medium">
            A good specification is a strong beginning.
          </h2>
          <p className="mt-5 leading-8 text-slate-600">
            Share the detail you have. We will clarify scope and dependencies
            before preparing a formal quotation.
          </p>
          <div className="form-aside">
            <h3>Useful information to include</h3>
            <ul>
              <li>Project objectives and location</li>
              <li>Equipment specifications and quantities</li>
              <li>Current systems and integration requirements</li>
              <li>Preferred timeframe and delivery destination</li>
            </ul>
          </div>
          <p className="mt-6 text-sm leading-7 text-slate-600">
            Submitting this form is an enquiry. Prices and delivery commitments
            are confirmed in an authorised quotation.
          </p>
        </aside>
        <div>
          <EnquiryForm
            kind="quotation"
            service={service?.slice(0, 120) || "ICT equipment / services"}
            available={intakeReady()}
          />
          <p className="mt-6 text-sm leading-7 text-slate-600">
            You can attach up to three PDF or image files using this form. Please do not include passwords,
            payment-card information or confidential credentials.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
