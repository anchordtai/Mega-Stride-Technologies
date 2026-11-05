import PageShell from "@/components/page-shell";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "About Mega Stride",
  "Technology engineering, ICT infrastructure, professional training and technology trade in Abuja, Nigeria.",
  "/about",
);
export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About Mega Stride"
      title="Engineering the next stride for organisations and people."
      intro="Mega Stride Technologies Limited brings technology, infrastructure, professional development and ICT trade into one practical conversation."
    >
      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-3xl font-bold">
            Technology built around real outcomes.
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            We work across software engineering, enterprise networking, cloud
            infrastructure, systems integration, technology supply and
            professional learning. Our approach starts with the operating
            environment, the people using it and the outcome required.
          </p>
          <p className="mt-5 leading-8 text-slate-600">
            Based in Abuja, Nigeria, Mega Stride is positioned to support public
            institutions, educational organisations, businesses and technology
            professionals.
          </p>
        </section>
        <section className="platform-panel">
          <h2 className="text-2xl font-bold">How we work</h2>
          <ol className="mt-6 space-y-5">
            {[
              [
                "Understand",
                "Clarify objectives, constraints and requirements.",
              ],
              [
                "Engineer",
                "Design for reliability, security and maintainability.",
              ],
              [
                "Enable",
                "Support implementation, knowledge transfer and ongoing operations.",
              ],
            ].map(([t, d]) => (
              <li key={t}>
                <h3 className="font-bold">{t}</h3>
                <p className="mt-2 leading-7 text-slate-600">{d}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {[
          ["Practical", "Technology decisions grounded in operational needs."],
          [
            "Responsible",
            "Clear scope, honest communication and security-conscious delivery.",
          ],
          [
            "Forward-looking",
            "Maintainable foundations that can evolve with the organisation.",
          ],
        ].map(([t, d]) => (
          <section key={t} className="platform-panel">
            <h2 className="text-xl font-bold">{t}</h2>
            <p className="mt-4 leading-7 text-slate-600">{d}</p>
          </section>
        ))}
      </div>
      <a href="/contact" className="primary-button mt-12">
        Discuss your requirements ↗
      </a>
    </PageShell>
  );
}
