"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BannerSlide } from "@/lib/home-defaults";
import type { TextStyle } from "@/lib/text-style";

/// The delivered script runs before React has hydrated on some homepage loads.
/// Own this CMS-rendered carousel in React so autoplay and the dot controls are
/// reliable regardless of load timing or client-side navigation.
export function HomeDevelopmentSlider({ heading, bannerText, slides, ctaLabel, ctaUrl, ctaVisible = true, headingPosition = "overlay", headingStyle, caption, captionVisible = false, captionPosition = "below", captionStyle, ctaPosition = "below", kicker }: { heading: string; bannerText?: string; slides: BannerSlide[]; ctaLabel?: string; ctaUrl?: string; ctaVisible?: boolean; headingPosition?: "overlay" | "above" | "below"; headingStyle?: TextStyle; caption?: string; captionVisible?: boolean; captionPosition?: "above" | "below"; captionStyle?: TextStyle; ctaPosition?: "below" | "above" | "left" | "right"; kicker?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % slides.length), 4200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  /// Newlines in editor content render as <br>, matching the delivered markup.
  const multiline = (value: string) => value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));

  const slideCaption = slides[activeIndex]?.text?.trim();
  const shownCaption = slideCaption || caption?.trim() || "";
  const captionBlock = captionVisible && shownCaption
    ? <section className={`pdf-section pdf-development-text pdf-development-text--${captionPosition}`} aria-label="Our development standard"><p style={captionStyle}>{multiline(shownCaption)}</p></section>
    : null;
  const outsideHeading = heading && headingPosition !== "overlay"
    ? <h2 className={`pdf-development-heading-outside pdf-development-heading-outside--${headingPosition}`} style={headingStyle}>{multiline(heading)}</h2>
    : null;
  return (
    <>
      {headingPosition === "above" ? outsideHeading : null}
      {captionPosition === "above" ? captionBlock : null}
      <section className={`pdf-section pdf-development-banner${ctaPosition === "above" ? " pdf-development-banner--cta-above" : ctaPosition === "left" || ctaPosition === "right" ? " pdf-development-banner--cta-row" : ""}`} id="developments" aria-roledescription="carousel" aria-label="Featured developments">
        <div className="pdf-development-slides" aria-hidden="true">
          {slides.map((slide, index) => (
            <div className={`pdf-development-slide${index === activeIndex ? " active" : ""}`} key={`${slide.image}-${index}`}><img src={slide.image} alt="" /></div>
          ))}
        </div>
        <div className="pdf-development-content">
          {kicker ? <p className="pdf-kicker pdf-kicker--light">{kicker}</p> : null}
          {headingPosition === "overlay" ? <h2 style={headingStyle}>{multiline(heading)}</h2> : null}
          {(() => {
            const button = ctaVisible && ctaLabel ? <Link className="pdf-development-button btn-pill text-white" href={ctaUrl || "/#development-cards"}>{ctaLabel}</Link> : null;
            const text = bannerText?.trim() ? <p>{multiline(bannerText)}</p> : null;
            if (ctaPosition === "left" || ctaPosition === "right") {
              return <div className="pdf-development-cta-row">{ctaPosition === "left" ? <>{button}{text}</> : <>{text}{button}</>}</div>;
            }
            return <>{ctaPosition === "above" ? <>{button}{text}</> : <>{text}{button}</>}</>;
          })()}
          <div className="pdf-development-dots" aria-label="Choose a development slide">
            {slides.map((slide, index) => (
              <button className={index === activeIndex ? "active" : undefined} type="button" onClick={() => setActiveIndex(index)} aria-label={`Show ${slide.label}`} aria-pressed={index === activeIndex} key={`${slide.label}-${index}`} />
            ))}
          </div>
        </div>
      </section>
      {headingPosition === "below" ? outsideHeading : null}
      {captionPosition !== "above" ? captionBlock : null}
    </>
  );
}
