import PageShell from "@/components/page-shell";
import ContentListing from "@/components/content-listing";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Projects",
  "Approved project stories, implementation scope and verified results from Mega Stride.",
  "/projects",
);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "" } = await searchParams;
  return (
    <PageShell
      eyebrow="Projects & case studies"
      title="The thinking behind the technology."
      intro="Explore published project stories: the challenge, the engineering and the work that brings a solution to life."
      image="/images/editorial/infrastructure.webp"
    >
      <ContentListing
        kind="project"
        q={q.slice(0, 120)}
        category={category.slice(0, 120)}
      />
    </PageShell>
  );
}
