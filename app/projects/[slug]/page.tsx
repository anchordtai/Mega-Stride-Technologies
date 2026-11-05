import { notFound } from "next/navigation";
import PageShell from "@/components/page-shell";
import { publishedContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { items } = await publishedContent("project");
  const x = items.find((x) => x.slug === slug);
  return x ? pageMetadata(x.title, x.summary, `/projects/${slug}`) : {};
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { items } = await publishedContent("project");
  const x = items.find((x) => x.slug === slug);
  if (!x) notFound();
  return (
    <PageShell
      eyebrow={x.category || "Projects"}
      title={x.title}
      intro={x.summary}
    >
      <a href="/projects" className="font-bold text-blue-700">
        ← Projects
      </a>
      <article className="platform-panel mt-8 max-w-4xl whitespace-pre-wrap text-lg leading-9">
        {x.body}
      </article>
    </PageShell>
  );
}
