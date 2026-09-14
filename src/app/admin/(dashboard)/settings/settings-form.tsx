"use client";

import { useActionState } from "react";
import { saveSiteSettings, type SiteSettingsFormState } from "../actions";

export type Settings = { global?: { email?: string; phone?: string; whatsapp?: string; newsletterNote?: string }; home?: { heroVideo?: string; introHeading?: string; introParagraphs?: string[]; developmentHeading?: string; contactHeading?: string; contactText?: string; experienceImages?: string[] } };
const initialState: SiteSettingsFormState = {};

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(saveSiteSettings, initialState);
  const global = settings.global ?? {};
  const home = settings.home ?? {};
  return <form action={formAction}>{state.error ? <p className="cms-error">{state.error}</p> : null}
    <h1>Site settings</h1><p className="cms-muted">One source for shared site details and homepage content.</p>
    <h2 className="cms-form-heading">Contact and footer</h2><div className="cms-grid"><label className="cms-field"><span>Email</span><input type="email" name="email" defaultValue={global.email ?? ""} /></label><label className="cms-field"><span>Phone</span><input name="phone" defaultValue={global.phone ?? ""} /></label><label className="cms-field"><span>WhatsApp URL</span><input name="whatsapp" defaultValue={global.whatsapp ?? ""} placeholder="https://wa.me/..." /></label></div><label className="cms-field"><span>Newsletter note</span><textarea name="newsletterNote" rows={3} defaultValue={global.newsletterNote ?? ""} /></label>
    <h2 className="cms-form-heading">Homepage</h2><label className="cms-field"><span>Hero video URL</span><input name="heroVideo" defaultValue={home.heroVideo ?? ""} placeholder="/legacy/assets/images/...mp4" /></label><label className="cms-field"><span>Introduction heading</span><input name="introHeading" defaultValue={home.introHeading ?? ""} /></label><label className="cms-field"><span>Introduction paragraphs</span><textarea name="introParagraphs" rows={6} defaultValue={(home.introParagraphs ?? []).join("\n\n")} /><small>Separate paragraphs with a blank line.</small></label><label className="cms-field"><span>Developments heading</span><input name="developmentHeading" defaultValue={home.developmentHeading ?? ""} /></label><div className="cms-grid"><label className="cms-field"><span>Contact heading</span><input name="contactHeading" defaultValue={home.contactHeading ?? ""} /></label><label className="cms-field"><span>Contact copy</span><textarea name="contactText" rows={3} defaultValue={home.contactText ?? ""} /></label></div><label className="cms-field"><span>Experience Center images</span><textarea name="experienceImages" rows={5} defaultValue={(home.experienceImages ?? []).join("\n")} placeholder="One image URL per line" /></label><button className="cms-btn" disabled={pending} type="submit">{pending ? "Saving…" : "Save settings"}</button>
  </form>;
}
