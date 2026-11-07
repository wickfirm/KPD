"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BannerSlide } from "@/lib/home-defaults";
import type { TextStyle } from "@/lib/text-style";

/// The delivered script runs before React has hydrated on some homepage loads.
/// Own this CMS-rendered carousel in React so autoplay and the dot controls are
/// reliable regardless of load timing or client-side navigation.
///
/// Gallery-light layout (section batch 3): a section header (mono kicker +
/// display heading, "All developments" link right) above a framed slide panel
/// with a white card — the active slide's name, its copy, the CTA and the
/// slide dots. The delivered heading/CTA placement options are superseded by
/// this fixed layout; their settings remain in saved content but no longer
/// change the render.
export function HomeDevelopmentSlider({ heading, bannerText, slides, ctaLabel, ctaUrl, ctaVisible = true, headingStyle, kicker, caption, captionVisible = false, captionPosition = "below", captionStyle }: { heading: string; bannerText?: string; slides: BannerSlide[]; ctaLabel?: string; ctaUrl?: string; ctaVisible?: boolean; headingStyle?: TextStyle; kicker?: string; caption?: string; captionVisible?: boolean; captionPosition?: "above" | "below"; captionStyle?: TextStyle }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % slides.length), 4200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  /// Newlines in editor content render as <br>, matching the delivered markup.
  const multiline = (value: string) => value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={`br-${index}`} />, line]));

  const active = slides[activeIndex];
  const shownText = active?.text?.trim() || bannerText?.trim() || "";
  const captionBlock = captionVisible && shownText
    ? <section className={`pdf-section pdf-development-text pdf-development-text--${captionPosition}`} aria-label="Our development standard"><p style={captionStyle}>{multiline(shownText)}</p></section>
    : null;
  return (
    <>
      {captionPosition === "above" ? captionBlock : null}
      <section className="pdf-section pdf-latest" id="developments" aria-roledescription="carousel" aria-label="Featured developments">
        <div className="pdf-sec-top">
          <div>
            {kicker ? <p className="pdf-kicker">{kicker}</p> : null}
            <h2 style={headingStyle}>{multiline(heading)}</h2>
          </div>
          <Link className="pdf-dev-all" href="/developments">All developments <span className="pdf-dev-all-arrow" aria-hidden="true">→</span></Link>
        </div>
        <div className="pdf-dev-frame">
          <div className="pdf-development-slides" aria-hidden="true">
            {slides.map((slide, index) => (
              <div className={`pdf-development-slide${index === activeIndex ? " active" : ""}`} key={`${slide.image}-${index}`}><img src={slide.image} alt="" /></div>
            ))}
          </div>
          {active?.tag?.trim() ? <div className="pdf-dev-tag"><span className="pdf-chip">{active.tag}</span></div> : null}
          <div className="pdf-development-content">
            {active?.label?.trim() ? <h2 className="pdf-dev-card-title">{active.label}</h2> : null}
            {shownText ? <p>{multiline(shownText)}</p> : null}
            {ctaVisible && ctaLabel ? <Link className="pdf-development-button btn-pill text-white" href={ctaUrl || "/#development-cards"}>{ctaLabel} <span className="pdf-dev-btn-arrow" aria-hidden="true">→</span></Link> : null}
            <div className="pdf-development-dots" aria-label="Choose a development slide">
              {slides.map((slide, index) => (
                <button className={index === activeIndex ? "active" : undefined} type="button" onClick={() => setActiveIndex(index)} aria-label={`Show ${slide.label}`} aria-pressed={index === activeIndex} key={`${slide.label}-${index}`} />
              ))}
            </div>
          </div>
        </div>
      </section>
      {captionPosition !== "above" ? captionBlock : null}
    </>
  );
}
