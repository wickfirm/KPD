"use client";

import { useEffect } from "react";

/// React does not execute scripts in injected legacy markup, so attach the
/// standalone planner once after the page has hydrated.
export function OwnershipCostPlannerScripts() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/legacy/assets/js/ownership-cost-planner.js?v=20260929";
    script.async = false;
    document.body.appendChild(script);
    return () => script.remove();
  }, []);
  return null;
}
