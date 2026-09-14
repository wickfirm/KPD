"use client";

import { useActionState } from "react";
import { saveStaticPage, type StaticPageFormState } from "../actions";

type Block = { type?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaUrl?: string };
export type StaticPageDefaults = { id?: string; slug?: string; title?: string; status?: string; content?: Block[] };
const initialState: StaticPageFormState = {};

function firstBlock(blocks: Block[] | undefined, type: string) {
  return (blocks ?? []).find((block) => block.type === type);
}

export default function StaticPageForm({ defaults }: { defaults?: StaticPageDefaults }) {
  const [state, formAction, pending] = useActionState(saveStaticPage, initialState);
  const hero = firstBlock(defaults?.content, "hero");
  const paragraphs = (defaults?.content ?? []).filter((block) => block.type === "paragraph").map((block) => block.text).filter(Boolean).join("\n\n");

  return <form action={formAction}>
    {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
    {state.error ? <p className="cms-error">{state.error}</p> : null}
    <div className="cms-grid">
      <label className="cms-field"><span>Page title</span><input name="title" defaultValue={defaults?.title} required /></label>
      <label className="cms-field"><span>URL slug</span><input name="slug" defaultValue={defaults?.slug} placeholder="privacy-policy" /></label>
      <label className="cms-field"><span>Status</span><select name="status" defaultValue={defaults?.status ?? "DRAFT"}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label>
    </div>
    <h2 className="cms-form-heading">Page introduction</h2>
    <label className="cms-field"><span>Heading</span><input name="heading" defaultValue={hero?.heading ?? ""} /></label>
    <label className="cms-field"><span>Intro copy</span><textarea name="intro" rows={4} defaultValue={hero?.text ?? ""} /></label>
    <div className="cms-grid">
      <label className="cms-field"><span>Feature image URL</span><input name="image" defaultValue={hero?.image ?? ""} placeholder="/legacy/assets/images/..." /></label>
      <label className="cms-field"><span>CTA label</span><input name="ctaLabel" defaultValue={hero?.ctaLabel ?? ""} /></label>
      <label className="cms-field"><span>CTA link</span><input name="ctaUrl" defaultValue={hero?.ctaUrl ?? ""} /></label>
    </div>
    <label className="cms-field"><span>Page body</span><textarea name="paragraphs" rows={12} defaultValue={paragraphs} placeholder="Write one paragraph, then leave a blank line before the next." /><small>Paragraphs will be rendered in the order shown by the page template.</small></label>
    <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save page"}</button>
  </form>;
}
