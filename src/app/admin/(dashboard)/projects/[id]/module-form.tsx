"use client";

import { useActionState, useState } from "react";
import { saveProjectModule, type ProjectModuleFormState } from "../../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";
import { moduleKindLabels } from "@/lib/project-starter";

type ModuleItem = { label?: string; value?: string; image?: string; url?: string };
type ModuleContent = { text?: string; images?: string[]; items?: ModuleItem[]; url?: string; mapUrl?: string; presentation?: string };
type Defaults = { id?: string; title?: string; slug?: string; kind?: string; profile?: string; sortOrder?: number; content?: ModuleContent };
const initialState: ProjectModuleFormState = {};

export default function ModuleForm({ projectId, defaults }: { projectId: string; defaults?: Defaults }) {
  const [state, formAction, pending] = useActionState(saveProjectModule, initialState);
  const [kind, setKind] = useState(defaults?.kind ?? "CUSTOM");
  const [images, setImages] = useState(defaults?.content?.images ?? []);
  const [items, setItems] = useState<ModuleItem[]>(defaults?.content?.items ?? []);
  const itemLabel = kind === "LOCATION" ? "Location / journey" : kind === "FLOOR_PLAN" ? "Floor-plan card" : kind === "GALLERY" ? "Gallery caption" : kind === "SPECIFICATIONS" ? "Specification" : "Content card";
  function updateItem(index: number, patch: Partial<ModuleItem>) { setItems((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item)); }
  return <form action={formAction} style={{ marginTop: 16 }}>
    <input type="hidden" name="projectId" value={projectId} />{defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
    {state.error ? <p className="cms-error">{state.error}</p> : null}
    <div className="cms-grid">
      <label className="cms-field"><span>Section title</span><input name="title" required defaultValue={defaults?.title} /></label>
      <label className="cms-field"><span>Section type</span><select name="kind" value={kind} onChange={(event) => setKind(event.target.value)}>{Object.entries(moduleKindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    <input type="hidden" name="sortOrder" value={defaults?.sortOrder ?? 0} />
    <details className="cms-advanced-input">
      <summary>Advanced options</summary>
      <div className="cms-grid">
        <label className="cms-field"><span>Section address</span><input name="slug" defaultValue={defaults?.slug} placeholder="derived from the title" /><small>Used for the section's link on the page.</small></label>
        <label className="cms-field"><span>Visibility</span><select name="profile" defaultValue={defaults?.profile ?? "FULL"}><option value="FULL">Public site</option><option value="RESTRICTED">Restricted (not shown publicly)</option></select></label>
      </div>
    </details>
    <label className="cms-field"><span>Text</span><textarea name="text" rows={5} defaultValue={defaults?.content?.text ?? ""} placeholder="The editorial copy shown in this section." /></label>
    <input type="hidden" name="images" value={images.join("\n")} />
    <input type="hidden" name="items" value={items.map((item) => [item.label ?? "", item.value ?? "", item.image ?? "", item.url ?? ""].join(" | ")).join("\n")} />
    <section className="cms-editor-section" aria-labelledby={`media-${defaults?.id ?? "new"}`}><div><h3 id={`media-${defaults?.id ?? "new"}`}>Media</h3><p className="cms-muted">Upload images directly. Existing images stay until you replace or remove them.</p></div>
      {images.map((image, index) => <div className="cms-repeat-card" key={`${image}-${index}`}><div className="cms-repeat-card__head"><strong>Image {index + 1}</strong><button className="cms-text-button cms-text-button--danger" type="button" onClick={() => setImages((current) => current.filter((_, i) => i !== index))}>Remove</button></div><AssetUrlField value={image} onChange={(next) => setImages((current) => current.map((value, i) => i === index ? next : value))} placeholder="Upload an image" /></div>)}
      <button className="cms-btn cms-btn--ghost" type="button" onClick={() => setImages((current) => [...current, ""])}>Add image</button>
    </section>
    <section className="cms-editor-section" aria-labelledby={`items-${defaults?.id ?? "new"}`}><div><h3 id={`items-${defaults?.id ?? "new"}`}>{itemLabel}s</h3><p className="cms-muted">Add cards one at a time—no formatting codes or pipe-separated rows required.</p></div>
      {items.map((item, index) => <div className="cms-repeat-card" key={index}><div className="cms-repeat-card__head"><strong>{itemLabel} {index + 1}</strong><button className="cms-text-button cms-text-button--danger" type="button" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>Remove</button></div><div className="cms-grid"><label className="cms-field"><span>Label</span><input value={item.label ?? ""} onChange={(event) => updateItem(index, { label: event.target.value })} placeholder="e.g. Downtown Dubai" /></label><label className="cms-field"><span>Detail</span><input value={item.value ?? ""} onChange={(event) => updateItem(index, { value: event.target.value })} placeholder="e.g. 12 min" /></label></div>{kind !== "GALLERY" ? <label className="cms-field"><span>Card image, plan, or document</span><AssetUrlField value={item.image ?? ""} onChange={(next) => updateItem(index, { image: next })} accept="image/*,application/pdf" placeholder="Upload a file" /></label> : null}<label className="cms-field"><span>Optional link</span><input value={item.url ?? ""} onChange={(event) => updateItem(index, { url: event.target.value })} placeholder="https://…" /></label></div>)}
      <button className="cms-btn cms-btn--ghost" type="button" onClick={() => setItems((current) => [...current, {}])}>Add {itemLabel.toLowerCase()}</button>
    </section>
    <div className="cms-grid">
      <label className="cms-field"><span>Button link (optional)</span><input name="url" defaultValue={defaults?.content?.url ?? ""} placeholder="/contact?project=..." /><small>Where the section's button goes, if it has one.</small></label>
      <label className="cms-field"><span>Layout</span><select name="presentation" defaultValue={defaults?.content?.presentation ?? "standard"}><option value="standard">Standard</option><option value="calm">Split panel (text beside a large image)</option></select></label>
      {kind === "LOCATION" ? <label className="cms-field"><span>Map embed link</span><input name="mapUrl" defaultValue={defaults?.content?.mapUrl ?? ""} placeholder="https://www.google.com/maps/embed?..." /><small>Used on developments created in the CMS. The three original developments keep their built-in travel map.</small></label> : <input type="hidden" name="mapUrl" defaultValue={defaults?.content?.mapUrl ?? ""} />}
    </div>
    <div className="cms-save-row"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : defaults?.id ? "Save section" : "Add section"}</button></div>
  </form>;
}
