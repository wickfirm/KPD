"use client";

import { useState } from "react";

/// Amenity panels for the gallery-light development page: the chosen panel
/// widens and shows its caption. On phones the panels become a swipe row.
export function DevelopmentAccordion({ panels }: { panels: { image: string; label: string }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="g21-acc">
      {panels.map((panel, index) => {
        const on = index === active;
        return <button key={`${panel.image}-${index}`} className={`g21-panel${on ? " is-on" : ""}`} type="button" aria-pressed={on} aria-label={panel.label} onClick={() => setActive(index)}>
          <img src={panel.image} alt="" loading="lazy" />
          <span className="g21-panel-n">{String(index + 1).padStart(2, "0")} / {String(panels.length).padStart(2, "0")}</span>
          <span className="g21-panel-lab">{panel.label}</span>
        </button>;
      })}
    </div>
  );
}
