"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/// Executes the delivered interaction layer (site-cms.js) and any page
/// extras (live news feed, ownership planner) for the current view. Every
/// soft navigation replaces the page tree, so the scripts re-execute against
/// fresh DOM — the same clean-binding model as a full page load, without the
/// reload. Body-level widgets (modals, floating contact) persist across
/// navigations and are found again by each execution.
export function DeliveredScripts({ sources = [] }: { sources?: string[] }) {
  const pathname = usePathname();
  const extraKey = sources.join("|");
  useEffect(() => {
    // A soft-navigated view must not inherit stale body state.
    document.body.classList.remove("menu-open", "modal-open");
    const scripts = ["/legacy/assets/js/site-cms.js?v=20260715-backend-start-1", ...sources].map((src) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      document.body.appendChild(script);
      return script;
    });
    return () => scripts.forEach((script) => script.remove());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, extraKey]);
  return null;
}
