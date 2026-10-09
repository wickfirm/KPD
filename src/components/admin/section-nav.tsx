"use client";

import { useEffect, useState } from "react";

export type SectionNavItem = { id: string; label: string; hint?: string };

/// Sticky "on this page" list for long editors: click to jump to a section
/// (opening it if it is collapsed) and follow the scroll position.
export function SectionNav({ items, title = "On this page" }: { items: SectionNavItem[]; title?: string }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const targets = items.map((item) => document.getElementById(item.id)).filter((element): element is HTMLElement => Boolean(element));
    if (!targets.length || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-80px 0px -60% 0px" });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [items]);

  function jump(id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    if (target instanceof HTMLDetailsElement) target.open = true;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }

  return <nav className="cms-section-nav" aria-label={title}>
    <span className="cms-eyebrow">{title}</span>
    <ol>
      {items.map((item) => <li key={item.id}>
        <button type="button" className={active === item.id ? "is-active" : undefined} onClick={() => jump(item.id)} aria-current={active === item.id ? "true" : undefined}>
          <span>{item.label}</span>{item.hint ? <small>{item.hint}</small> : null}
        </button>
      </li>)}
    </ol>
  </nav>;
}
