"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    title: "Cloud & Data Centre Infrastructure",
    image: "/images/hero/cloud-data-centre.jpeg",
  },
  {
    title: "Enterprise Technology & Digital Transformation",
    image: "/images/hero/enterprise-technology.jpeg",
  },
  {
    title: "Software Engineering & Digital Products",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1800&q=90",
  },
  {
    title: "Cybersecurity, AI & Emerging Technology",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1800&q=90",
  },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [paused]);

  const previous = () => setActive((current) => (current - 1 + slides.length) % slides.length);
  const next = () => setActive((current) => (current + 1) % slides.length);

  return (
    <div
      className="relative mx-auto w-full max-w-[700px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-label="Mega Stride Technologies visual showcase"
    >
      <div className="hero-image-card relative aspect-[16/10] overflow-hidden rounded-[32px] border border-white/15 bg-slate-950 shadow-[0_30px_90px_rgba(0,0,0,.42)]">
        {slides.map((slide, index) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              index === active
                ? "opacity-100 scale-100"
                : "pointer-events-none opacity-0 scale-[1.04]"
            }`}
            aria-hidden={index !== active}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            {/* Clean cinematic overlay: deliberately keeps the slide focused on image + title. */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020817]/90 via-[#020817]/20 to-transparent" />

            <div className="absolute inset-x-6 bottom-7 sm:inset-x-8 sm:bottom-9">
              <h2 className="max-w-2xl text-2xl font-black leading-[1.05] tracking-[-.045em] text-white drop-shadow-2xl sm:text-3xl md:text-4xl lg:text-[2.7rem]">
                {slide.title}
              </h2>
            </div>
          </div>
        ))}

        <div className="absolute right-5 top-5 flex gap-2 sm:right-6 sm:top-6">
          <button
            type="button"
            onClick={previous}
            aria-label="Previous technology image"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/35 text-lg text-white backdrop-blur-md transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            ←
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next technology image"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/35 text-lg text-white backdrop-blur-md transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            →
          </button>
        </div>

        <div className="absolute bottom-6 right-6 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-2.5 py-2 backdrop-blur-md" aria-label="Carousel navigation">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1}: ${slide.title}`}
              aria-current={index === active}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === active
                  ? "w-8 bg-white"
                  : "w-1.5 bg-white/45 hover:bg-white/80"
              }`}
            />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 h-1 w-full bg-white/10">
          <div
            className="h-full bg-cyan-300 transition-[width] duration-300"
            style={{ width: `${((active + 1) / slides.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
