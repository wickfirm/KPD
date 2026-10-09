"use client";

import { useEffect, useState } from "react";
import { SectionNav, type SectionNavItem } from "./section-nav";

/// "On this page" list built from the editor's own headings (the labelled
/// rules and editor sections every long form already uses), so a form gets
/// section navigation without listing its sections by hand. Hidden when a form
/// has fewer than three sections: there is nothing to navigate.
export function AutoSectionNav({ scope = ".cms-editor-layout__main", title = "On this page" }: { scope?: string; title?: string }) {
  const [items, setItems] = useState<SectionNavItem[]>([]);

  useEffect(() => {
    const root = document.querySelector(scope);
    if (!root) return;
    const headings = Array.from(root.querySelectorAll<HTMLElement>("h2.cms-form-heading, .cms-card--settings .cms-card-intro h2, .cms-editor-section > h2, .cms-editor-section > h3, .cms-section-heading h2"));
    const found: SectionNavItem[] = [];
    headings.forEach((heading, index) => {
      const label = heading.textContent?.trim();
      if (!label || heading.closest(".cms-repeat-card, .cms-list-editor, .cms-module-disclosure")) return;
      if (!heading.id) heading.id = `auto-section-${index}`;
      heading.style.scrollMarginTop = "24px";
      found.push({ id: heading.id, label });
    });
    setItems(found);
  }, [scope]);

  if (items.length < 3) return null;
  return <SectionNav items={items} title={title} />;
}
