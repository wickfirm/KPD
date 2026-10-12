"use client";

import { useState } from "react";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/lib/seo";

/// What the "Search appearance" box starts with: the editor's saved text (if
/// any) and the automatic text shown as the placeholder.
export type SeoFieldDefaults = {
  title?: string;
  description?: string;
  autoTitle?: string;
  autoDescription?: string;
};

function Counter({ length, max }: { length: number; max: number }) {
  const over = length > max;
  return <small className={over ? "cms-seo-count cms-seo-count--over" : "cms-seo-count"}>{length} / {max}{over ? " · search engines will cut this off" : ""}</small>;
}

/// Optional search title and description for a page, development or article.
/// Blank boxes keep the automatic text; posted as seoTitle / seoDescription.
export function SeoFields({ defaults }: { defaults?: SeoFieldDefaults }) {
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [description, setDescription] = useState(defaults?.description ?? "");
  const shownTitle = title.trim() || defaults?.autoTitle || "";
  const shownDescription = description.trim() || defaults?.autoDescription || "";
  return <details className="cms-advanced-input cms-seo" open={Boolean(defaults?.title || defaults?.description)}>
    <summary>Search appearance (SEO)</summary>
    <p className="cms-muted">How this page appears in Google and when it is shared. Leave a box empty to use the automatic text shown in grey.</p>
    <label className="cms-field">
      <span>Search title</span>
      <input name="seoTitle" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={defaults?.autoTitle || "Built from the title"} />
      <Counter length={shownTitle.length} max={TITLE_MAX} />
    </label>
    <label className="cms-field">
      <span>Search description</span>
      <textarea name="seoDescription" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={defaults?.autoDescription || "Built from the summary"} />
      <Counter length={shownDescription.length} max={DESCRIPTION_MAX} />
    </label>
    {shownTitle || shownDescription ? <div className="cms-seo-preview" aria-label="Search result preview">
      <span className="cms-seo-preview__title">{shownTitle}</span>
      <span className="cms-seo-preview__text">{shownDescription}</span>
    </div> : null}
  </details>;
}
