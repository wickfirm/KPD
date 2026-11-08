"use client";

import { useState } from "react";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "perspective", label: "Perspectives" },
  { key: "announcement", label: "Announcements" },
] as const;

/// Filter tabs for the /news listing: shows only the server-rendered articles
/// whose data-cat matches, and the empty note when none do.
export function NewsFilters() {
  const [active, setActive] = useState<string>("all");
  function choose(key: string) {
    setActive(key);
    let shown = 0;
    document.querySelectorAll<HTMLElement>(".g21-news-sec [data-cat]").forEach((element) => {
      const visible = key === "all" || element.dataset.cat === key;
      element.hidden = !visible;
      if (visible) shown += 1;
    });
    const empty = document.querySelector<HTMLElement>("[data-news-empty]");
    if (empty) empty.hidden = shown > 0;
  }
  return (
    <div className="g21-filters" role="group" aria-label="Filter articles">
      {FILTERS.map((filter) => <button key={filter.key} type="button" aria-pressed={active === filter.key} onClick={() => choose(filter.key)}>{filter.label}</button>)}
    </div>
  );
}
