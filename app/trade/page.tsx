import PageShell from "@/components/page-shell";
import EnquiryForm from "@/components/enquiry-form";
import { intakeReady } from "@/lib/supabase/config";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Importation & Exportation",
  "Discuss ICT product sourcing, technology supply, procurement and international trade requirements with Mega Stride.",
  "/trade",
);
export default function TradePage() {
  return (
    <PageShell
      image="/images/editorial/trade.webp"
      eyebrow="Technology & global trade"
      title="Source with clarity. Coordinate with confidence."
      intro="ICT product sourcing, procurement support, supplier coordination and technology deployment, subject to applicable approvals and agreed commercial terms."
    >
      <div className="trade-process">
        {[
          [
            "01",
            "Specify",
            "Define equipment, compatibility, quantities and destination.",
          ],
          [
            "02",
            "Coordinate",
            "Review sourcing, supplier and logistics requirements.",
          ],
          [
            "03",
            "Deploy",
            "Discuss delivery and any installation or integration scope.",
          ],
        ].map(([n, t, d]) => (
          <div key={n}>
            <span>{n} / PROCUREMENT</span>
            <h2>{t}</h2>
            <p>{d}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
        <section>
          <h2 className="text-3xl font-bold">
            Start with a clear specification.
          </h2>
          <p className="mt-6 leading-8 text-slate-600">
            Tell us the product category, specification, quantity, destination
            and timeframe. We can discuss sourcing, supply, distribution and
            logistics coordination requirements for computers, networking
            equipment, servers, software and related ICT products.
          </p>
          <p className="mt-5 leading-8 text-slate-600">
            Export enquiries are assessed against product eligibility and
            applicable requirements. Prices, stock availability and delivery
            commitments are confirmed in a formal quotation.
          </p>
        </section>
        <EnquiryForm
          kind="trade"
          service="Importation / exportation"
          available={intakeReady()}
        />
      </div>
    </PageShell>
  );
}
