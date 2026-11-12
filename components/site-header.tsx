"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { serviceCategories } from "@/lib/company";
const links = [
  ["About", "/about"],
  ["Industries", "/industries"],
  ["Projects", "/projects"],
  ["Academy", "/academy"],
  ["Insights", "/insights"],
  ["Global trade", "/trade"],
];
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const solutions = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (solutions.current?.open) {
          solutions.current.open = false;
          solutions.current.querySelector("summary")?.focus();
        }
        if (open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  const active = (href: string) => path === href || path.startsWith(href + "/");
  return (
    <header className="masthead">
      <div className="container masthead-row">
        <a
          className="wordmark"
          href="/"
          aria-label="Mega Stride Technologies home"
        >
          <Image
            src="/brand/mega-stride-logo.webp"
            alt="Mega Stride Technologies Ltd"
            width={1100}
            height={304}
            className="company-logo"
            priority
          />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a
            className="nav-item"
            href="/about"
            aria-current={active("/about") ? "page" : undefined}
          >
            About
          </a>
          <details
            ref={solutions}
            className="solutions-menu"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                e.currentTarget.open = false;
            }}
          >
            <summary
              className={`nav-item ${active("/services") ? "selected" : ""}`}
            >
              Solutions <span aria-hidden="true">⌄</span>
            </summary>
            <div className="mega-menu">
              <div className="menu-intro">
                <p className="section-kicker">Our expertise</p>
                <h2>
                  Connected thinking.
                  <br />
                  Practical solutions.
                </h2>
                <a href="/services">All solutions ↗</a>
              </div>
              <div className="menu-services">
                {serviceCategories.map((s) => (
                  <a key={s.slug} href={`/services/${s.slug}`}>
                    <strong>{s.title}</strong>
                    <span>{s.summary}</span>
                  </a>
                ))}
              </div>
            </div>
          </details>
          {links.slice(1).map(([l, h]) => (
            <a
              className="nav-item"
              key={h}
              href={h}
              aria-current={active(h) ? "page" : undefined}
            >
              {l}
            </a>
          ))}
        </nav>
        <a className="header-quote" href="/quotation">
          Let’s talk <span aria-hidden="true">↗</span>
        </a>
        <button
          ref={toggle}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}{" "}
          <span aria-hidden="true">{open ? "×" : "☰"}</span>
        </button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          <div className="container">
            {[
              ["Home", "/"],
              links[0],
              ["Solutions", "/services"],
              ...links.slice(1),
              ["Contact", "/contact"],
              ["Request a quotation", "/quotation"],
            ].map(([l, h]) => (
              <a
                href={h}
                key={h}
                aria-current={path === h ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {l}
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
