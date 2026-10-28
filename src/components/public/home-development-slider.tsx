"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BannerSlide } from "@/lib/home-defaults";

/// The delivered script runs before React has hydrated on some homepage loads.
/// Own this CMS-rendered carousel in React so autoplay and the dot controls are
/// reliable regardless of load timing or client-side navigation.
export function HomeDevelopmentSlider({ heading, slides, ctaLabel, ctaUrl, ctaVisible = true, headingPosition = "overlay" }: { heading: string; slides: BannerSlide[]; ctaLabel?: string; ctaUrl?: string; ctaVisible?: boolean; headingPosition?: "overlay" | "below" }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % slides.length), 4200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="pdf-section pdf-development-banner" id="developments" aria-roledescription="carousel" aria-label="Featured developments">
      <div className="pdf-development-slides" aria-hidden="true">
        {slides.map((slide, index) => (
          <div className={`pdf-development-slide${index === activeIndex ? " active" : ""}`} key={`${slide.image}-${index}`}><img src={slide.image} alt="" /></div>
        ))}
      </div>
      <div className="pdf-development-content">
        {headingPosition === "overlay" ? <h2>{heading}</h2> : null}
        {ctaVisible && ctaLabel ? <Link className="pdf-development-button btn-pill text-white" href={ctaUrl || "/#development-cards"}>{ctaLabel}</Link> : null}
        <div className="pdf-development-dots" aria-label="Choose a development slide">
          {slides.map((slide, index) => (
            <button className={index === activeIndex ? "active" : undefined} type="button" onClick={() => setActiveIndex(index)} aria-label={`Show ${slide.label}`} aria-pressed={index === activeIndex} key={`${slide.label}-${index}`} />
          ))}
        </div>
      </div>
      {headingPosition === "below" && heading ? <h2 className="pdf-development-heading-below">{heading}</h2> : null}
    </section>
  );
}
