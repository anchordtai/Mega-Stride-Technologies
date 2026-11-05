import PageShell from "@/components/page-shell";
import { publishedContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Projects",
  "Published case studies will share approved project scope, implementation and results.",
  "/projects",
);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "" } = await searchParams;
  const { items, unavailable } = await publishedContent("project");
  const filtered = items.filter(
    (x) =>
      (!category || x.category === category) &&
      (!q ||
        (x.title + " " + x.summary).toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <PageShell
      eyebrow="Projects"
      title="Technology in practice."
      intro="Published case studies will share approved project scope, implementation and results."
    >
      <form className="mb-8 flex flex-wrap gap-4">
        <label className="form-label flex-1">
          Search
          <input
            name="q"
            defaultValue={q}
            maxLength={120}
            className="form-input"
          />
        </label>
        <label className="form-label">
          Category
          <select
            name="category"
            defaultValue={category}
            className="form-input"
          >
            <option value="">All categories</option>
            {[...new Set(items.map((x) => x.category).filter(Boolean))].map(
              (c) => (
                <option key={c}>{c}</option>
              ),
            )}
          </select>
        </label>
        <button className="primary-button self-end">Search</button>
      </form>
      {unavailable ? (
        <p role="status">Content is temporarily unavailable.</p>
      ) : filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((x) => (
            <article className="platform-panel" key={x.id}>
              <p className="section-kicker">{x.category}</p>
              <h2 className="mt-4 text-2xl font-bold">
                <a href={`/projects/${x.slug}`}>{x.title}</a>
              </h2>
              <p className="mt-4 leading-7 text-slate-600">{x.summary}</p>
              <a
                href={`/projects/${x.slug}`}
                className="mt-5 inline-block font-bold text-blue-700"
              >
                Read more →
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="platform-panel">
          <p className="leading-7 text-slate-600">
            {items.length
              ? "No matching publications."
              : "No approved publications are available yet."}
          </p>
          <a
            href="/contact"
            className="mt-5 inline-block font-bold text-blue-700"
          >
            Discuss your requirements →
          </a>
        </div>
      )}
    </PageShell>
  );
}
