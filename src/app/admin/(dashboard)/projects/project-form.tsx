"use client";

import { useActionState } from "react";
import { saveProject, type ProjectFormState } from "../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";

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
    <div className="cms-grid">
      <label className="cms-field"><span>Development name</span><input name="name" defaultValue={defaults?.name} required /></label>
      <label className="cms-field"><span>Status</span><select name="status" defaultValue={defaults?.status ?? "DRAFT"}><option value="DRAFT">Draft — not public</option><option value="PUBLISHED">Published — live on the site</option><option value="ARCHIVED">Archived — removed from the site</option></select><small>Publishing, drafting and archiving take effect immediately.</small></label>
    </div>
    <label className="cms-field"><span>Headline</span><input name="tagline" defaultValue={defaults?.tagline ?? ""} placeholder="A short line under the name" /><small>Shown as the main heading of the introduction.</small></label>
    <label className="cms-field"><span>Introduction</span><textarea name="description" rows={5} defaultValue={defaults?.description ?? ""} /></label>
    <div className="cms-field"><span>Hero image</span><AssetUrlField name="heroImage" defaultValue={defaults?.heroImage ?? ""} placeholder="/legacy/assets/images/..." /></div>
    {!defaults?.id ? <label className="cms-check"><input type="checkbox" name="starter" defaultChecked /> <span><strong>Start with the standard sections</strong><small>Adds overview, location, tour, amenities, floor plans and payment plan, ready to fill in.</small></span></label> : null}
    <details className="cms-advanced-input">
      <summary>Advanced options</summary>
      <div className="cms-grid">
        <label className="cms-field"><span>Page address</span><input name="slug" defaultValue={defaults?.slug} placeholder="derived from the name" /><small>Appears as /developments/<em>address</em>. Changing it changes the public link.</small></label>
        <label className="cms-field"><span>Location label</span><input name="location" defaultValue={defaults?.location ?? ""} placeholder="e.g. Dubai Hills Estate" /><small>Small label above the name in listings.</small></label>
        <label className="cms-field"><span>Visibility</span><select name="profile" defaultValue={defaults?.profile ?? "FULL"}><option value="FULL">Public site</option><option value="RESTRICTED">Restricted (not shown publicly)</option></select></label>
        <label className="cms-field"><span>Position in listings</span><input name="sortOrder" type="number" min="0" defaultValue={defaults?.sortOrder ?? 0} /><small>Easier: use Move earlier / Move later on the Developments list.</small></label>
      </div>
    </details>
    <div className="cms-save-row"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save development"}</button></div>
  </form>;
}
