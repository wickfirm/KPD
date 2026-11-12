"use client";

import { useActionState, useState } from "react";
import { saveProject, type ProjectFormState } from "../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";
import { SeoFields, type SeoFieldDefaults } from "@/components/admin/seo-fields";
import { TextStyleFields } from "@/components/admin/text-style-fields";
import type { ProjectChrome } from "@/lib/project-chrome";
import { defaultKeyFacts, galleryLightDevelopments, parseKeyFacts } from "@/lib/development-gallery-light";
import { ListEditor } from "@/components/admin/list-editor";
import { projectPageLabelDefaults } from "@/lib/project-chrome";

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
    <label className="cms-check"><input type="checkbox" name="showOnHomepage" defaultChecked={chrome?.showOnHomepage !== false} /><span><strong>Show on the homepage</strong><small>The large development cards under the developments image. Untick to keep the page published but off the homepage. Up to three ticked developments are shown, in the list order.</small></span></label>
    <TextStyleFields prefix="projectName" value={chrome?.nameStyle} label="Name appearance" preserveDefault />
    <label className="cms-field"><span>Headline</span><textarea name="tagline" rows={2} defaultValue={defaults?.tagline ?? ""} placeholder="A short line under the name" /><small>Shown as the main heading of the introduction. Line breaks render on the page exactly as typed.</small></label>
    <TextStyleFields prefix="projectTagline" value={chrome?.taglineStyle} label="Headline appearance" preserveDefault />
    <label className="cms-field"><span>Introduction</span><textarea name="description" rows={5} defaultValue={defaults?.description ?? ""} /></label>
    <TextStyleFields prefix="projectDescription" value={chrome?.descriptionStyle} label="Introduction appearance" preserveDefault />
    <div className="cms-grid"><label className="cms-check"><input type="checkbox" name="heroCtaVisible" defaultChecked={chrome?.ctaVisible !== false} /><span><strong>Show the introduction button</strong></span></label><label className="cms-field"><span>Button label</span><input name="heroCtaLabel" defaultValue={chrome?.ctaLabel ?? "Explore"} /></label><label className="cms-field"><span>Button link</span><input name="heroCtaUrl" defaultValue={chrome?.ctaUrl ?? "#amenities"} placeholder="#amenities" /></label></div>
    <div className="cms-grid"><label className="cms-check"><input type="checkbox" name="brochureVisible" defaultChecked={chrome?.brochureVisible !== false} /><span><strong>Show Download brochure</strong><small>Sits beside the introduction button. Visitors fill in a short form, then receive this file by email.</small></span></label><label className="cms-field"><span>Brochure button text</span><input name="brochureLabel" defaultValue={chrome?.brochureLabel ?? "Download brochure"} /></label><div className="cms-field"><span>Brochure file</span><AssetUrlField name="brochureUrl" defaultValue={chrome?.brochureUrl ?? ""} accept="application/pdf,image/*" placeholder="Upload the PDF" fileLabel="brochure" /></div></div>
    {defaults?.slug && galleryLightDevelopments.has(defaults.slug) ? <>
      <h3>Book a viewing button</h3>
      <p className="cms-muted">The dark button beside Download brochure at the top of the page. Leave the link empty to use the private viewing band&apos;s first button link below (or the enquiry popup when that is empty too).</p>
      <div className="cms-grid"><label className="cms-field"><span>Button label</span><input name="bookLabel" defaultValue={chrome?.bookLabel ?? ""} placeholder={chrome?.enquirePrimaryLabel || "Book a viewing"} /></label><label className="cms-field"><span>Button link</span><input name="bookUrl" defaultValue={chrome?.bookUrl ?? ""} placeholder="e.g. /contact, https://calendly.com/… or #location" /><small>A full https:// address opens in a new tab.</small></label></div>
      <h3>Key facts</h3>
      <KeyFactsField initial={chrome?.keyFacts ?? defaultKeyFacts(defaults.slug)} />
      <h3>Small labels on the page</h3>
      <p className="cms-muted">The small capital-letter captions. Clear a field to hide that caption. Each section’s own caption is edited in that section below.</p>
      <div className="cms-grid">
        <label className="cms-field"><span>Introduction caption</span><input name="labelOverview" defaultValue={chrome?.labels?.overview ?? projectPageLabelDefaults.overview} /><small>Above the headline, e.g. “Overview”.</small></label>
        <label className="cms-field"><span>Drive-times note</span><input name="labelDriveNote" defaultValue={chrome?.labels?.driveNote ?? projectPageLabelDefaults.driveNote} /><small>Under the location list. {"{name}"} becomes the development name.</small></label>
        <label className="cms-field"><span>Calculator caption</span><input name="labelCalculator" defaultValue={chrome?.labels?.calculator ?? projectPageLabelDefaults.calculator} /><small>Above the mortgage calculator. Its wording is edited under Investor guide → Mortgage calculator.</small></label>
        <label className="cms-field"><span>Page-bar button</span><input name="labelSubnavCta" defaultValue={chrome?.labels?.subnavCta ?? projectPageLabelDefaults.subnavCta} /><small>The button at the end of the sticky section bar. It opens the enquiry popup.</small></label>
      </div>
    </> : null}
    <h3>Private viewing band</h3>
    <p className="cms-muted">Shown directly after the calculator. Leave the first button link empty to open the enquiry popup.</p>
    <label className="cms-check"><input type="checkbox" name="enquireVisible" defaultChecked={chrome?.enquireVisible !== false} /><span><strong>Show the private viewing band</strong></span></label>
    <div className="cms-grid"><label className="cms-field"><span>Eyebrow</span><input name="enquireEyebrow" defaultValue={chrome?.enquireEyebrow ?? "Enquire"} /></label><label className="cms-field"><span>First button</span><input name="enquirePrimaryLabel" defaultValue={chrome?.enquirePrimaryLabel ?? "Book a viewing"} /></label><label className="cms-field"><span>First button link</span><input name="enquirePrimaryUrl" defaultValue={chrome?.enquirePrimaryUrl ?? ""} placeholder="Leave empty to open the enquiry popup" /></label><label className="cms-field"><span>Second button</span><input name="enquireSecondaryLabel" defaultValue={chrome?.enquireSecondaryLabel ?? "Register interest"} /></label><label className="cms-field"><span>Second button link</span><input name="enquireSecondaryUrl" defaultValue={chrome?.enquireSecondaryUrl ?? "/contact"} /></label></div>
    <label className="cms-field"><span>Heading</span><textarea name="enquireHeading" rows={2} defaultValue={chrome?.enquireHeading ?? "Arrange a private\nviewing."} /><small>Line breaks render on the page.</small></label>
    <label className="cms-field"><span>Text</span><textarea name="enquireText" rows={3} defaultValue={chrome?.enquireText ?? "Floor plans, pricing, and availability are shared through a single appointment-led conversation."} /></label>
    <div className="cms-field"><span>Background image</span><AssetUrlField name="enquireImage" defaultValue={chrome?.enquireImage ?? "/legacy/assets/images/experience-center/hq/15.jpg"} accept="image/*" fileLabel="private viewing background" /></div>
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

/// The row of facts under the page image (Location, Residences, Types, From,
/// Payment…). Edited as cards; stored as the same "Label | value" lines.
function KeyFactsField({ initial }: { initial: string }) {
  const [facts, setFacts] = useState(() => parseKeyFacts(initial));
  const value = facts.filter((fact) => fact.label.trim() && fact.value.trim()).map((fact) => `${fact.label.trim()} | ${fact.value.trim()}`).join("\n");
  return <div className="cms-field">
    <small>The row of facts under the page image, shown left to right in this order. Remove every fact to hide the row.</small>
    <input type="hidden" name="keyFacts" value={value} />
    <ListEditor items={facts} onChange={setFacts} addLabel="Add fact" max={6} newItem={() => ({ label: "", value: "" })} itemLabel={(fact, index) => fact.label || `Fact ${index + 1}`}
      renderItem={(fact, update) => <div className="cms-grid"><label className="cms-field"><span>Label</span><input value={fact.label} onChange={(event) => update({ label: event.target.value })} placeholder="Residences" /></label><label className="cms-field"><span>Value</span><input value={fact.value} onChange={(event) => update({ value: event.target.value })} placeholder="155" /></label></div>} />
  </div>;
}
