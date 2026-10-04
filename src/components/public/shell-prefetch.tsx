"use client";

import { useEffect } from "react";

/// The delivered shell navigates with plain <a> tags — full page loads, by
/// design (site.js binds directly to DOM elements, so a clean document per
/// page is the safe execution model). This component makes those loads feel
/// instant: internal pages are prefetched into the browser cache on idle and
/// the moment a nav link is hovered. No DOM changes, no behavioural change.
export function ShellPrefetch() {
  useEffect(() => {
    const prefetched = new Set<string>();

    function prefetch(href: string | null | undefined) {
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (prefetched.has(url.pathname)) return;
        prefetched.add(url.pathname);
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = url.pathname + url.search;
        document.head.appendChild(link);
      } catch {
        // malformed href — ignore
      }
    }

    function onHover(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]");
      prefetch(anchor?.getAttribute("href"));
    }

    // Warm the core sections once the visitor is idle.
    const idle = window.setTimeout(() => {
      for (const path of ["/", "/about", "/legacy", "/news", "/contact", "/invest-in-dubai"]) prefetch(path);
    }, 2500);

    document.addEventListener("pointerover", onHover, { passive: true });
    return () => {
      window.clearTimeout(idle);
      document.removeEventListener("pointerover", onHover);
    };
  }, []);

  return null;
}
