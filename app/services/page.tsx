import PageShell from "@/components/page-shell";
import { serviceCategories } from "@/lib/company";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Services & Solutions",
  "Explore software engineering, networking, cloud, cybersecurity, digital transformation and ICT supply services in Abuja, Nigeria.",
  "/services",
);
export default function ServicesPage() {
  return (
    <PageShell
      eyebrow="Services & solutions"
      title="A connected approach to technology."
      intro="From defining a requirement to engineering and supporting the solution, find the capability that fits your next step."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {serviceCategories.map((s, i) => (
          <a
            key={s.slug}
            href={`/services/${s.slug}`}
            className="platform-panel service-link"
          >
            <span className="section-kicker">0{i + 1}</span>
            <h2 className="mt-5 text-2xl font-bold">{s.title}</h2>
            <p className="mt-4 leading-7 text-slate-600">{s.summary}</p>
            <span className="mt-6 inline-block font-bold text-blue-700">
              Explore this service →
            </span>
          </a>
        ))}
      </div>
    </PageShell>
  );
}
