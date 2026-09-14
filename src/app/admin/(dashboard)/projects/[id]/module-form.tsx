"use client";

import { useActionState } from "react";
import { saveProjectModule, type ProjectModuleFormState } from "../../actions";

type ModuleItem = { label?: string; value?: string; image?: string; url?: string };
type ModuleContent = { text?: string; images?: string[]; items?: ModuleItem[]; url?: string; mapUrl?: string; presentation?: string };
type Defaults = { id?: string; title?: string; slug?: string; kind?: string; profile?: string; sortOrder?: number; content?: ModuleContent };
const initialState: ProjectModuleFormState = {};

function itemRows(items: ModuleItem[] | undefined) {
  return (items ?? []).map((item) => [item.label ?? "", item.value ?? "", item.image ?? "", item.url ?? ""].join(" | ")).join("\n");
}

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
    <label className="cms-field"><span>Section copy</span><textarea name="text" rows={5} defaultValue={defaults?.content?.text ?? ""} placeholder="The editorial copy shown in this section." /></label>
    <label className="cms-field"><span>Images</span><textarea name="images" rows={4} defaultValue={(defaults?.content?.images ?? []).join("\n")} placeholder="One image URL per line" /><small>Use existing asset paths or a hosted image URL. The first image is used where the supplied template needs a feature image.</small></label>
    <label className="cms-field"><span>Section items</span><textarea name="items" rows={5} defaultValue={itemRows(defaults?.content?.items)} placeholder="Label | Value | Image URL | Link&#10;Example: Downtown Dubai | 12 min.&#10;Floor-plan example: Type A |  | /plans/type-a.svg | /brochures/type-a.pdf" /><small>Use one row per stat, gallery caption, floor plan, or specification. Only fields relevant to the selected module type are displayed publicly.</small></label>
    <div className="cms-grid">
      <label className="cms-field"><span>Call-to-action link</span><input name="url" defaultValue={defaults?.content?.url ?? ""} placeholder="/contact?project=..." /></label>
      <label className="cms-field"><span>Map embed URL (location only)</span><input name="mapUrl" defaultValue={defaults?.content?.mapUrl ?? ""} placeholder="https://www.google.com/maps/embed?..." /></label>
      <label className="cms-field"><span>Editorial layout</span><select name="presentation" defaultValue={defaults?.content?.presentation ?? "standard"}><option value="standard">Standard section</option><option value="calm">Split editorial panel</option></select></label>
    </div>
    <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : defaults?.id ? "Save module" : "Add module"}</button>
  </form>;
}
