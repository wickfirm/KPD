"use client";

import { useEffect } from "react";

/// React does not execute scripts injected through dangerouslySetInnerHTML,
/// so the delivered shell's site.js — which powers the menu, motion reveals,
/// the media dropdown and the booking dialog — is re-attached here. Without
/// this the Legacy page renders but none of those interactions respond.
export function LegacyPageScripts() {
  useEffect(() => {
    const sources = ["/legacy/assets/js/site.js?v=20260715-backend-start-1"];
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
