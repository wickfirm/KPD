"use client";

import { useEffect } from "react";

/// React does not execute scripts injected through dangerouslySetInnerHTML.
/// site.js powers the menu, directional media, development sliders, gallery
/// lightbox and the booking dialog; the planner script renders the ownership
/// cost calculator inside the delivered planner mount point.
export function DevelopmentPageScripts() {
  useEffect(() => {
    const sources = [
      "/legacy/assets/js/site.js?v=20260715-backend-start-1",
      "/legacy/assets/js/ownership-cost-planner.js?v=20260929",
    ];
    const scripts = sources.map((src) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      document.body.appendChild(script);
      return script;
    });
    return () => scripts.forEach((script) => script.remove());
  }, []);

  return null;
}
