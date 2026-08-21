"use client";

import { useState } from "react";

const links = [["About", "/#about"], ["Services", "/#services"], ["Import & Export", "/#trade"], ["Academy", "/academy"]];
const facebookUrl = "https://www.facebook.com/profile.php?id=61590753162681";

function FacebookIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M13.7 21v-7h2.35l.35-2.72H13.7V9.54c0-.79.22-1.33 1.36-1.33h1.45V5.78c-.25-.03-1.1-.1-2.09-.1-2.07 0-3.49 1.26-3.49 3.57v2.03H8.58V14h2.35v7h2.77Z" /></svg>;
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#06101f]/78 text-white backdrop-blur-2xl">
    <div className="container flex h-[76px] items-center justify-between">
      <a href="/" onClick={() => setOpen(false)} className="flex items-center" aria-label="Mega Stride Technologies home">
        <img src="/mega-stride-logo.webp" alt="Mega Stride Technologies Ltd" className="h-12 w-auto max-w-[210px] object-contain" />
      </a>
      <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">{links.map(([label, href]) => <a key={label} href={href} className="nav-link">{label}</a>)}</nav>
      <div className="hidden items-center gap-3 md:flex"><a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Mega Stride Technologies on Facebook" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:border-blue-400/50 hover:bg-blue-500/15 hover:text-blue-300"><FacebookIcon /></a><a href="/contact" className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5">Contact</a><a href="/contact" className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-sm font-bold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/20">Start a conversation <span className="ml-2">↗</span></a></div>
      <button onClick={() => setOpen(!open)} className="rounded-xl border border-white/10 p-2.5 md:hidden" aria-label="Toggle navigation" aria-expanded={open}><span className="block h-0.5 w-5 bg-white" /><span className="mt-1.5 block h-0.5 w-5 bg-white" /><span className="mt-1.5 block h-0.5 w-5 bg-white" /></button>
    </div>
    {open && <nav className="border-t border-white/10 bg-[#06101f]/95 px-5 py-5 md:hidden" aria-label="Mobile navigation"><div className="container flex flex-col gap-1">{links.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-slate-200 hover:bg-white/5">{label}</a>)}<a href={facebookUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-200 hover:bg-white/5"><FacebookIcon /> Facebook</a><a href="/contact" onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-cyan-300 px-4 py-3 text-center font-bold text-[#06101f]">Start a conversation</a></div></nav>}
  </header>;
}
