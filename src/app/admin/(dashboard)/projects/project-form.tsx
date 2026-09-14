"use client";

import { useActionState } from "react";
import { saveProject, type ProjectFormState } from "../actions";

export type ProjectDefaults = {
  id?: string; slug?: string; name?: string; tagline?: string | null; description?: string | null;
  profile?: string; status?: string; heroImage?: string | null; location?: string | null; sortOrder?: number;
};

const initialState: ProjectFormState = {};

export default function ProjectForm({ defaults }: { defaults?: ProjectDefaults }) {
  const [state, formAction, pending] = useActionState(saveProject, initialState);
  return <form action={formAction}>
    {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
    {state.error ? <p className="cms-error">{state.error}</p> : null}
    <label className="cms-field"><span>Development name</span><input name="name" defaultValue={defaults?.name} required /></label>
    <label className="cms-field"><span>Slug (leave blank to derive from name)</span><input name="slug" defaultValue={defaults?.slug} /></label>
    <label className="cms-field"><span>Tagline</span><input name="tagline" defaultValue={defaults?.tagline ?? ""} /></label>
    <label className="cms-field"><span>Short overview</span><textarea name="description" rows={5} defaultValue={defaults?.description ?? ""} /></label>
    <div className="cms-grid">
      <label className="cms-field"><span>Status</span><select name="status" defaultValue={defaults?.status ?? "DRAFT"}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label>
      <label className="cms-field"><span>Access profile</span><select name="profile" defaultValue={defaults?.profile ?? "FULL"}><option value="FULL">Public</option><option value="RESTRICTED">Restricted</option></select></label>
      <label className="cms-field"><span>Display order</span><input name="sortOrder" type="number" min="0" defaultValue={defaults?.sortOrder ?? 0} /></label>
    </div>
    <label className="cms-field"><span>Hero image URL</span><input name="heroImage" defaultValue={defaults?.heroImage ?? ""} placeholder="/legacy/assets/images/..." /></label>
    <label className="cms-field"><span>Location label</span><input name="location" defaultValue={defaults?.location ?? ""} /></label>
    <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save development"}</button>
  </form>;
}
