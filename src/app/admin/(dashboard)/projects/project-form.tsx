"use client";

import { useActionState } from "react";
import { saveProject, type ProjectFormState } from "../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";
import { SeoFields, type SeoFieldDefaults } from "@/components/admin/seo-fields";
import { TextStyleFields } from "@/components/admin/text-style-fields";
import type { ProjectChrome } from "@/lib/project-chrome";

export type ProjectDefaults = {
  id?: string; slug?: string; name?: string; tagline?: string | null; description?: string | null;
  profile?: string; status?: string; heroImage?: string | null; heroVideo?: string | null; location?: string | null; sortOrder?: number;
};

const initialState: ProjectFormState = {};

export default function ProjectForm({ defaults, seo, chrome }: { defaults?: ProjectDefaults; seo?: SeoFieldDefaults; chrome?: ProjectChrome }) {
  const [state, formAction, pending] = useActionState(saveProject, initialState);
  return <form action={formAction}>
    {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
    {state.error ? <p className="cms-error">{state.error}</p> : null}
    <div className="cms-grid">
      <label className="cms-field"><span>Development name</span><input name="name" defaultValue={defaults?.name} required /></label>
      <label className="cms-field" data-requires="publish"><span>Status</span><select name="status" defaultValue={defaults?.status ?? "DRAFT"}><option value="DRAFT">Draft — not public</option><option value="PUBLISHED">Published — live on the site</option><option value="ARCHIVED">Archived — removed from the site</option></select><small>Publishing, drafting and archiving take effect immediately.</small></label>
    </div>
    <TextStyleFields prefix="projectName" value={chrome?.nameStyle} label="Name appearance" preserveDefault />
    <label className="cms-field"><span>Headline</span><textarea name="tagline" rows={2} defaultValue={defaults?.tagline ?? ""} placeholder="A short line under the name" /><small>Shown as the main heading of the introduction. Line breaks render on the page exactly as typed.</small></label>
    <TextStyleFields prefix="projectTagline" value={chrome?.taglineStyle} label="Headline appearance" preserveDefault />
    <label className="cms-field"><span>Introduction</span><textarea name="description" rows={5} defaultValue={defaults?.description ?? ""} /></label>
    <TextStyleFields prefix="projectDescription" value={chrome?.descriptionStyle} label="Introduction appearance" preserveDefault />
    <div className="cms-grid"><label className="cms-check"><input type="checkbox" name="heroCtaVisible" defaultChecked={chrome?.ctaVisible !== false} /><span><strong>Show the introduction button</strong></span></label><label className="cms-field"><span>Button label</span><input name="heroCtaLabel" defaultValue={chrome?.ctaLabel ?? "Explore"} /></label><label className="cms-field"><span>Button link</span><input name="heroCtaUrl" defaultValue={chrome?.ctaUrl ?? "#amenities"} placeholder="#amenities" /></label></div>
    <div className="cms-grid"><label className="cms-check"><input type="checkbox" name="brochureVisible" defaultChecked={chrome?.brochureVisible !== false} /><span><strong>Show Download brochure</strong><small>Sits beside the introduction button. Visitors fill in a short form, then receive this file by email.</small></span></label><label className="cms-field"><span>Brochure button text</span><input name="brochureLabel" defaultValue={chrome?.brochureLabel ?? "Download brochure"} /></label><div className="cms-field"><span>Brochure file</span><AssetUrlField name="brochureUrl" defaultValue={chrome?.brochureUrl ?? ""} accept="application/pdf,image/*" placeholder="Upload the PDF" fileLabel="brochure" /></div></div>
    <div className="cms-field"><span>Hero image</span><AssetUrlField name="heroImage" defaultValue={defaults?.heroImage ?? ""} placeholder="/legacy/assets/images/..." /></div>
    <div className="cms-field"><span>Hero video (optional)</span><AssetUrlField name="heroVideo" defaultValue={defaults?.heroVideo ?? ""} accept="video/mp4,video/webm" placeholder="https://…" fileLabel="hero video" /><small>When supplied, the video plays behind the hero heading; the image remains its poster and the listing thumbnail.</small></div>
    {!defaults?.id ? <label className="cms-check"><input type="checkbox" name="starter" defaultChecked /> <span><strong>Start with the standard sections</strong><small>Adds overview, location, tour, amenities, floor plans and payment plan, ready to fill in.</small></span></label> : null}
    <details className="cms-advanced-input">
      <summary>Advanced options</summary>
      <div className="cms-grid">
        <div className="cms-field"><span>Page address</span><output>/{defaults?.slug ?? "developments/derived-from-name"}</output><small>Created automatically from the development name and kept stable after publishing.</small></div>
        <label className="cms-field"><span>Location label</span><input name="location" defaultValue={defaults?.location ?? ""} placeholder="e.g. Dubai Hills Estate" /><small>Small label above the name in listings.</small></label>
        <label className="cms-field"><span>Visibility</span><select name="profile" defaultValue={defaults?.profile ?? "FULL"}><option value="FULL">Public site</option><option value="RESTRICTED">Restricted (not shown publicly)</option></select></label>
        <label className="cms-field"><span>Position in listings</span><input name="sortOrder" type="number" min="0" defaultValue={defaults?.sortOrder ?? 0} /><small>Easier: use Move earlier / Move later on the Developments list.</small></label>
      </div>
    </details>
    <SeoFields defaults={seo} />
    <div className="cms-save-row"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save development"}</button></div>
  </form>;
}
