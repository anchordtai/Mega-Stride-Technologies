"use client";

import { useState } from "react";

const links = [["About", "/#about"], ["Services", "/#services"], ["Import & Export", "/#trade"], ["Academy", "/academy"]];
const whatsappUrl = "https://wa.me/23475721887?text=Hello%20Mega%20Stride%20Technologies%2C%20I%20would%20like%20to%20make%20an%20enquiry.";
const facebookUrl = "https://www.facebook.com/profile.php?id=61590753162681";

function FacebookIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M13.7 21v-7h2.35l.35-2.72H13.7V9.54c0-.79.22-1.33 1.36-1.33h1.45V5.78c-.25-.03-1.1-.1-2.09-.1-2.07 0-3.49 1.26-3.49 3.57v2.03H8.58V14h2.35v7h2.77Z" /></svg>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current"><path d="M12 2.25a9.65 9.65 0 0 0-8.31 14.56L2.2 21.8l5.14-1.46A9.65 9.65 0 1 0 12 2.25Zm0 17.55a7.87 7.87 0 0 1-4-1.09l-.29-.17-3.05.87.88-2.97-.19-.3A7.88 7.88 0 1 1 12 19.8Zm4.32-5.91c-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.31-.74-1.8-.2-.48-.4-.42-.54-.43h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.68 2.57 4.07 3.6.57.25 1.02.4 1.37.51.58.18 1.1.15 1.51.09.46-.07 1.43-.59 1.63-1.15.2-.57.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28Z" /></svg>;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#06101f]/78 text-white backdrop-blur-2xl">
      <div className="container flex h-[76px] items-center justify-between">
        <a href="/" onClick={() => setOpen(false)} className="flex items-center gap-3" aria-label="Mega Stride Technologies home"><span className="brand-mark">MS</span><span className="leading-none"><strong className="block text-[13px] tracking-[.16em]">MEGA STRIDE</strong><small className="mt-1 block text-[9px] font-semibold tracking-[.32em] text-cyan-300">TECHNOLOGIES LTD</small></span></a>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">{links.map(([label, href]) => <a key={label} href={href} className="nav-link">{label}</a>)}</nav>
        <div className="hidden items-center gap-3 md:flex"><a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Mega Stride Technologies on Facebook" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:border-blue-400/50 hover:bg-blue-500/15 hover:text-blue-300"><FacebookIcon /></a><a href="/contact" className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5">Contact</a><a href="/contact" className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-sm font-bold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/20">Start a conversation <span className="ml-2">↗</span></a></div>
        <button onClick={() => setOpen(!open)} className="rounded-xl border border-white/10 p-2.5 md:hidden" aria-label="Toggle navigation" aria-expanded={open}><span className="block h-0.5 w-5 bg-white" /><span className="mt-1.5 block h-0.5 w-5 bg-white" /><span className="mt-1.5 block h-0.5 w-5 bg-white" /></button>
      </div>
      {open && <nav className="border-t border-white/10 bg-[#06101f]/95 px-5 py-5 md:hidden" aria-label="Mobile navigation"><div className="container flex flex-col gap-1">{links.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-slate-200 hover:bg-white/5">{label}</a>)}<a href={facebookUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-200 hover:bg-white/5"><FacebookIcon /> Facebook</a><a href="/contact" onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-cyan-300 px-4 py-3 text-center font-bold text-[#06101f]">Start a conversation</a></div></nav>}
    </header>
    <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Chat with Mega Stride Technologies on WhatsApp" className="group fixed bottom-5 right-5 z-[60] flex items-center gap-3 rounded-full border border-white/20 bg-[#25D366] px-4 py-3 text-sm font-black text-white shadow-[0_12px_40px_rgba(37,211,102,.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(37,211,102,.5)]"><span className="grid h-9 w-9 place-items-center rounded-full bg-white/15"><WhatsAppIcon /></span><span className="hidden sm:block">Chat on WhatsApp</span></a>
  </>;
}
