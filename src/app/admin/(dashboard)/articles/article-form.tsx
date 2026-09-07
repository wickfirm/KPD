"use client";

import { useActionState } from "react";
import { saveArticle, type ArticleFormState } from "../actions";

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

export default function ArticleForm({ defaults }: { defaults?: ArticleDefaults }) {
  const [state, formAction, pending] = useActionState(saveArticle, initialState);

  return (
    <form action={formAction}>
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

      <label className="cms-field">
        <span>Cover image URL</span>
        <input name="coverImage" defaultValue={defaults?.coverImage ?? ""} />
      </label>

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
          defaultValue={
            defaults?.body ??
            JSON.stringify([""], null, 0)
          }
        />
      </label>

      <div className="cms-actions">
        <button className="cms-btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save article"}
        </button>
      </div>
    </form>
  );
}
