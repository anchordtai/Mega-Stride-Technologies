"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const service = String(form.get("service") || "General enquiry");
    const message = String(form.get("message") || "").trim();
    if (!name || !email || !message) { setError("Please complete your name, email and message."); return; }
    const subject = encodeURIComponent(`Mega Stride enquiry — ${service}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\nService: ${service}\n\nMessage:\n${message}`);
    window.location.href = `mailto:info@megastride.com.ng?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return <form onSubmit={submit} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,.08)] md:p-8"><div className="grid gap-5 md:grid-cols-2"><label className="form-label">Full name<input name="name" className="form-input" placeholder="Your full name" required /></label><label className="form-label">Email address<input name="email" type="email" className="form-input" placeholder="you@company.com" required /></label><label className="form-label">Phone number<input name="phone" type="tel" className="form-input" placeholder="+234 ..." /></label><label className="form-label">Service of interest<select name="service" className="form-input"><option>Software & digital products</option><option>Networks & infrastructure</option><option>Cybersecurity</option><option>Cloud & resilience</option><option>Digital transformation</option><option>AI, automation & IoT</option><option>Importation & exportation</option><option>Technology training</option><option>General enquiry</option></select></label></div><label className="form-label mt-5">How can we help?<textarea name="message" rows={6} className="form-input resize-none" placeholder="Tell us about your project, requirement or enquiry..." required /></label>{error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{sent && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Your email application should now open with the enquiry prepared for Mega Stride. If it does not, email info@megastride.com.ng directly.</p>}<button className="primary-button mt-6 w-full justify-center md:w-auto" type="submit">Prepare enquiry <span>↗</span></button><p className="mt-3 text-xs leading-5 text-slate-400">This form opens your device&apos;s email client with the enquiry details. A server-side CRM/email integration can be connected before launch.</p></form>;
}
