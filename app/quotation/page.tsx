import PageShell from "@/components/page-shell";
import EnquiryForm from "@/components/enquiry-form";
import { databaseReady } from "@/lib/supabase/config";
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
      eyebrow="Procurement & project enquiries"
      title="Define the requirement. Take the next stride."
      intro="Request a quotation for technology equipment, infrastructure, software, consulting or training. Include specifications, quantity, location and expected timeframe."
    >
      <div className="mx-auto max-w-3xl">
        <EnquiryForm
          kind="quotation"
          service={service?.slice(0, 120) || "ICT equipment / services"}
          available={databaseReady()}
        />
        <p className="mt-6 text-sm leading-7 text-slate-600">
          After your enquiry is received, our team can arrange a secure way to
          share supporting documents. Please do not include passwords,
          payment-card information or confidential credentials.
        </p>
      </div>
    </PageShell>
  );
}
