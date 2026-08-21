"use client";

import { FormEvent, useState } from "react";

const bank = { bank: "First Bank Plc", accountName: "Anchord Taiwo", accountNumber: "3059463640" };

export default function CourseRegistration() {
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data.entries());
    const subject = encodeURIComponent(`Mega Stride Academy registration — ${payload.course}`);
    const body = encodeURIComponent(
      `Student: ${payload.name}\nEmail: ${payload.email}\nPhone: ${payload.phone}\nCourse: ${payload.course}\nPayment reference: ${payload.reference}\n\nI confirm that I have made/plan to make the bank transfer using the payment instructions shown on the website.`,
    );
    window.location.href = `mailto:info@megastride.com.ng?subject=${subject}&body=${body}`;
    localStorage.setItem("mega-stride-last-registration", JSON.stringify(payload));
    setReference(String(payload.reference || ""));
    setSubmitted(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[.78fr_1.22fr]">
      <aside className="rounded-[30px] bg-[#06101f] p-7 text-white shadow-2xl md:p-9">
        <p className="section-kicker text-cyan-300">Registration & payment</p>
        <h2 className="mt-4 text-3xl font-black tracking-[-.04em]">Reserve your place.</h2>
        <p className="mt-4 text-sm leading-7 text-slate-400">Select your course, complete the registration details and use the bank information below for transfer.</p>
        <div className="mt-8 rounded-2xl border border-cyan-300/20 bg-white/[.045] p-5">
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Bank transfer details</p>
          <dl className="mt-4 space-y-4 text-sm">
            <div><dt className="text-slate-500">Bank</dt><dd className="mt-1 font-bold">{bank.bank}</dd></div>
            <div><dt className="text-slate-500">Account name</dt><dd className="mt-1 font-bold">{bank.accountName}</dd></div>
            <div><dt className="text-slate-500">Account number</dt><dd className="mt-1 text-xl font-black tracking-[.12em]">{bank.accountNumber}</dd></div>
          </dl>
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 p-5 text-xs leading-6 text-slate-400">After transfer, enter your payment/reference number in the form. Your registration enquiry will be prepared for <strong className="text-white">info@megastride.com.ng</strong> for confirmation.</div>
      </aside>

      <form onSubmit={submit} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,.08)] md:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="form-label">Full name<input name="name" className="form-input" required placeholder="Student full name" /></label>
          <label className="form-label">Email<input name="email" type="email" className="form-input" required placeholder="student@email.com" /></label>
          <label className="form-label">Phone<input name="phone" type="tel" className="form-input" required placeholder="+234 ..." /></label>
          <label className="form-label">Course<select name="course" className="form-input"><option>Networking & Infrastructure</option><option>Cybersecurity Fundamentals</option><option>Linux & Server Administration</option><option>Cloud Computing & DevOps</option><option>Software Development</option><option>AI, Automation & Emerging Technologies</option></select></label>
        </div>
        <label className="form-label mt-5">Transfer/reference number<input name="reference" className="form-input" placeholder="Bank transfer reference (if available)" /></label>
        <label className="form-label mt-5">Learning goal<textarea name="goal" rows={4} className="form-input resize-none" placeholder="What do you want to achieve from this course?" /></label>
        <button type="submit" className="primary-button mt-6 w-full justify-center">Submit registration <span>↗</span></button>
        {submitted && <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"><strong>Registration prepared.</strong> Your email application should open with the registration details{reference ? ` and reference ${reference}` : ""}. Mega Stride can confirm enrolment after payment verification.</div>}
      </form>
    </div>
  );
}
