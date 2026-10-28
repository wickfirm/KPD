"use client";

import { useActionState } from "react";
import { saveGlobalSettings, type SiteSettingsFormState } from "../actions";

export type Settings = { global?: { email?: string; phone?: string; whatsapp?: string; newsletterNote?: string; newsletterHeading?: string; newsletterSubmitLabel?: string; facebook?: string; x?: string; instagram?: string; youtube?: string; linkedin?: string; enquiryEnabled?: boolean; callEnabled?: boolean; whatsappEnabled?: boolean; popupTitle?: string; popupIntro?: string; popupSubmitLabel?: string; popupNote?: string }; home?: { heroVideo?: string; introHeading?: string; introParagraphs?: string[]; developmentHeading?: string; contactHeading?: string; contactText?: string; experienceImages?: string[] }; newsListing?: { eyebrow?: string; heading?: string; intro?: string } };
const initialState: SiteSettingsFormState = {};

/// Shared contact and footer details only. Homepage content moved to its own
/// editor under Pages → Homepage, so editors find page content in Pages.
export default function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(saveGlobalSettings, initialState);
  const global = settings.global ?? {};
  const newsListing = settings.newsListing ?? {};
  return <form action={formAction}>{state.error ? <p className="cms-error">{state.error}</p> : null}
    <h1>Site settings</h1><p className="cms-muted">Shared contact details used across the site: the footer, the floating Enquiry / Call / WhatsApp buttons, the booking form and the Contact page. Leave a field empty to hide or disable that item. Homepage content lives under <strong>Pages → Homepage</strong>.</p>
    <h2 className="cms-form-heading">Contact</h2>
    <div className="cms-grid">
      <label className="cms-field"><span>Form recipient email</span><input type="email" name="email" defaultValue={global.email ?? ""} placeholder="info@kpd.ae" /><small>Used by every mailto enquiry, booking, floor-plan and newsletter form.</small></label>
      <label className="cms-field"><span>Phone</span><input name="phone" defaultValue={global.phone ?? ""} placeholder="+971 4 388 3099" /><small>Shown on the Contact page and used by the Call button.</small></label>
      <label className="cms-field"><span>WhatsApp</span><input name="whatsapp" defaultValue={global.whatsapp ?? ""} placeholder="https://wa.me/97143883099" /><small>A wa.me link, or just the number with country code.</small></label>
    </div>
    <h2 className="cms-form-heading">Enquiry, Call &amp; WhatsApp</h2>
    <p className="cms-muted">Choose which floating contact actions visitors see. Empty phone or WhatsApp values also hide their action.</p>
    <div className="cms-grid">
      <label className="cms-check"><input type="checkbox" name="enquiryEnabled" defaultChecked={global.enquiryEnabled !== false} /><span><strong>Show Enquiry</strong><small>Opens the editable enquiry popup.</small></span></label>
      <label className="cms-check"><input type="checkbox" name="callEnabled" defaultChecked={global.callEnabled !== false} /><span><strong>Show Call</strong><small>Uses the phone number above.</small></span></label>
      <label className="cms-check"><input type="checkbox" name="whatsappEnabled" defaultChecked={global.whatsappEnabled !== false} /><span><strong>Show WhatsApp</strong><small>Uses the WhatsApp address above.</small></span></label>
    </div>
    <h2 className="cms-form-heading">Enquiry popup</h2>
    <div className="cms-grid"><label className="cms-field"><span>Heading</span><input name="popupTitle" defaultValue={global.popupTitle ?? "Start a conversation."} /></label><label className="cms-field"><span>Send button</span><input name="popupSubmitLabel" defaultValue={global.popupSubmitLabel ?? "Send enquiry"} /></label></div>
    <label className="cms-field"><span>Introduction</span><textarea name="popupIntro" rows={2} defaultValue={global.popupIntro ?? "Tell us about your property enquiry."} /></label>
    <label className="cms-field"><span>Confirmation note</span><textarea name="popupNote" rows={3} defaultValue={global.popupNote ?? "Our team will be in touch personally to discuss your enquiry. A member of our team will respond personally."} /></label>
    <h2 className="cms-form-heading">News &amp; Blogs page</h2>
    <p className="cms-muted">The hero title and introduction shown on the public News &amp; Blogs page.</p>
    <div className="cms-grid"><label className="cms-field"><span>Label</span><input name="newsEyebrow" defaultValue={newsListing.eyebrow ?? ""} placeholder="Media" /></label><label className="cms-field"><span>Page title</span><textarea name="newsListingHeading" rows={2} defaultValue={newsListing.heading ?? ""} placeholder="News and updates" /></label></div>
    <label className="cms-field"><span>Introduction</span><textarea name="newsListingIntro" rows={3} defaultValue={newsListing.intro ?? ""} /></label>
    <h2 className="cms-form-heading">Footer</h2>
    <div className="cms-grid"><label className="cms-field"><span>Newsletter heading</span><input name="newsletterHeading" defaultValue={global.newsletterHeading ?? "Stay informed"} /></label><label className="cms-field"><span>Subscribe button</span><input name="newsletterSubmitLabel" defaultValue={global.newsletterSubmitLabel ?? "Subscribe"} /></label></div>
    <label className="cms-field"><span>Newsletter note</span><textarea name="newsletterNote" rows={3} defaultValue={global.newsletterNote ?? ""} placeholder="By signing up, I agree to receive KPD updates and accept the" /><small>Shown under the sign-up box, followed by the “privacy policy.” link.</small></label>
    <div className="cms-grid">
      <label className="cms-field"><span>Facebook</span><input type="url" name="facebook" defaultValue={global.facebook ?? ""} placeholder="https://www.facebook.com/…" /></label>
      <label className="cms-field"><span>X (Twitter)</span><input type="url" name="x" defaultValue={global.x ?? ""} placeholder="https://x.com/…" /></label>
      <label className="cms-field"><span>Instagram</span><input type="url" name="instagram" defaultValue={global.instagram ?? ""} placeholder="https://www.instagram.com/…" /></label>
      <label className="cms-field"><span>LinkedIn</span><input type="url" name="linkedin" defaultValue={global.linkedin ?? ""} placeholder="https://www.linkedin.com/company/…" /></label>
      <label className="cms-field"><span>YouTube</span><input type="url" name="youtube" defaultValue={global.youtube ?? ""} placeholder="https://www.youtube.com/…" /></label>
    </div>
    <div className="cms-actions"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button></div>
  </form>;
}
