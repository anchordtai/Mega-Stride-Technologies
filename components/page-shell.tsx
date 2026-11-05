import SiteHeader from "./site-header";
import { EditorialImage } from "./design";
export default function PageShell({
  eyebrow,
  title,
  intro,
  image,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  image?: string;
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="page-main">
      <SiteHeader />
      <section className={`page-hero ${image ? "with-image" : ""}`}>
        <div className="container page-hero-grid">
          <div>
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <span aria-hidden="true">/</span>
              <span>{eyebrow}</span>
            </nav>
            <p className="section-kicker">{eyebrow}</p>
            <h1>{title}</h1>
            {intro && <p className="page-intro">{intro}</p>}
          </div>
          {image ? (
            <EditorialImage
              src={image}
              alt=""
              priority
              className="page-hero-photo"
            />
          ) : (
            <div className="hero-geometry" aria-hidden="true">
              <span>↗</span>
            </div>
          )}
        </div>
      </section>
      <div className="container page-content">{children}</div>
    </main>
  );
}
