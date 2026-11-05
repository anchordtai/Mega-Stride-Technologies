"use client";
import { useRef, useState } from "react";
const links = [
  ["About", "/about"],
  ["Solutions", "/services"],
  ["Global trade", "/trade"],
  ["Academy", "/academy"],
  ["Insights", "/insights"],
];
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#06101f]/95 text-white backdrop-blur-xl">
      <div className="container flex min-h-[88px] items-center justify-between gap-4 py-3">
        <a
          href="/"
          aria-label="Mega Stride Technologies home"
          className="shrink-0"
          onClick={() => setOpen(false)}
        >
          <span className="block text-xl font-black tracking-tight sm:text-2xl">
            MEGA <span className="text-[#d2ad63]">STRIDE</span>
          </span>
          <span className="block text-[9px] tracking-[.2em] text-slate-300">
            TECHNOLOGIES LIMITED
          </span>
        </a>
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-5 xl:flex"
        >
          {links.map(([label, href]) => (
            <a key={href} className="nav-link py-3" href={href}>
              {label}
            </a>
          ))}
        </nav>
        <a
          href="/contact"
          className="hidden rounded-full bg-white px-5 py-3 text-sm font-bold text-[#06101f] xl:inline-flex"
        >
          Start a conversation ↗
        </a>
        <button
          ref={toggle}
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="rounded-lg border border-white/30 px-4 py-3 text-sm xl:hidden"
        >
          {open ? "Close menu" : "Menu"}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="max-h-[calc(100dvh-88px)] overflow-y-auto border-t border-white/10 bg-[#06101f] xl:hidden"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              toggle.current?.focus();
            }
          }}
        >
          <div className="container grid gap-2 py-5">
            {[
              ...links,
              ["Contact", "/contact"],
              ["Request a quotation", "/quotation"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-4 text-base hover:bg-white/10"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
