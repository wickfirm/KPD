"use client";

import { useEffect, useState } from "react";

/// Sticky "Milestone" rail beside the History timeline: shows the year of the
/// milestone in view and a progress bar, and marks the matching year in the
/// sticky year bar. Reads the list items rendered by LegacyMain.
export function LegacyTimelineRail({ firstYear }: { firstYear: string }) {
  const [year, setYear] = useState(firstYear);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".g21-ms-list > li"));
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".g21-subnav-in a"));
    if (!items.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      let active = 0;
      items.forEach((item, index) => { if (item.getBoundingClientRect().top < window.innerHeight * 0.45) active = index; });
      const current = items[active].dataset.year ?? "";
      setYear(current);
      setProgress((active + 1) / items.length);
      links.forEach((link) => link.classList.toggle("is-on", link.textContent?.trim() === current));
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="g21-tl-rail" aria-hidden="true">
      <span className="g21-cap">Milestone</span>
      <b>{year}</b>
      <i><em style={{ transform: `scaleX(${progress})` }} /></i>
    </div>
  );
}
