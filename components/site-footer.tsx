import { company } from "@/lib/company";
export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#040b16] text-white">
      <div className="container grid gap-10 py-16 md:grid-cols-3">
        <div>
          <p className="text-2xl font-black">
            MEGA <span className="text-[#d2ad63]">STRIDE</span>
          </p>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
            Technology. Infrastructure. Trade. Transformation.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Technology engineering, digital solutions, professional development
            and ICT trade.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <h2 className="section-kicker text-[#d2ad63]">Explore</h2>
          <div className="mt-5 grid gap-4 text-sm text-slate-300">
            {[
              ["About us", "/about"],
              ["Services & solutions", "/services"],
              ["Global trade", "/trade"],
              ["Mega Stride Academy", "/academy"],
              ["Projects", "/projects"],
              ["Insights", "/insights"],
              ["Request a quotation", "/quotation"],
            ].map(([l, h]) => (
              <a key={h} href={h}>
                {l}
              </a>
            ))}
          </div>
        </nav>
        <div>
          <h2 className="section-kicker text-[#d2ad63]">
            Start a conversation
          </h2>
          <a className="mt-5 block text-sm" href={`mailto:${company.email}`}>
            {company.email}
          </a>
          <a className="mt-4 block text-sm" href={`tel:${company.phone}`}>
            {company.phoneDisplay}
          </a>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            {company.location}
          </p>
          <a
            href="https://www.facebook.com/profile.php?id=61590753162681"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block text-sm underline"
          >
            Facebook
          </a>
        </div>
      </div>
      <div className="container flex flex-wrap justify-between gap-5 border-t border-white/10 py-6 text-xs leading-6 text-slate-400">
        <p>
          © {new Date().getFullYear()} {company.name}. RC{" "}
          {company.registration}.
        </p>
        <nav aria-label="Policies" className="flex gap-5">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/academy/terms">Academy terms</a>
        </nav>
      </div>
    </footer>
  );
}
