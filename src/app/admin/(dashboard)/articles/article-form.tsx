"use client";

import { useActionState, useRef, useState } from "react";
import { previewArticleDraft, saveArticle, type ArticleFormState } from "../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";

export type ArticleDefaults = {
  id?: string;
  kind?: string;
  slug?: string;
  title?: string;
  summary?: string;
  body?: string; // JSON array of paragraphs
  coverImage?: string | null;
  coverImageAlt?: string | null;
  status?: string;
};

const initialState: ArticleFormState = {};

/// Editors write plain paragraphs; the database stores a JSON array. Convert
/// the stored array into blank-line-separated text so the editor never sees
/// JSON notation strings.
function bodyToText(raw?: string) {
  if (!raw) return "";
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).join("\n\n");
  } catch {
    // Already plain text.
  }
  return raw;
}

export default function ArticleForm({ defaults }: { defaults?: ArticleDefaults }) {
  const [state, formAction, pending] = useActionState(saveArticle, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  /// Opens the admin preview with the article exactly as it currently looks
  /// here, saved or not. The tab opens straight away (a click-triggered open is
  /// never blocked) and is pointed at the preview once the draft is stored.
  async function previewUnsaved() {
    if (!formRef.current) return;
    setPreviewing(true); setPreviewError("");
    const tab = window.open("about:blank", "_blank");
    try {
      const result = await previewArticleDraft(new FormData(formRef.current));
      if (result.error || !result.id) throw new Error(result.error || "Unable to build the preview.");
      const target = `/admin/preview/articles/${result.id}?draft=1`;
      if (tab) tab.location.href = target; else window.location.assign(target);
    } catch (error) {
      tab?.close();
      setPreviewError(error instanceof Error ? error.message : "Unable to build the preview.");
    } finally { setPreviewing(false); }
  }

  return (
    <form ref={formRef} action={formAction}>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      {state.error ? <p className="cms-error">{state.error}</p> : null}

      <label className="cms-field">
        <span>Title</span>
        <input name="title" defaultValue={defaults?.title} required />
      </label>

      <label className="cms-field">
        <span>Slug (leave blank to derive from title)</span>
        <input name="slug" defaultValue={defaults?.slug} />
      </label>

      <label className="cms-field">
        <span>Kind</span>
        <select name="kind" defaultValue={defaults?.kind ?? "NEWS"}>
          <option value="NEWS">News</option>
          <option value="BLOG">Blog</option>
        </select>
      </label>

      <label className="cms-field">
        <span>Status</span>
        <select name="status" defaultValue={defaults?.status ?? "DRAFT"}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </label>

      <label className="cms-field">
        <span>Summary</span>
        <textarea name="summary" rows={3} defaultValue={defaults?.summary} required />
      </label>

      <section className="cms-editor-section"><h3>Cover image</h3><p className="cms-muted">Upload the lead image used on article cards and the article page.</p><AssetUrlField name="coverImage" defaultValue={defaults?.coverImage ?? ""} accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" placeholder="https://…" /></section>

      <label className="cms-field">
        <span>Cover image alt text</span>
        <input name="coverImageAlt" defaultValue={defaults?.coverImageAlt ?? ""} />
      </label>

      <label className="cms-field">
        <span>
          Body — paragraphs separated by blank lines (or a JSON array of strings)
        </span>
        <textarea
          name="body"
          rows={12}
          defaultValue={bodyToText(defaults?.body)}
          placeholder="Write the first paragraph, then leave a blank line before the next."
        />
      </label>

      <div className="cms-actions">
        <button className="cms-btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save article"}
        </button>
        <button className="cms-btn cms-btn--outline" type="button" onClick={previewUnsaved} disabled={previewing}>{previewing ? "Opening preview…" : "Preview with unsaved changes ↗"}</button>
        {previewError ? <span className="cms-error">{previewError}</span> : null}
      </div>
    </form>
  );
}
