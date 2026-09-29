"use client";

import { useEffect } from "react";

/// Client-side behaviour for the restored Investor Guide sections. The legacy
/// site.js bundle is not loaded on migrated routes, so the pathway carousel
/// controls and the benefits carousel progress/auto-advance are wired here,
/// mirroring initInvestBenefitCarousels/initInvestScrollCarousel in site.js.
export function InvestEnhancements() {
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Pathway / scroll carousels (prev + next buttons) ───────────────
    document.querySelectorAll<HTMLElement>("[data-invest-scroll-carousel]").forEach((carousel) => {
      const track = carousel.querySelector<HTMLElement>("[data-invest-scroll-track]");
      const prev = carousel.querySelector<HTMLElement>("[data-invest-scroll-prev]");
      const next = carousel.querySelector<HTMLElement>("[data-invest-scroll-next]");
      if (!track) return;
      const step = (direction: number) => {
        track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: prefersReducedMotion ? "auto" : "smooth" });
      };
      const prevHandler = () => step(-1);
      const nextHandler = () => step(1);
      prev?.addEventListener("click", prevHandler);
      next?.addEventListener("click", nextHandler);
      cleanups.push(() => {
        prev?.removeEventListener("click", prevHandler);
        next?.removeEventListener("click", nextHandler);
      });
    });

    // ── Benefits carousel: progress bar + gentle auto-advance ──────────
    document.querySelectorAll<HTMLElement>("[data-invest-carousel]").forEach((carousel) => {
      const track = carousel.querySelector<HTMLElement>(".invest-benefit-track");
      const progress = carousel.querySelector<HTMLElement>("[data-invest-carousel-progress]");
      if (!track) return;
      let timer = 0;

      const updateProgress = () => {
        if (!progress) return;
        const max = track.scrollWidth - track.clientWidth;
        const ratio = max > 0 ? Math.min(1, Math.max(0, track.scrollLeft / max)) : 1;
        progress.style.width = `${Math.round((8 + ratio * 92) * 10) / 10}%`;
      };

      const advance = () => {
        const max = track.scrollWidth - track.clientWidth;
        if (max <= 0) return;
        if (track.scrollLeft >= max - 8) track.scrollTo({ left: 0, behavior: "smooth" });
        else track.scrollBy({ left: track.clientWidth * 0.6, behavior: "smooth" });
      };

      const start = () => {
        if (prefersReducedMotion) return;
        stop();
        timer = window.setInterval(advance, 4200);
      };
      const stop = () => {
        if (timer) window.clearInterval(timer);
        timer = 0;
      };

      const scrollHandler = () => updateProgress();
      const enterHandler = () => stop();
      const leaveHandler = () => start();
      track.addEventListener("scroll", scrollHandler, { passive: true });
      carousel.addEventListener("pointerenter", enterHandler);
      carousel.addEventListener("pointerleave", leaveHandler);
      cleanups.push(() => {
        track.removeEventListener("scroll", scrollHandler);
        carousel.removeEventListener("pointerenter", enterHandler);
        carousel.removeEventListener("pointerleave", leaveHandler);
        stop();
      });
      updateProgress();
      start();
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
