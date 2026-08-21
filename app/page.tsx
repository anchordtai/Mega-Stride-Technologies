import SiteHeader from "@/components/site-header";

const services = [
  ["01", "Software & Digital Products", "Software engineering, application design, web platforms and digital products built around real operational needs."],
  ["02", "Networks & Infrastructure", "Enterprise networks, wireless, telecommunications, data centres, servers and infrastructure operations."],
  ["03", "Cybersecurity", "Security assessment, risk management, penetration testing, audits, digital forensics and cyber defence."],
  ["04", "Cloud & Resilience", "Cloud computing, hosting, virtualization, database management, backup and disaster recovery."],
  ["05", "Digital Transformation", "Systems integration, enterprise solutions, process automation and technology advisory for organizations."],
  ["06", "AI, Automation & IoT", "Research, innovation and commercialization of artificial intelligence, automation, IoT and emerging technologies."],
];

const capabilities = ["Technology consulting", "Systems integration", "Project & technical management", "ICT equipment & solutions", "Technology training", "Outsourced & managed services"];
const industries = ["Public sector", "Education", "Enterprise", "Infrastructure", "Technology", "Institutions"];

export default function Home() {
  return (
    <main className="overflow-hidden bg-white text-slate-950">
      <SiteHeader />

      <section id="home" className="hero relative min-h-[760px] overflow-hidden bg-[#06101f] pt-36 text-white">
        <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" /><div className="hero-lines" />
        <div className="container relative grid items-center gap-16 pb-28 lg:grid-cols-[1.08fr_.92fr] lg:pb-36">
          <div className="max-w-4xl">
            <div className="eyebrow"><span className="pulse-dot" /> Technology. Infrastructure. Transformation.</div>
            <h1 className="hero-title mt-7">Technology engineered for your <span className="gradient-text">next stride.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">Mega Stride Technologies Ltd delivers integrated ICT solutions spanning software, infrastructure, cybersecurity, cloud and digital transformation.</p>
            <div className="mt-10 flex flex-wrap gap-4"><a href="#services" className="primary-button">Explore capabilities <span>↗</span></a><a href="#about" className="secondary-button">Discover Mega Stride</a></div>
            <div className="mt-14 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-7 text-sm text-slate-400"><span><strong className="text-white">Secure</strong> by design</span><span><strong className="text-white">Scalable</strong> by architecture</span><span><strong className="text-white">Practical</strong> by delivery</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-[500px] lg:mr-0">
            <div className="tech-card">
              <div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-cyan-300">Technology ecosystem</p><p className="mt-1 text-sm text-slate-400">Integrated capabilities</p></div><span className="status-chip"><span className="pulse-dot" /> Ready</span></div>
              <div className="tech-core"><div className="core-ring ring-one" /><div className="core-ring ring-two" /><div className="core-center"><span>MS</span><small>TECH</small></div>{["SOFTWARE","CLOUD","SECURITY","NETWORKS"].map((x,i)=><span key={x} className={`orbit-label orbit-${i}`}>{x}</span>)}</div>
              <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-5">{[["Software", "01"], ["Infrastructure", "02"], ["Security", "03"], ["Emerging tech", "04"]].map(([x,n])=><div key={x} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="text-[10px] font-bold text-cyan-300">{n}</span><p className="mt-4 text-sm font-bold">{x}</p></div>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-8"><div className="container grid grid-cols-2 gap-6 md:grid-cols-4"><div className="metric"><strong>06</strong><span>Technology pillars</span></div><div className="metric"><strong>360°</strong><span>ICT capability</span></div><div className="metric"><strong>01</strong><span>Integrated partner</span></div><div className="metric"><strong>∞</strong><span>Room to innovate</span></div></div></section>

      <section id="about" className="section-space relative"><div className="container grid gap-16 lg:grid-cols-[.82fr_1.18fr] lg:items-center"><div><p className="section-kicker">Who we are</p><h2 className="section-title">A technology partner built for the next stride.</h2></div><div><p className="lead-copy">Mega Stride Technologies Ltd is established to provide practical, secure and scalable ICT solutions to public and private organizations.</p><p className="body-copy">Our corporate scope brings together software engineering, systems integration, enterprise technology, networking, telecommunications, cybersecurity, cloud infrastructure, digital products, training, research and emerging technologies.</p><div className="mt-9 grid gap-3 sm:grid-cols-3"><div className="value-card"><span>01</span><strong>Practical</strong><p>Solutions designed for operational reality.</p></div><div className="value-card"><span>02</span><strong>Secure</strong><p>Security considered throughout the lifecycle.</p></div><div className="value-card"><span>03</span><strong>Forward</strong><p>Built with emerging technology in view.</p></div></div></div></div></section>

      <section id="services" className="section-space bg-slate-50"><div className="container"><div className="section-heading-row"><div><p className="section-kicker">What we do</p><h2 className="section-title max-w-3xl">One partner. A complete technology spectrum.</h2></div><p className="max-w-md text-base leading-7 text-slate-500">From infrastructure foundations to intelligent digital products, our capabilities are designed to work together.</p></div><div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{services.map(([n,title,text])=><article key={title} className="service-card"><div className="flex items-start justify-between"><span className="service-number">{n}</span><span className="service-arrow">↗</span></div><div className="service-icon">+</div><h3>{title}</h3><p>{text}</p><div className="service-line" /></article>)}</div></div></section>

      <section id="capabilities" className="dark-section"><div className="container grid gap-16 lg:grid-cols-[.85fr_1.15fr] lg:items-center"><div><p className="section-kicker text-cyan-300">Built to deliver</p><h2 className="section-title text-white">From strategy to implementation.</h2><p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">We combine technical expertise, disciplined delivery and long-term support to turn technology objectives into dependable operational systems.</p><a href="#contact" className="mt-9 inline-flex text-sm font-bold text-cyan-300 hover:text-white">Talk about your technology needs <span className="ml-2">→</span></a></div><div className="grid gap-3 sm:grid-cols-2">{capabilities.map((x,i)=><div key={x} className="capability-row"><span className="text-xs text-cyan-300">0{i+1}</span><strong>{x}</strong><span className="text-slate-500">↗</span></div>)}</div></div></section>

      <section id="approach" className="section-space"><div className="container"><div className="max-w-2xl"><p className="section-kicker">Our approach</p><h2 className="section-title">Technology without the complexity.</h2></div><div className="mt-14 grid gap-4 md:grid-cols-3"><div className="process-card"><span>01</span><h3>Understand</h3><p>We clarify the operational challenge, constraints and desired outcome before recommending technology.</p></div><div className="process-card featured"><span>02</span><h3>Engineer</h3><p>We design integrated solutions around security, reliability, scalability and maintainability.</p></div><div className="process-card"><span>03</span><h3>Enable</h3><p>We support implementation, knowledge transfer and ongoing technology operations.</p></div></div></div></section>

      <section className="border-y border-slate-200 bg-slate-50 py-14"><div className="container"><p className="mb-7 text-center text-xs font-bold uppercase tracking-[.25em] text-slate-400">Designed to serve</p><div className="flex flex-wrap justify-center gap-3">{industries.map(x=><span key={x} className="industry-pill">{x}</span>)}</div></div></section>

      <section id="contact" className="section-space"><div className="container"><div className="cta-panel"><div className="cta-glow" /><div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="section-kicker text-cyan-200">Start the conversation</p><h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-.04em] text-white md:text-6xl">Have a technology challenge worth solving?</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">Tell us what you are building, securing, modernizing or transforming.</p></div><a href="/contact" className="rounded-full bg-white px-7 py-4 text-center font-black text-[#0754c7] shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-50">Contact Mega Stride <span className="ml-2">↗</span></a></div></div></div></section>

      <footer className="bg-[#06101f] py-12 text-slate-400"><div className="container grid gap-8 md:grid-cols-2"><div><div className="flex items-center gap-3 text-white"><span className="brand-mark">MS</span><strong className="tracking-[.16em]">MEGA STRIDE</strong></div><p className="mt-4 max-w-sm text-sm leading-6">Technology solutions across software, infrastructure, cybersecurity, cloud and digital transformation.</p></div><div className="md:text-right"><p className="text-sm font-semibold text-white">MEGA STRIDE TECHNOLOGIES LTD</p><p className="mt-2 text-sm">Nigeria · Technology & ICT Solutions</p><p className="mt-6 text-xs text-slate-500">© {new Date().getFullYear()} Mega Stride Technologies Ltd. All rights reserved.</p></div></div></footer>
    </main>
  );
}
