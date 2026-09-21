"use client";

import { useEffect } from "react";

/// React deliberately does not execute scripts found inside HTML injected with
/// `dangerouslySetInnerHTML`. Re-add the delivered interaction scripts so the
/// menu, development carousel, gallery lightbox, and inquiry dialog retain
/// their client-approved behavior.
export function LegacyHomeScripts() {
  useEffect(() => {
    const sources = [
      "/legacy/assets/js/live-news.js?v=20260710-v1-image-style-2",
      "/legacy/assets/js/site.js?v=20260715-backend-start-1",
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
