"use client";

import { useActionState } from "react";
import { saveNewsListing, type SiteSettingsFormState } from "../../actions";
import { newsListingDefaults as d, type NewsListingCopy } from "@/lib/news-listing";

const initialState: SiteSettingsFormState = {};

/// Editor for the /news page copy. Every field shows the live wording; a field
/// left blank falls back to the approved wording shown as its placeholder.
export default function NewsForm({ copy }: { copy: NewsListingCopy }) {
  const [state, formAction, pending] = useActionState(saveNewsListing, initialState);
  const value = (key: keyof typeof d) => copy[key] ?? d[key];
  return <form action={formAction}>{state.error ? <p className="cms-error">{state.error}</p> : null}
    <h2 className="cms-form-heading">Hero</h2>
    <div className="cms-grid">
      <label className="cms-field"><span>Breadcrumb label</span><input name="eyebrow" defaultValue={value("eyebrow")} placeholder={d.eyebrow} /><small>Shown between Home and News in the breadcrumb.</small></label>
      <label className="cms-field"><span>Page title</span><textarea name="heading" rows={2} defaultValue={value("heading")} placeholder={d.heading} /><small>Line breaks render as typed. Wrap words in **double asterisks** for the bold emphasis.</small></label>
    </div>
    <label className="cms-field"><span>Introduction</span><textarea name="intro" rows={3} defaultValue={copy.intro ?? ""} /><small>Optional sentence beside the title. Leave empty to hide it.</small></label>

    <h2 className="cms-form-heading">Articles</h2>
    <p className="cms-muted">The newest published article shows large; the rest show as cards. Write and publish articles under News &amp; Blog.</p>
    <div className="cms-grid">
      <label className="cms-field"><span>Featured article button</span><input name="featureCta" defaultValue={value("featureCta")} placeholder={d.featureCta} /></label>
      <label className="cms-field"><span>Card link text</span><input name="cardCta" defaultValue={value("cardCta")} placeholder={d.cardCta} /></label>
    </div>
    <label className="cms-field"><span>Text when no articles are published</span><input name="emptyText" defaultValue={value("emptyText")} placeholder={d.emptyText} /></label>

    <h2 className="cms-form-heading">Press band</h2>
    <label className="cms-check"><input type="checkbox" name="pressVisible" defaultChecked={copy.pressVisible !== false} /><span><strong>Show the press band</strong><small>The media enquiries block at the bottom of the page. The email shown is the site email from Site settings.</small></span></label>
    <div className="cms-grid">
      <label className="cms-field"><span>Caption</span><input name="pressLabel" defaultValue={value("pressLabel")} placeholder={d.pressLabel} /></label>
      <label className="cms-field"><span>Heading</span><textarea name="pressHeading" rows={2} defaultValue={value("pressHeading")} placeholder={d.pressHeading} /></label>
    </div>
    <label className="cms-field"><span>Text</span><textarea name="pressText" rows={2} defaultValue={value("pressText")} placeholder={d.pressText} /></label>
    <div className="cms-grid">
      <label className="cms-field"><span>Link caption</span><input name="pressLinkLabel" defaultValue={value("pressLinkLabel")} placeholder={d.pressLinkLabel} /></label>
      <label className="cms-field"><span>Link text</span><input name="pressLinkText" defaultValue={value("pressLinkText")} placeholder={d.pressLinkText} /></label>
      <label className="cms-field"><span>Link</span><input name="pressLinkUrl" defaultValue={value("pressLinkUrl")} placeholder={d.pressLinkUrl} /></label>
    </div>

    <div className="cms-actions cms-save-row"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save News page"}</button></div>
  </form>;
}
