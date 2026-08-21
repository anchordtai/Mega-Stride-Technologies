"use client";

import { useEffect, useState } from "react";

const defaultCourses = [
  { id: "net", title: "Networking & Infrastructure", level: "Intermediate", progress: 34, lessons: 12 },
  { id: "cyber", title: "Cybersecurity Fundamentals", level: "Foundation", progress: 0, lessons: 10 },
  { id: "cloud", title: "Cloud Computing & DevOps", level: "Intermediate", progress: 0, lessons: 14 },
];

export default function AcademyDashboard() {
  const [courses, setCourses] = useState(defaultCourses);
  const [name, setName] = useState("Learner");

  useEffect(() => {
    const registration = localStorage.getItem("mega-stride-last-registration");
    if (registration) {
      try {
        const data = JSON.parse(registration) as { name?: string; course?: string };
        if (data.name) setName(data.name);
        if (data.course) setCourses((items) => [{ id: "registered", title: data.course || "Registered course", level: "Enrolled", progress: 0, lessons: 8 }, ...items.filter((item) => item.title !== data.course)]);
      } catch { /* Ignore malformed local browser data. */ }
    }
  }, []);

  function continueCourse(id: string) {
    setCourses((items) => items.map((course) => course.id === id ? { ...course, progress: Math.min(100, course.progress + 10) } : course));
  }

  return (
    <div className="space-y-6">
      <section className="academy-dashboard-hero">
        <div><p className="section-kicker text-cyan-300">Learner dashboard</p><h1 className="mt-3 text-3xl font-black tracking-[-.04em] text-white md:text-5xl">Welcome back, {name}.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Continue your learning journey, track progress and access your enrolled technology courses.</p></div>
        <div className="dashboard-stat"><strong>{courses.filter((x) => x.progress > 0).length}</strong><span>Active courses</span></div>
      </section>
      <div className="grid gap-4 md:grid-cols-3"><div className="dashboard-mini"><span>Learning hours</span><strong>08h 20m</strong></div><div className="dashboard-mini"><span>Lessons completed</span><strong>{Math.round(courses.reduce((sum, x) => sum + (x.lessons * x.progress) / 100, 0))}</strong></div><div className="dashboard-mini"><span>Certificates</span><strong>0</strong></div></div>
      <section><div className="mb-5 flex items-end justify-between"><div><p className="section-kicker">My learning</p><h2 className="mt-2 text-2xl font-black">Continue where you left off.</h2></div><a href="/academy" className="text-sm font-bold text-blue-600">Browse academy →</a></div><div className="grid gap-4 lg:grid-cols-2">{courses.map((course) => <article key={course.id} className="dashboard-course"><div className="flex items-start justify-between gap-4"><div><span className="course-badge">{course.level}</span><h3 className="mt-4 text-xl font-black">{course.title}</h3><p className="mt-2 text-sm text-slate-500">{course.lessons} structured lessons</p></div><span className="text-2xl font-black text-blue-600">{course.progress}%</span></div><div className="progress-track"><span style={{ width: `${course.progress}%` }} /></div><button onClick={() => continueCourse(course.id)} className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">Continue learning →</button></article>)}</div></section>
    </div>
  );
}
