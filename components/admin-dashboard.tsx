"use client";

import { ChangeEvent, useEffect, useState } from "react";

type Content = { name: string; type: string; size: number; course: string; added: string };

export default function AdminDashboard() {
  const [course, setCourse] = useState("Networking & Infrastructure");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<Content[]>([]);

  useEffect(() => {
    try { setContent(JSON.parse(localStorage.getItem("mega-stride-admin-content") || "[]")); } catch { setContent([]); }
  }, []);

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const item = { name: title || file.name, type: file.type || "file", size: file.size, course, added: new Date().toLocaleDateString() };
    const next = [item, ...content];
    setContent(next);
    localStorage.setItem("mega-stride-admin-content", JSON.stringify(next));
    setTitle("");
    event.target.value = "";
  }

  function remove(index: number) {
    const next = content.filter((_, itemIndex) => itemIndex !== index);
    setContent(next);
    localStorage.setItem("mega-stride-admin-content", JSON.stringify(next));
  }

  return (
    <div className="space-y-6">
      <section className="academy-dashboard-hero"><div><p className="section-kicker text-cyan-300">Mega Stride Academy</p><h1 className="mt-3 text-3xl font-black tracking-[-.04em] text-white md:text-5xl">Course administration.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Create a structured content library for learners and keep course resources organized.</p></div><div className="dashboard-stat"><strong>{content.length}</strong><span>Content items</span></div></section>
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8"><div className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end"><label className="form-label">Course<select className="form-input" value={course} onChange={(e) => setCourse(e.target.value)}><option>Networking & Infrastructure</option><option>Cybersecurity Fundamentals</option><option>Linux & Server Administration</option><option>Cloud Computing & DevOps</option><option>Software Development</option><option>AI, Automation & Emerging Technologies</option></select></label><label className="form-label">Lesson/resource title<input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. VLANs and segmentation" /></label><label className="primary-button cursor-pointer justify-center"><span>Upload resource</span><input type="file" className="hidden" accept="video/*,audio/*,application/pdf,.ppt,.pptx,.doc,.docx,.txt" onChange={upload} /></label></div><p className="mt-4 text-xs leading-5 text-slate-400">Prototype content manager: files are catalogued in this browser. Before public launch, connect secure authentication and object storage (such as Vercel Blob) so course files are stored privately and available to enrolled users.</p></section>
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8"><div className="flex items-end justify-between"><div><p className="section-kicker">Content library</p><h2 className="mt-2 text-2xl font-black">Uploaded resources</h2></div><span className="text-sm text-slate-400">{content.length} items</span></div>{content.length === 0 ? <div className="mt-8 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">No resources uploaded yet.</div> : <div className="mt-6 divide-y divide-slate-100">{content.map((item, index) => <div key={`${item.name}-${index}`} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-bold">{item.name}</p><p className="mt-1 text-xs text-slate-400">{item.course} · {item.type || "file"} · {(item.size / 1024 / 1024).toFixed(2)} MB · {item.added}</p></div><button onClick={() => remove(index)} className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Remove</button></div>)}</div>}</section>
    </div>
  );
}
