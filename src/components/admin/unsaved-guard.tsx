"use client";

import { useEffect, useState } from "react";

/// Editors with several independently saved forms (a development page has one
/// per section) make it easy to edit something and navigate away without
/// saving. This tracks which forms inside the editor have been touched since
/// their last submit, shows what is unsaved, and asks before leaving the page.
export function UnsavedGuard({ scope = ".cms-editor" }: { scope?: string }) {
  const [dirty, setDirty] = useState<string[]>([]);

  useEffect(() => {
    const touched = new Map<HTMLFormElement, string>();
    const sync = () => setDirty([...new Set(touched.values())]);
    const labelFor = (form: HTMLFormElement) => form.closest("details")?.querySelector("h3")?.textContent?.trim() || form.closest("[data-unsaved-label]")?.getAttribute("data-unsaved-label") || "This page";
    const mark = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const form = target?.closest("form");
      if (!form || !form.closest(scope)) return;
      // Plain buttons inside a form (add / remove image or card) change the draft too.
      if (event.type === "click" && !(target instanceof HTMLButtonElement && target.type === "button")) return;
      touched.set(form, labelFor(form));
      sync();
    };
    const submitted = (event: Event) => { touched.delete(event.target as HTMLFormElement); sync(); };
    const beforeUnload = (event: BeforeUnloadEvent) => { if (touched.size) { event.preventDefault(); event.returnValue = ""; } };
    document.addEventListener("input", mark);
    document.addEventListener("change", mark);
    document.addEventListener("click", mark);
    document.addEventListener("submit", submitted, true);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      document.removeEventListener("input", mark);
      document.removeEventListener("change", mark);
      document.removeEventListener("click", mark);
      document.removeEventListener("submit", submitted, true);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [scope]);

  if (!dirty.length) return null;
  const wholePage = dirty.length === 1 && dirty[0] === "This page";
  return <div className="cms-unsaved" role="status" aria-live="polite"><strong>Unsaved changes</strong>{wholePage ? null : <span>{dirty.join(" · ")}</span>}<small>{wholePage ? "Save the page before leaving." : "Use that section’s Save button before leaving."}</small></div>;
}
