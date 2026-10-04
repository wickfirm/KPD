"use client";

import { useActionState, useState } from "react";
import { saveHomeSettings, type SiteSettingsFormState } from "../../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";
import type { HomeSettings } from "@/lib/home-defaults";

export type { HomeSettings };
const initialState: SiteSettingsFormState = {};

/// Homepage editor: the content that was previously buried under Site
/// Settings now has its own page under Pages → Homepage.
export default function HomeForm({ settings }: { settings: HomeSettings }) {
  const [state, formAction, pending] = useActionState(saveHomeSettings, initialState);
  const [experienceImages, setExperienceImages] = useState(settings.experienceImages ?? []);
  return <form action={formAction}>{state.error ? <p className="cms-error">{state.error}</p> : null}
    <h2 className="cms-form-heading">Hero video</h2>
    <AssetUrlField name="heroVideo" defaultValue={settings.heroVideo ?? ""} accept="video/mp4" placeholder="https://…" fileLabel="hero video" />
    <h2 className="cms-form-heading">Introduction</h2>
    <label className="cms-field"><span>Introduction heading</span><input name="introHeading" defaultValue={settings.introHeading ?? ""} /></label>
    <label className="cms-field"><span>Introduction paragraphs</span><textarea name="introParagraphs" rows={6} defaultValue={(settings.introParagraphs ?? []).join("\n\n")} /><small>Separate paragraphs with a blank line.</small></label>
    <h2 className="cms-form-heading">Developments section</h2>
    <label className="cms-field"><span>Developments heading</span><input name="developmentHeading" defaultValue={settings.developmentHeading ?? ""} /></label>
    <h2 className="cms-form-heading">Contact strip</h2>
    <div className="cms-grid">
      <label className="cms-field"><span>Contact heading</span><input name="contactHeading" defaultValue={settings.contactHeading ?? ""} /></label>
      <label className="cms-field"><span>Contact copy</span><textarea name="contactText" rows={3} defaultValue={settings.contactText ?? ""} /></label>
    </div>
    <section className="cms-editor-section">
      <h3>Experience Center gallery</h3>
      <p className="cms-muted">The delivered design uses exactly five panels. Add or arrange all five images here to replace them.</p>
      <input type="hidden" name="experienceImages" value={experienceImages.join("\n")} />
      {experienceImages.map((image, index) => <div className="cms-repeat-card" key={`${image}-${index}`}>
        <div className="cms-repeat-card__head"><strong>Gallery image {index + 1}</strong><button className="cms-text-button cms-text-button--danger" type="button" onClick={() => setExperienceImages((images) => images.filter((_, i) => i !== index))}>Remove</button></div>
        <AssetUrlField value={image} onChange={(next) => setExperienceImages((images) => images.map((value, i) => (i === index ? next : value)))} accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" placeholder="https://…" fileLabel={`gallery image ${index + 1}`} />
      </div>)}
      <button className="cms-btn cms-btn--ghost" type="button" onClick={() => setExperienceImages((images) => [...images, ""])} disabled={experienceImages.length >= 5}>Add gallery image</button>
    </section>
    <div className="cms-actions"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save homepage"}</button></div>
  </form>;
}
