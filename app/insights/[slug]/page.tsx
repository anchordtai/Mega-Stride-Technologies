import { notFound } from "next/navigation";
import PageShell from "@/components/page-shell";
import { publishedContent } from "@/lib/content";
import { canonicalOrigin, pageMetadata } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { items } = await publishedContent("post");
  const x = items.find((x) => x.slug === slug);
  return x ? pageMetadata(x.title, x.summary, `/insights/${slug}`) : {};
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { items } = await publishedContent("post");
  const x = items.find((x) => x.slug === slug);
  if (!x) notFound();
  const readingMinutes = Math.max(
    1,
    Math.ceil((x.body || "").split(/\s+/).length / 220),
  );
  const shareUrl = `${canonicalOrigin}/insights/${encodeURIComponent(x.slug)}`;
  const related = items
    .filter((item) => item.id !== x.id)
    .sort(
      (a, b) =>
        Number(b.category === x.category) - Number(a.category === x.category),
    )
    .slice(0, 3);
  return (
    <PageShell
      eyebrow={x.category || "Insights"}
      title={x.title}
      intro={x.summary}
    >
      <a href="/insights" className="font-bold text-blue-700">
        ← Insights
      </a>
      <div className="article-meta">
        <span>Mega Stride Insights</span>
        <span>{readingMinutes} min read</span>
        <span>
          Updated{" "}
          <time dateTime={x.updated_at}>
            {new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "Africa/Lagos",
            }).format(new Date(x.updated_at))}
          </time>
        </span>
      </div>
      <div className="article-layout">
        <article className="article-body">
          {(x.body || "").split(/\n\s*\n/).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </article>
        <aside className="article-share">
          <p className="section-kicker">Share this perspective</p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(x.title + " " + shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp ↗
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn ↗
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(x.title)}&body=${encodeURIComponent(shareUrl)}`}
          >
            Email ↗
          </a>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="section-divider">
          <p className="section-kicker">Continue exploring</p>
          <h2 className="mt-4 text-3xl">Related perspectives.</h2>
          <div className="related-insights">
            {related.map((item) => (
              <a key={item.id} href={`/insights/${item.slug}`}>
                <span>{item.category || "Insight"}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <strong>Read article ↗</strong>
              </a>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
