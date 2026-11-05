import { publishedContent } from "@/lib/content";
import { EditorialImage, SectionHeading } from "./design";
import { visuals } from "@/lib/visuals";
export default async function PublishedHighlights() {
  const [projects, posts] = await Promise.all([
    publishedContent("project"),
    publishedContent("post"),
  ]);
  return (
    <section className="editorial-section publication-section">
      <div className="container">
        <div className="section-topline">
          <SectionHeading
            kicker="Technology in context"
            title="The work. The thinking. The next possibility."
          />
          <a href="/projects" className="text-link">
            Explore our portfolio ↗
          </a>
        </div>
        <div className="publication-layout">
          <div className="portfolio-feature">
            <EditorialImage
              src={visuals.equipment}
              alt="AI illustration of enterprise hardware, representing our capabilities rather than a completed project"
              className="portfolio-feature-image"
            />
            <div className="portfolio-feature-copy">
              <p className="section-kicker">Projects & engineering</p>
              <h3>
                {projects.items.length
                  ? "The challenge behind the solution."
                  : "Every project starts with a real requirement."}
              </h3>
              <p>
                {projects.unavailable
                  ? "Project publications are temporarily unavailable. Explore our services or contact our team."
                  : projects.items.length
                    ? "Explore approved project stories and their delivery scope."
                    : "Approved case studies will appear here with delivery scope and verified results. For now, discover what we can help you plan."}
              </p>
              {projects.items.slice(0, 2).map((x) => (
                <a
                  className="publication-link"
                  href={`/projects/${x.slug}`}
                  key={x.id}
                >
                  {x.title}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
              <a
                className="text-link"
                href={projects.items.length ? "/projects" : "/services"}
              >
                {projects.items.length
                  ? "View approved projects"
                  : "Explore our capabilities"}{" "}
                ↗
              </a>
            </div>
          </div>
          <aside className="insights-preview">
            <p className="section-kicker">Ideas & insights</p>
            <h3>A considered view of what comes next.</h3>
            {posts.items.length ? (
              posts.items.slice(0, 3).map((x, i) => (
                <a
                  className="publication-link"
                  href={`/insights/${x.slug}`}
                  key={x.id}
                >
                  <span>0{i + 1}</span>
                  <div>
                    <small>{x.category || "Insight"}</small>
                    <strong>{x.title}</strong>
                  </div>
                  <span aria-hidden="true">↗</span>
                </a>
              ))
            ) : (
              <p>
                {posts.unavailable
                  ? "Articles are temporarily unavailable. Please try again shortly."
                  : "Perspectives on infrastructure, software, security and professional learning will appear here after publication."}
              </p>
            )}
            <a href="/insights" className="text-link">
              Visit insights ↗
            </a>
            <div className="insights-note">
              <span aria-hidden="true">↗</span>
              <p>
                Have a technology question?
                <br />
                <a href="/contact">Start a conversation.</a>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
