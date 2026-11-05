import PageShell from "@/components/page-shell";
import { CTA, SectionHeading } from "@/components/design";
import SolutionGallery from "@/components/solution-gallery";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Services & Solutions",
  "Software engineering, networking, cloud, cybersecurity, digital transformation and ICT supply services in Abuja, Nigeria.",
  "/services",
);
export default function Page() {
  return (
    <PageShell
      eyebrow="Solutions & expertise"
      title="Connected expertise for a changing world."
      intro="From the first requirement to implementation and support, find the capabilities that fit your next move."
      image="/images/mega-stride/hero/infrastructure.webp"
    >
      <div className="section-topline">
        <SectionHeading
          kicker="Explore our capabilities"
          title="Build. Connect. Secure. Evolve."
          description="Choose a discipline to explore its scope, delivery approach and the requirements we can help you clarify."
        />
      </div>
      <SolutionGallery />
      <CTA title="Start with the challenge. We’ll help connect the expertise." />
    </PageShell>
  );
}
