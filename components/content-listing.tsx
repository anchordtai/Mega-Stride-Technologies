import { Icon, CTA } from "./design";
import { publishedContent } from "@/lib/content";
export default async function ContentListing({
  kind,
  q,
  category,
}: {
  kind: "project" | "post";
  q: string;
  category: string;
}) {
  const { items, unavailable } = await publishedContent(kind);
  const project = kind === "project";
  const route = project ? "projects" : "insights";
  const filtered = items.filter(
    (x) =>
      (!category || x.category === category) &&
      (!q ||
        (x.title + " " + x.summary).toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <>
      <form className="listing-toolbar">
        <label className="form-label">
          Search {project ? "projects" : "insights"}
          <input
            name="q"
            defaultValue={q}
            maxLength={120}
            className="form-input"
            placeholder={
              project
                ? "Find a project or technology"
                : "Search topics and articles"
            }
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
        <button className="primary-button">
          Search <span aria-hidden="true">↗</span>
        </button>
        {(q || category) && (
          <a href={`/${route}`} className="text-link">
            Clear filters
          </a>
        )}
      </form>
      {unavailable ? (
        <div className="platform-panel" role="status">
          <h2 className="text-2xl">We couldn’t load the latest content.</h2>
          <p className="mt-4 text-slate-600">
            Please try again shortly or contact our team.
          </p>
          <a href={`/${route}`} className="text-link mt-5">
            Try again ↻
          </a>
        </div>
      ) : filtered.length ? (
        <>
          <p className="mb-5 text-sm text-slate-500">
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((x) => (
              <article className="content-card" key={x.id}>
                <span className="section-kicker">
                  {x.category || (project ? "Project" : "Insight")}
                </span>
                <h2>
                  <a href={`/${route}/${x.slug}`}>{x.title}</a>
                </h2>
                <p>{x.summary}</p>
                <a href={`/${route}/${x.slug}`} className="text-link">
                  {project ? "Explore project" : "Read article"} ↗
                </a>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="listing-empty">
          <div className="listing-empty-visual">
            <Icon index={project ? 1 : 0} />
            <span>
              {project
                ? "Engineering in context"
                : "Ideas. Perspective. Possibility."}
            </span>
          </div>
          <div className="listing-empty-copy">
            <p className="section-kicker">
              {items.length
                ? "Search results"
                : project
                  ? "Our project portfolio"
                  : "Mega Stride insights"}
            </p>
            <h2>
              {items.length
                ? "No matching results."
                : project
                  ? "Good work deserves a clear story."
                  : "Fresh perspectives are on the way."}
            </h2>
            <p>
              {items.length
                ? "Try a broader search or clear your category filter."
                : project
                  ? "Approved case studies will appear here with project scope, delivery details and verified results. In the meantime, explore our capabilities or discuss your own requirements."
                  : "This is where we will share published articles on infrastructure, software, security and professional development. Explore our solutions while our first insights are prepared."}
            </p>
            <a
              className="text-link"
              href={items.length ? `/${route}` : "/services"}
            >
              {items.length ? "Clear filters" : "Explore our solutions"} ↗
            </a>
          </div>
        </div>
      )}
      <CTA
        title={
          project
            ? "Let’s discuss the challenge behind your next project."
            : "A technology question worth exploring?"
        }
      />
    </>
  );
}
