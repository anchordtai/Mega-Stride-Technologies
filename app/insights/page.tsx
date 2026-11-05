import PageShell from "@/components/page-shell";
import ContentListing from "@/components/content-listing";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Insights",
  "Perspectives on infrastructure, software, security, technology procurement and professional development.",
  "/insights",
);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "" } = await searchParams;
  return (
    <PageShell
      eyebrow="Ideas & insights"
      title="A clearer perspective on what’s next."
      intro="Technology thinking, practical guidance and perspectives for people building stronger digital foundations."
      image="/images/mega-stride/hero/software.webp"
    >
      <ContentListing
        kind="post"
        q={q.slice(0, 120)}
        category={category.slice(0, 120)}
      />
    </PageShell>
  );
}
