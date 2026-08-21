const services = [
  ["01", "Software Engineering", "Web platforms, applications and digital products engineered for reliability, scale and measurable business value."],
  ["02", "Networks & Infrastructure", "Enterprise networks, wireless, telecommunications, data centres, servers and infrastructure operations."],
  ["03", "Cybersecurity", "Security assessment, risk management, penetration testing, cyber defence and security advisory."],
  ["04", "Cloud & Managed Services", "Cloud computing, hosting, virtualization, backup, disaster recovery and managed technology operations."],
  ["05", "Digital Transformation", "Business process automation, systems integration, enterprise solutions and technology advisory."],
  ["06", "Emerging Technology", "AI, automation, IoT, research and commercialization of new technology solutions."],
];

const capabilities = ["Technology consulting", "Systems integration", "Project & technical management", "ICT equipment & solutions", "Technology training", "Outsourced & managed services"];

export default function Home() {
  return (
    <main>
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#071426]/90 text-white backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between">
          <a href="#home" className="flex items-center gap-3" aria-label="Mega Stride Technologies home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-lg font-black">MS</span>
            <span className="leading-tight"><strong className="block text-sm tracking-wide">MEGA STRIDE</strong><small className="text-[10px] font-medium tracking-[.28em] text-cyan-300">TECHNOLOGIES LTD</small></span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#about" className="hover:text-white">About</a><a href="#services" className="hover:text-white">Services</a><a href="#capabilities" className="hover:text-white">Capabilities</a><a href="#contact" className="hover:text-white">Contact</a>
          </nav>
          <a href="#contact" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#071426] transition hover:bg-cyan-200">Start a conversation</a>
        </div>
      </header>

      <section id="home" className="hero-glow grid-pattern relative overflow-hidden bg-[#071426] pt-40 pb-28 text-white">
        <div className="container relative grid items-center gap-16 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <p className="mb-6 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[.22em] text-cyan-300">Technology. Infrastructure. Transformation.</p>
            <h1 className="max-w-4xl text-5xl font-black leading-[.98] tracking-[-.04em] md:text-7xl">Engineering technology that moves <span className="text-cyan-300">business forward.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">Mega Stride Technologies Ltd provides integrated ICT solutions across software, infrastructure, cybersecurity, cloud and digital transformation.</p>
            <div className="mt-9 flex flex-wrap gap-4"><a href="#services" className="rounded-full bg-blue-600 px-6 py-3.5 font-bold hover:bg-blue-500">Explore our services →</a><a href="#about" className="rounded-full border border-white/20 px-6 py-3.5 font-bold hover:bg-white/10">Who we are</a></div>
          </div>
          <div className="relative rounded-3xl border border-white/10 bg-white/[.05] p-8 shadow-2xl backdrop-blur-sm">
            <div className="mb-8 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.2em] text-slate-400">Our technology stack</span><span className="h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_20px_#67e8f9]" /></div>
            <div className="grid grid-cols-2 gap-3">{["Software", "Networks", "Cybersecurity", "Cloud", "Automation", "AI & IoT"].map((x,i)=><div key={x} className="rounded-2xl border border-white/10 bg-black/10 p-5"><span className="text-xs text-cyan-300">0{i+1}</span><p className="mt-6 font-bold">{x}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section id="about" className="bg-white py-24"><div className="container grid gap-14 lg:grid-cols-[.8fr_1.2fr]">
        <div><p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600">About Mega Stride</p><h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">A technology partner built for the next stride.</h2></div>
        <div className="text-lg leading-8 text-slate-600"><p>Mega Stride Technologies Ltd is a Nigerian technology company established to deliver practical, secure and scalable ICT solutions to public and private organizations.</p><p className="mt-5">Our corporate objects span software engineering, systems integration, enterprise technology, networks, telecommunications, cybersecurity, cloud infrastructure, digital products, training, research and emerging technologies.</p><div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3">{["Secure by design","Enterprise-ready","Innovation-led"].map(x=><div key={x} className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-800">{x}</div>)}</div></div>
      </div></section>

      <section id="services" className="bg-slate-50 py-24"><div className="container"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600">What we do</p><h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Integrated technology services.</h2></div><div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{services.map(([n,title,text])=><article key={title} className="group rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"><span className="text-xs font-black text-blue-600">{n}</span><h3 className="mt-10 text-xl font-black">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p><span className="mt-7 inline-block text-sm font-bold text-blue-600">Learn more →</span></article>)}</div></div></section>

      <section id="capabilities" className="bg-[#071426] py-24 text-white"><div className="container grid gap-14 lg:grid-cols-2"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-cyan-300">Built to deliver</p><h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">From strategy to implementation.</h2><p className="mt-6 max-w-xl leading-8 text-slate-300">We combine technical expertise, disciplined project delivery and long-term support to turn technology objectives into dependable operational systems.</p></div><div className="grid gap-3 sm:grid-cols-2">{capabilities.map((x)=><div key={x} className="rounded-2xl border border-white/10 bg-white/[.04] p-5 font-semibold">{x}<span className="float-right text-cyan-300">↗</span></div>)}</div></div></section>

      <section id="contact" className="py-24"><div className="container overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 to-cyan-600 p-8 text-white md:p-14"><div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-blue-100">Let's build what comes next</p><h2 className="mt-4 max-w-2xl text-4xl font-black tracking-tight md:text-6xl">Have a technology challenge?</h2><p className="mt-5 max-w-xl text-lg leading-8 text-blue-50">Talk to Mega Stride Technologies about your infrastructure, software, security or digital transformation needs.</p></div><a href="mailto:info@megastridetechnologies.com" className="rounded-full bg-white px-7 py-4 text-center font-black text-blue-700 hover:bg-blue-50">Contact us →</a></div></div></section>

      <footer className="bg-[#071426] py-10 text-slate-400"><div className="container flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div><p className="font-bold text-white">MEGA STRIDE TECHNOLOGIES LTD</p><p className="mt-1 text-sm">Technology solutions engineered for progress.</p></div><p className="text-sm">© {new Date().getFullYear()} Mega Stride Technologies Ltd. All rights reserved.</p></div></footer>
    </main>
  );
}
