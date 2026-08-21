import SiteHeader from "@/components/site-header";
import ContactForm from "@/components/contact-form";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader />
      <section className="inner-hero"><div className="container"><p className="section-kicker text-cyan-300">Contact Mega Stride</p><h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-.06em] text-white md:text-7xl">Let&apos;s turn your technology requirement into a plan.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Tell us what you are building, securing, modernizing, importing or exporting and our team can help define the next step.</p></div></section>
      <section className="section-space"><div className="container grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-start"><div className="space-y-5"><div className="contact-info-card"><span className="contact-icon">☎</span><div><p>Phone</p><a href="tel:+2348138463804">+234 813 846 3804</a><a href="tel:+23475721887">+234 757 21887</a></div></div><div className="contact-info-card"><span className="contact-icon">@</span><div><p>Email</p><a href="mailto:info@megastride.com.ng">info@megastride.com.ng</a></div></div><div className="contact-info-card"><span className="contact-icon">⌖</span><div><p>Address</p><span>59, Arab Road, Kubwa, FCT Abuja, Nigeria</span></div></div><div className="rounded-[24px] bg-blue-50 p-6 text-sm leading-7 text-blue-900"><strong>Business enquiries</strong><br />Software · infrastructure · cybersecurity · cloud · training · importation · exportation</div></div><ContactForm /></div></section>
    </main>
  );
}
