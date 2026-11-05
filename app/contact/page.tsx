import PageShell from "@/components/page-shell";
import ContactForm from "@/components/contact-form";
import { databaseReady } from "@/lib/supabase/config";
import { company } from "@/lib/company";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Contact Mega Stride",
  "Discuss software, ICT infrastructure, equipment supply, training and technology trade with Mega Stride in Abuja, Nigeria.",
  "/contact",
);
export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact Mega Stride"
      title="Let’s turn your requirement into a plan."
      intro="Tell us what you are building, securing, modernising, sourcing or learning."
    >
      <div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]">
        <aside className="space-y-5">
          <div className="platform-panel">
            <h2 className="section-kicker">Talk to us</h2>
            <a
              className="mt-5 block text-lg font-bold"
              href={`tel:${company.phone}`}
            >
              {company.phoneDisplay}
            </a>
            <a
              className="mt-4 block break-words font-bold text-blue-700"
              href={`mailto:${company.email}`}
            >
              {company.email}
            </a>
            <p className="mt-5 text-slate-600">{company.location}</p>
          </div>
          <div className="platform-panel">
            <h2 className="text-xl font-bold">A clear starting point</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Include your goals, organisation, current environment, project
              location and preferred delivery timeframe.
            </p>
            <a
              href="/quotation"
              className="mt-5 inline-block font-bold text-blue-700"
            >
              Request a quotation →
            </a>
          </div>
        </aside>
        <ContactForm available={databaseReady()} />
      </div>
    </PageShell>
  );
}
