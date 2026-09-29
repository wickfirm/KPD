"use client";

import { useActionState } from "react";
import { saveGlobalSettings, type SiteSettingsFormState } from "../actions";

export type Settings = { global?: { email?: string; phone?: string; whatsapp?: string; newsletterNote?: string }; home?: { heroVideo?: string; introHeading?: string; introParagraphs?: string[]; developmentHeading?: string; contactHeading?: string; contactText?: string; experienceImages?: string[] } };
const initialState: SiteSettingsFormState = {};

/// Shared contact and footer details only. Homepage content moved to its own
/// editor under Pages → Homepage, so editors find page content in Pages.
export default function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(saveGlobalSettings, initialState);
  const global = settings.global ?? {};
  return <form action={formAction}>{state.error ? <p className="cms-error">{state.error}</p> : null}
    <h1>Site settings</h1><p className="cms-muted">Shared contact details used across the site and footer. Homepage content lives under <strong>Pages → Homepage</strong>.</p>
    <h2 className="cms-form-heading">Contact and footer</h2>
    <div className="cms-grid">
      <label className="cms-field"><span>Email</span><input type="email" name="email" defaultValue={global.email ?? ""} /></label>
      <label className="cms-field"><span>Phone</span><input name="phone" defaultValue={global.phone ?? ""} /></label>
      <label className="cms-field"><span>WhatsApp URL</span><input name="whatsapp" defaultValue={global.whatsapp ?? ""} placeholder="https://wa.me/..." /></label>
    </div>
    <label className="cms-field"><span>Newsletter note</span><textarea name="newsletterNote" rows={3} defaultValue={global.newsletterNote ?? ""} /></label>
    <div className="cms-actions"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button></div>
  </form>;
}
