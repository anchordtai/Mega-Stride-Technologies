"use client";

import { useState } from "react";

const links = [["About", "/#about"], ["Services", "/#services"], ["Import & Export", "/#trade"], ["Academy", "/academy"]];
const facebookUrl = "https://www.facebook.com/profile.php?id=61590753162681";
const whatsappUrl = "https://wa.me/23475721887?text=Hello%20Mega%20Stride%20Technologies%2C%20I%20would%20like%20to%20make%20an%20enquiry.";

function FacebookIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M13.7 21v-7h2.35l.35-2.72H13.7V9.54c0-.79.22-1.33 1.36-1.33h1.45V5.78c-.25-.03-1.1-.1-2.09-.1-2.07 0-3.49 1.26-3.49 3.57v2.03H8.58V14h2.35v7h2.77Z" /></svg>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M16 3C8.82 3 3 8.54 3 15.38c0 2.2.6 4.27 1.74 6.1L3.08 28.7l7.4-1.62A13.24 13.24 0 0 0 16 27.76c7.18 0 13-5.54 13-12.38S23.18 3 16 3Zm0 22.48c-1.8 0-3.55-.47-5.1-1.36l-.37-.21-4.39.96.94-4.05-.24-.4a10.65 10.65 0 0 1-1.63-5.64C5.21 9.83 10.05 5.2 16 5.2s10.79 4.63 10.79 10.33S21.95 25.48 16 25.48Zm5.92-7.7c-.32-.16-1.9-.92-2.2-1.02-.3-.11-.52-.16-.74.16-.22.33-.85 1.02-1.04 1.23-.19.22-.38.24-.7.08-.32-.16-1.36-.48-2.58-1.54-.95-.82-1.59-1.83-1.78-2.14-.19-.33-.02-.5.14-.66.15-.15.32-.38.48-.57.16-.19.22-.33.33-.54.11-.22.05-.41-.03-.57-.08-.16-.74-1.76-1.01-2.41-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.57.08-.87.41-.3.33-1.14 1.1-1.14 2.68s1.17 3.11 1.33 3.33c.16.22 2.29 3.49 5.55 4.9.77.33 1.38.53 1.85.68.78.25 1.49.21 2.05.13.63-.09 1.9-.77 2.17-1.51.27-.74.27-1.38.19-1.51-.08-.14-.3-.22-.62-.38Z" /></svg>;
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#06101f]/95 text-white shadow-[0_10px_40px_rgba(0,0,0,.18)] backdrop-blur-2xl">
    <div className="container flex min-h-[82px] items-center justify-between gap-4 py-2">
      <a href="/" onClick={() => setOpen(false)} className="flex min-w-0 shrink-0 items-center gap-3" aria-label="Mega Stride Technologies home">
        <span className="flex h-[60px] w-[222px] items-center overflow-hidden rounded-xl bg-white px-2 shadow-[0_8px_28px_rgba(0,0,0,.18)] sm:h-[64px] sm:w-[244px]"><img src="/mega-stride-logo.webp" alt="Mega Stride Technologies Ltd" className="h-full w-full object-contain" width="500" height="139" /></span>
      </a>
      <nav className="hidden items-center gap-5 xl:flex" aria-label="Primary navigation">{links.map(([label, href]) => <a key={label} href={href} className="nav-link whitespace-nowrap">{label}</a>)}</nav>
      <div className="hidden items-center gap-2 lg:flex"><a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Chat with Mega Stride Technologies on WhatsApp" className="flex items-center gap-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-2 text-xs font-black text-[#b7ffd2] transition hover:-translate-y-0.5 hover:border-[#25D366]/60 hover:bg-[#25D366]/20"><WhatsAppIcon /> WhatsApp</a><a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Mega Stride Technologies on Facebook" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:-translate-y-0.5 hover:border-blue-400/50 hover:bg-blue-500/15 hover:text-blue-300"><FacebookIcon /></a><a href="/contact" className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/5">Contact</a><a href="/contact" className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-sm font-bold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/20">Start a conversation <span className="ml-2">↗</span></a></div>
      <button onClick={() => setOpen(!open)} className="rounded-xl border border-white/10 p-2.5 md:hidden" aria-label="Toggle navigation" aria-expanded={open}><span className="block h-0.5 w-5 bg-white" /><span className="mt-1.5 block h-0.5 w-5 bg-white" /><span className="mt-1.5 block h-0.5 w-5 bg-white" /></button>
    </div>
    {open && <nav className="border-t border-white/10 bg-[#06101f]/95 px-5 py-5 md:hidden" aria-label="Mobile navigation"><div className="container flex flex-col gap-1">{links.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-slate-200 hover:bg-white/5">{label}</a>)}<a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl bg-[#25D366]/10 px-3 py-3 font-bold text-[#b7ffd2] hover:bg-[#25D366]/20"><WhatsAppIcon /> Chat on WhatsApp</a><a href={facebookUrl} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-200 hover:bg-white/5"><FacebookIcon /> Facebook</a><a href="/contact" onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-cyan-300 px-4 py-3 text-center font-bold text-[#06101f]">Start a conversation</a></div></nav>}
  </header>;
}
