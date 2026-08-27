"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    eyebrow: "SOFTWARE ENGINEERING",
    title: "Digital products engineered for real-world operations.",
    text: "From enterprise applications to web platforms and automation, we turn technology requirements into dependable digital products.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=88",
  },
  {
    eyebrow: "CLOUD & INFRASTRUCTURE",
    title: "Infrastructure built for scale, resilience and performance.",
    text: "Modern cloud, server, data and network environments designed to support secure and reliable business operations.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=88",
  },
  {
    eyebrow: "CYBERSECURITY",
    title: "Security engineered into every technology layer.",
    text: "Risk assessment, security audits, cyber defence and resilient architecture for organizations operating in a connected world.",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1600&q=88",
  },
  {
    eyebrow: "AI & EMERGING TECHNOLOGY",
    title: "Turning emerging technology into practical advantage.",
    text: "Explore artificial intelligence, automation, IoT and other emerging technologies with a focus on useful outcomes.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=88",
  },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  const previous = () => setActive((active - 1 + slides.length) % slides.length);
  const next = () => setActive((active + 1) % slides.length);

  return (
    <div
      className="relative mx-auto w-full max-w-[560px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-label="Mega Stride technology showcase"
    >
      <div className="hero-image-card relative aspect-[4/5] overflow-hidden rounded-[30px] border border-white/15 bg-slate-900 shadow-2xl">
        {slides.map((slide, index) => (
          <div
            key={slide.eyebrow}
            className={`absolute inset-0 transition-all duration-700 ${index === active ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-[1.03]"}`}
            aria-hidden={index !== active}
          >
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slide.image})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030b18] via-[#06101f]/45 to-[#06101f]/10" />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/15 bg-[#06101f]/78 p-5 backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300">{slide.eyebrow}</p>
              <h2 className="mt-2 text-xl font-black tracking-[-.03em] text-white sm:text-2xl">{slide.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{slide.text}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Engineering</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Security</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Innovation</span>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/15 bg-[#06101f]/60 px-3 py-2 text-[10px] font-black uppercase tracking-[.18em] text-white backdrop-blur-md">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" /> Technology in motion
        </div>

        <div className="absolute right-5 top-5 flex gap-2">
          <button type="button" onClick={previous} aria-label="Previous technology slide" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-[#06101f]/65 text-white backdrop-blur-md transition hover:bg-white/15">←</button>
          <button type="button" onClick={next} aria-label="Next technology slide" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-[#06101f]/65 text-white backdrop-blur-md transition hover:bg-white/15">→</button>
        </div>

        <div className="absolute bottom-6 right-6 flex gap-1.5">
          {slides.map((slide, index) => (
            <button key={slide.eyebrow} type="button" onClick={() => setActive(index)} aria-label={`Show slide ${index + 1}`} aria-current={index === active} className={`h-1.5 rounded-full transition-all ${index === active ? "w-8 bg-cyan-300" : "w-2 bg-white/40 hover:bg-white/70"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
