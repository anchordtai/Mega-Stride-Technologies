"use client";

import { useState } from "react";

const links = [["About", "/#about"], ["Services", "/#services"], ["Import & Export", "/#trade"], ["Academy", "/academy"]];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#06101f]/78 text-white backdrop-blur-2xl">
      <div className="container flex h-[76px] items-center justify-between">
        <a href="/" onClick={() => setOpen(false)} className="flex items-center gap-3" aria-label="Mega Stride Technologies home"><span className="brand-mark">MS</span><span className="leading-none"><strong className="block text-[13px] tracking-[.16em]">MEGA STRIDE</strong><small className="mt-1 block text-[9px] font-semibold tracking-[.32em] text-cyan-300">TECHNOLOGIES LTD</small></span></a>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">{links.map(([label, href]) => <a key={label} href={href} className="nav-link">{label}</a>)}</nav>
        <div className="hidden items-center gap-3 md:flex"><a href="/contact" className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5">Contact</a><a href="/contact" className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-sm font-bold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/20">Start a conversation <span className="ml-2">↗</span></a></div>
        <button onClick={() => setOpen(!open)} className="rounded-xl border border-white/10 p-2.5 md:hidden" aria-label="Toggle navigation" aria-expanded={open}><span className="block h-0.5 w-5 bg-white" /><span className="mt-1.5 block h-0.5 w-5 bg-white" /><span className="mt-1.5 block h-0.5 w-5 bg-white" /></button>
      </div>
      {open && <nav className="border-t border-white/10 bg-[#06101f]/95 px-5 py-5 md:hidden" aria-label="Mobile navigation"><div className="container flex flex-col gap-1">{links.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-slate-200 hover:bg-white/5">{label}</a>)}<a href="/contact" onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-cyan-300 px-4 py-3 text-center font-bold text-[#06101f]">Start a conversation</a></div></nav>}
    </header>
  );
}
