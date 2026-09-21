"use client";

import { useActionState, useState } from "react";
import { saveSiteSettings, type SiteSettingsFormState } from "../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";

export type Settings = { global?: { email?: string; phone?: string; whatsapp?: string; newsletterNote?: string }; home?: { heroVideo?: string; introHeading?: string; introParagraphs?: string[]; developmentHeading?: string; contactHeading?: string; contactText?: string; experienceImages?: string[] } };
const initialState: SiteSettingsFormState = {};

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(saveSiteSettings, initialState);
  const global = settings.global ?? {};
  const home = settings.home ?? {};
  const [experienceImages, setExperienceImages] = useState(home.experienceImages ?? []);
  return <form action={formAction}>{state.error ? <p className="cms-error">{state.error}</p> : null}
    <h1>Site settings</h1><p className="cms-muted">One source for shared site details and homepage content.</p>
    <h2 className="cms-form-heading">Contact and footer</h2><div className="cms-grid"><label className="cms-field"><span>Email</span><input type="email" name="email" defaultValue={global.email ?? ""} /></label><label className="cms-field"><span>Phone</span><input name="phone" defaultValue={global.phone ?? ""} /></label><label className="cms-field"><span>WhatsApp URL</span><input name="whatsapp" defaultValue={global.whatsapp ?? ""} placeholder="https://wa.me/..." /></label></div><label className="cms-field"><span>Newsletter note</span><textarea name="newsletterNote" rows={3} defaultValue={global.newsletterNote ?? ""} /></label>
    <h2 className="cms-form-heading">Homepage</h2><label className="cms-field"><span>Hero video</span><AssetUrlField name="heroVideo" defaultValue={home.heroVideo ?? ""} accept="video/mp4" placeholder="https://…" /></label><label className="cms-field"><span>Introduction heading</span><input name="introHeading" defaultValue={home.introHeading ?? ""} /></label><label className="cms-field"><span>Introduction paragraphs</span><textarea name="introParagraphs" rows={6} defaultValue={(home.introParagraphs ?? []).join("\n\n")} /><small>Separate paragraphs with a blank line.</small></label><label className="cms-field"><span>Developments heading</span><input name="developmentHeading" defaultValue={home.developmentHeading ?? ""} /></label><div className="cms-grid"><label className="cms-field"><span>Contact heading</span><input name="contactHeading" defaultValue={home.contactHeading ?? ""} /></label><label className="cms-field"><span>Contact copy</span><textarea name="contactText" rows={3} defaultValue={home.contactText ?? ""} /></label></div><section className="cms-editor-section"><h3>Experience Center gallery</h3><p className="cms-muted">The delivered design uses exactly five panels. Add or arrange all five images here to replace them.</p><input type="hidden" name="experienceImages" value={experienceImages.join("\n")} />{experienceImages.map((image,index)=><div className="cms-repeat-card" key={`${image}-${index}`}><div className="cms-repeat-card__head"><strong>Gallery image {index+1}</strong><button className="cms-text-button cms-text-button--danger" type="button" onClick={()=>setExperienceImages((images)=>images.filter((_,i)=>i!==index))}>Remove</button></div><AssetUrlField value={image} onChange={(next)=>setExperienceImages((images)=>images.map((value,i)=>i===index?next:value))} accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" placeholder="https://…" /></div>)}<button className="cms-btn cms-btn--ghost" type="button" onClick={()=>setExperienceImages((images)=>[...images,""])}>Add gallery image</button></section><button className="cms-btn" disabled={pending} type="submit">{pending ? "Saving…" : "Save settings"}</button>
  </form>;
}
