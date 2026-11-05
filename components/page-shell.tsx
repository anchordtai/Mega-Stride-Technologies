import SiteHeader from "./site-header";
export default function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader />
      <section className="inner-hero">
        <div className="container">
          <p className="section-kicker text-cyan-300">{eyebrow}</p>
          <h1 className="mt-5 max-w-5xl text-4xl font-bold tracking-tight text-white md:text-6xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              {intro}
            </p>
          )}
        </div>
      </section>
      <div className="container py-16 md:py-24">{children}</div>
    </main>
  );
}
