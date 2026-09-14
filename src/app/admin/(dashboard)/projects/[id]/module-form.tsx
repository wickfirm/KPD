"use client";

import { useActionState } from "react";
import { saveProjectModule, type ProjectModuleFormState } from "../../actions";

type Defaults = { id?: string; title?: string; slug?: string; kind?: string; profile?: string; sortOrder?: number; content?: string };
const initialState: ProjectModuleFormState = {};
const starter = '{\n  "text": "",\n  "images": [],\n  "items": [],\n  "url": ""\n}';

export default function ModuleForm({ projectId, defaults }: { projectId: string; defaults?: Defaults }) {
  const [state, formAction, pending] = useActionState(saveProjectModule, initialState);
  return <form action={formAction} style={{ marginTop: 16 }}>
    <input type="hidden" name="projectId" value={projectId} />{defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
    {state.error ? <p className="cms-error">{state.error}</p> : null}
    <div className="cms-grid">
      <label className="cms-field"><span>Module title</span><input name="title" required defaultValue={defaults?.title} /></label>
      <label className="cms-field"><span>Slug</span><input name="slug" defaultValue={defaults?.slug} /></label>
      <label className="cms-field"><span>Type</span><select name="kind" defaultValue={defaults?.kind ?? "CUSTOM"}><option value="CUSTOM">Text / custom</option><option value="GALLERY">Gallery</option><option value="FLOOR_PLAN">Floor plans</option><option value="SPECIFICATIONS">Specifications</option><option value="LOCATION">Location</option><option value="VIDEO">Video</option><option value="BROCHURE">Brochure</option></select></label>
      <label className="cms-field"><span>Profile</span><select name="profile" defaultValue={defaults?.profile ?? "FULL"}><option value="FULL">Public</option><option value="RESTRICTED">Restricted</option></select></label>
      <label className="cms-field"><span>Display order</span><input name="sortOrder" type="number" min="0" defaultValue={defaults?.sortOrder ?? 0} /></label>
    </div>
    <label className="cms-field"><span>Module data (JSON)</span><textarea name="content" rows={10} defaultValue={defaults?.content ?? starter} /><small>Use <code>text</code>, <code>images</code>, <code>items</code> (label/value pairs), and/or <code>url</code> as relevant to the module type.</small></label>
    <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : defaults?.id ? "Save module" : "Add module"}</button>
  </form>;
}
