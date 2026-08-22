const facebookUrl = "https://www.facebook.com/profile.php?id=61590753162681";
const whatsappUrl = "https://wa.me/23475721887?text=Hello%20Mega%20Stride%20Technologies%2C%20I%20would%20like%20to%20make%20an%20enquiry.";

function FacebookIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M13.7 21v-7h2.35l.35-2.72H13.7V9.54c0-.79.22-1.33 1.36-1.33h1.45V5.78c-.25-.03-1.1-.1-2.09-.1-2.07 0-3.49 1.26-3.49 3.57v2.03H8.58V14h2.35v7h2.77Z" /></svg>; }
function WhatsAppIcon() { return <svg viewBox="0 0 32 32" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M16 3C8.82 3 3 8.54 3 15.38c0 2.2.6 4.27 1.74 6.1L3.08 28.7l7.4-1.62A13.24 13.24 0 0 0 16 27.76c7.18 0 13-5.54 13-12.38S23.18 3 16 3Zm0 22.48c-1.8 0-3.55-.47-5.1-1.36l-.37-.21-4.39.96.94-4.05-.24-.4a10.65 10.65 0 0 1-1.63-5.64C5.21 9.83 10.05 5.2 16 5.2s10.79 4.63 10.79 10.33S21.95 25.48 16 25.48Zm5.92-7.7c-.32-.16-1.9-.92-2.2-1.02-.3-.11-.52-.16-.74.16-.22.33-.85 1.02-1.04 1.23-.19.22-.38.24-.7.08-.32-.16-1.36-.48-2.58-1.54-.95-.82-1.59-1.83-1.78-2.14-.19-.33-.02-.5.14-.66.15-.15.32-.38.48-.57.16-.19.22-.33.33-.54.11-.22.05-.41-.03-.57-.08-.16-.74-1.76-1.01-2.41-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.57.08-.87.41-.3.33-1.14 1.1-1.14 2.68s1.17 3.11 1.33 3.33c.16.22 2.29 3.49 5.55 4.9.77.33 1.38.53 1.85.68.78.25 1.49.21 2.05.13.63-.09 1.9-.77 2.17-1.51.27-.74.27-1.38.19-1.51-.08-.14-.3-.22-.62-.38Z" /></svg>; }
function MailIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 5.5h16v13H4z"/><path d="m4.5 6 7.5 6 7.5-6"/></svg>; }
function PhoneIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M7.2 4.2 9.7 3l2 4.1-1.8 1.5a14.7 14.7 0 0 0 5.5 5.5l1.5-1.8 4.1 2-1.2 2.5c-.5 1.1-1.7 1.7-2.9 1.5C10.8 17.1 6.9 13.2 5.7 7.1c-.2-1.2.4-2.4 1.5-2.9Z"/></svg>; }

export default function SiteFooter() {
  return <footer className="border-t border-white/10 bg-[#040b16] text-white">
    <div className="container grid gap-10 py-14 lg:grid-cols-[1.25fr_.8fr_.9fr]">
      <div>
        <div className="inline-flex rounded-2xl bg-white p-2 shadow-[0_12px_40px_rgba(0,0,0,.2)]"><img src="/mega-stride-logo.webp" alt="Mega Stride Technologies Ltd" className="h-16 w-[245px] object-contain" /></div>
        <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">Technology engineering, digital transformation, professional training, and ICT-related importation and exportation services.</p>
        <div className="mt-6 flex items-center gap-3">
          <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Mega Stride Technologies on Facebook" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[.03] text-slate-300 transition hover:-translate-y-1 hover:border-blue-400/40 hover:bg-blue-500/15 hover:text-blue-300"><FacebookIcon /></a>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Chat with Mega Stride Technologies on WhatsApp" className="grid h-11 w-11 place-items-center rounded-full border border-[#25D366]/20 bg-[#25D366]/[.06] text-[#7af0a6] transition hover:-translate-y-1 hover:border-[#25D366]/50 hover:bg-[#25D366]/15"><WhatsAppIcon /></a>
          <a href="mailto:info@megastride.com.ng" aria-label="Email Mega Stride Technologies" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[.03] text-slate-300 transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-200"><MailIcon /></a>
        </div>
      </div>
      <div><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">Explore</p><div className="mt-5 grid gap-3 text-sm text-slate-400"><a href="/#about" className="transition hover:text-white">About us</a><a href="/#services" className="transition hover:text-white">What we do</a><a href="/#trade" className="transition hover:text-white">Import & Export</a><a href="/academy" className="transition hover:text-white">Mega Stride Academy</a><a href="/contact" className="transition hover:text-white">Contact</a></div></div>
      <div><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">Contact</p><div className="mt-5 grid gap-4 text-sm text-slate-400"><a href="mailto:info@megastride.com.ng" className="flex gap-3 hover:text-white"><MailIcon /><span>info@megastride.com.ng</span></a><a href="tel:+2348138463804" className="flex gap-3 hover:text-white"><PhoneIcon /><span>+234 813 846 3804<br />+234 757 21887</span></a><p className="leading-6">59, Arab Road, Kubwa,<br />FCT Abuja, Nigeria</p></div></div>
    </div>
    <div className="border-t border-white/10"><div className="container flex flex-col gap-2 py-4 text-[11px] font-semibold tracking-[.08em] text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Mega Stride Technologies Ltd. All rights reserved.</span><span>COMPANY REGISTRATION NO. 9629475</span></div></div>
  </footer>;
}
