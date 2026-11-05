"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { visuals } from "@/lib/visuals";
const slides = [
  {
    title: "Infrastructure",
    detail: "The foundation for everything that follows.",
    image: visuals.infrastructure,
    alt: "AI illustration of a modern data centre with precision server racks and fibre connectivity",
  },
  {
    title: "Transformation",
    detail: "Connect your people, processes and technology.",
    image: visuals.operations,
    alt: "AI illustration of a professional team in an enterprise operations environment",
  },
  {
    title: "Digital products",
    detail: "Engineer the tools your next chapter needs.",
    image: visuals.software,
    alt: "AI illustration of software engineers collaborating in a daylight studio",
  },
  {
    title: "Connectivity",
    detail: "A connected view of your digital future.",
    image: visuals.connectivity,
    alt: "AI concept of a globe formed from illuminated fibre pathways",
  },
];
export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => {
      if (media.matches) setPlaying(false);
    };
    media.addEventListener("change", stop);
    return () => media.removeEventListener("change", stop);
  }, []);
  useEffect(() => {
    if (!playing || hovered) return;
    const timer = window.setInterval(
      () => setActive((x) => (x + 1) % slides.length),
      7000,
    );
    return () => window.clearInterval(timer);
  }, [playing, hovered]);
  const slide = slides[active];
  return (
    <section
      className="cinematic-hero"
      aria-label="Mega Stride technology showcase"
      aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setPlaying(false)}
    >
      <div className="cinematic-photo" key={slide.image}>
        <Image
          src={slide.image}
          alt={slide.alt}
          fill
          sizes="100vw"
          priority={active === 0}
          style={{ objectFit: "cover" }}
        />
      </div>
      <div className="cinematic-shade" />
      <div className="container cinematic-content">
        <p className="section-kicker">MEGA STRIDE / ENGINEERING WHAT’S NEXT</p>
        <h1>
          Technology
          <br />
          engineered for
          <br />
          <em>your next stride.</em>
        </h1>
        <p className="cinematic-intro">
          Infrastructure. Software. Intelligence.
          <br />
          Connected expertise to move your organisation forward.
        </p>
        <div className="hero-actions">
          <a href="/services" className="primary-button">
            Explore our solutions <span aria-hidden="true">↗</span>
          </a>
          <a href="/contact" className="secondary-button">
            Discuss your project <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="cinematic-note">
          <span>ABUJA, NIGERIA</span>
          <span>CONNECTED THINKING. PRACTICAL ENGINEERING.</span>
        </div>
      </div>
      <div className="container cinematic-controls">
        <div className="scene-choices" aria-label="Choose a technology scene">
          {slides.map((x, i) => (
            <button
              key={x.title}
              type="button"
              aria-pressed={active === i}
              onClick={() => {
                setActive(i);
                setPlaying(false);
              }}
            >
              <span>0{i + 1}</span>
              {x.title}
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
        <button
          className="scene-play"
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-pressed={playing}
        >
          {playing ? "Pause" : "Play"} showcase{" "}
          <span aria-hidden="true">{playing ? "Ⅱ" : "▷"}</span>
        </button>
      </div>
      <div className="container scene-description">
        <p aria-live={playing ? "off" : "polite"}>{slide.detail}</p>
        <span>Original AI illustration</span>
      </div>
    </section>
  );
}
