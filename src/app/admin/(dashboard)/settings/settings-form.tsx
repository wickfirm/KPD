"use client";

import { useActionState } from "react";
import { saveGlobalSettings, type SiteSettingsFormState } from "../actions";

export type Settings = { global?: { email?: string; phone?: string; whatsapp?: string; newsletterNote?: string; facebook?: string; x?: string; instagram?: string; youtube?: string }; home?: { heroVideo?: string; introHeading?: string; introParagraphs?: string[]; developmentHeading?: string; contactHeading?: string; contactText?: string; experienceImages?: string[] } };
const initialState: SiteSettingsFormState = {};

/// Shared contact and footer details only. Homepage content moved to its own
/// editor under Pages → Homepage, so editors find page content in Pages.
export default function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(saveGlobalSettings, initialState);
  const global = settings.global ?? {};
  return <form action={formAction}>{state.error ? <p className="cms-error">{state.error}</p> : null}
    <h1>Site settings</h1><p className="cms-muted">Shared contact details used across the site: the footer, the floating Enquiry / Call / WhatsApp buttons, the booking form and the Contact page. Leave a field empty to use the default. Homepage content lives under <strong>Pages → Homepage</strong>.</p>
    <h2 className="cms-form-heading">Contact</h2>
    <div className="cms-grid">
      <label className="cms-field"><span>Email</span><input type="email" name="email" defaultValue={global.email ?? ""} placeholder="info@kpd.ae" /><small>Used for enquiries, the booking form and newsletter sign-ups.</small></label>
      <label className="cms-field"><span>Phone</span><input name="phone" defaultValue={global.phone ?? ""} placeholder="+971 4 388 3099" /><small>Shown on the Contact page and used by the Call button.</small></label>
      <label className="cms-field"><span>WhatsApp</span><input name="whatsapp" defaultValue={global.whatsapp ?? ""} placeholder="https://wa.me/97143883099" /><small>A wa.me link, or just the number with country code.</small></label>
    </div>
    <h2 className="cms-form-heading">Footer</h2>
    <label className="cms-field"><span>Newsletter note</span><textarea name="newsletterNote" rows={3} defaultValue={global.newsletterNote ?? ""} placeholder="By signing up, I agree to receive KPD updates and accept the" /><small>Shown under the sign-up box, followed by the “privacy policy.” link.</small></label>
    <div className="cms-grid">
      <label className="cms-field"><span>Facebook</span><input type="url" name="facebook" defaultValue={global.facebook ?? ""} placeholder="https://www.facebook.com/…" /></label>
      <label className="cms-field"><span>X (Twitter)</span><input type="url" name="x" defaultValue={global.x ?? ""} placeholder="https://x.com/…" /></label>
      <label className="cms-field"><span>Instagram</span><input type="url" name="instagram" defaultValue={global.instagram ?? ""} placeholder="https://www.instagram.com/…" /></label>
      <label className="cms-field"><span>YouTube</span><input type="url" name="youtube" defaultValue={global.youtube ?? ""} placeholder="https://www.youtube.com/…" /></label>
    </div>
    <div className="cms-actions"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button></div>
  </form>;
}
