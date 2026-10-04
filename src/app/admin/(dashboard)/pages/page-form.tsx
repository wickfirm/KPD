"use client";

import { useActionState, useState } from "react";
import { saveStaticPage, type StaticPageFormState } from "../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";
import { legacyDefaults, type LegacyMilestone } from "@/lib/legacy-defaults";
import { aboutDefaults } from "@/lib/about-defaults";

type ManagementPerson = { name?: string; role?: string; bio?: string; image?: string };
type Block = { type?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaUrl?: string; mission?: string; vision?: string; chairmanText?: string; chairmanName?: string; chairmanRole?: string; chairmanImage?: string; management?: ManagementPerson[]; timeline?: LegacyMilestone[] };
export type StaticPageDefaults = { id?: string; slug?: string; title?: string; status?: string; content?: Block[] };
const initialState: StaticPageFormState = {};

function firstBlock(blocks: Block[] | undefined, type: string) {
  return (blocks ?? []).find((block) => block.type === type);
}

const aboutFallback = aboutDefaults;

const legacyFallback: LegacyMilestone[] = legacyDefaults.timeline;

export default function StaticPageForm({ defaults, lockedSlug = false }: { defaults?: StaticPageDefaults; lockedSlug?: boolean }) {
  const [state, formAction, pending] = useActionState(saveStaticPage, initialState);
  const hero = firstBlock(defaults?.content, "hero");
  const about = firstBlock(defaults?.content, "about");
  const legacy = firstBlock(defaults?.content, "legacy");
  const paragraphs = (defaults?.content ?? []).filter((block) => block.type === "paragraph").map((block) => block.text).filter(Boolean).join("\n\n");
  const isAbout = defaults?.slug === "about";
  const isLegacy = defaults?.slug === "legacy";
  const aboutValues = { ...aboutFallback, ...(about ?? {}) };
  const [management, setManagement] = useState<ManagementPerson[]>(() => aboutValues.management?.length ? aboutValues.management : aboutFallback.management);
  const [timeline, setTimeline] = useState<LegacyMilestone[]>(() => legacy?.timeline?.length ? legacy.timeline : legacyFallback);
  function updateTimeline(index: number, changes: Partial<LegacyMilestone>) {
    setTimeline((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  }
  function moveTimelineItem(index: number, direction: -1 | 1) {
    setTimeline((items) => {
      const target = index + direction;
      if (target < 0 || target >= items.length) return items;
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function updateManagement(index: number, changes: Partial<ManagementPerson>) {
    setManagement((members) => members.map((member, memberIndex) => memberIndex === index ? { ...member, ...changes } : member));
  }
  function moveManagement(index: number, direction: -1 | 1) {
    setManagement((members) => {
      const target = index + direction;
      if (target < 0 || target >= members.length) return members;
      const next = [...members];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return <form action={formAction}>
    {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
    {state.error ? <p className="cms-error">{state.error}</p> : null}
    <div className="cms-grid">
      <label className="cms-field"><span>Page title</span><input name="title" defaultValue={defaults?.title} required /></label>
      <label className="cms-field"><span>URL slug{lockedSlug ? " (fixed for this page)" : ""}</span><input name="slug" defaultValue={defaults?.slug} placeholder="privacy-policy" readOnly={lockedSlug} /></label>
      <label className="cms-field"><span>Status</span><select name="status" defaultValue={defaults?.status ?? "DRAFT"}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label>
    </div>
    <h2 className="cms-form-heading">Page introduction</h2>
    <label className="cms-field"><span>Heading</span><input name="heading" defaultValue={hero?.heading ?? ""} /></label>
    <label className="cms-field"><span>Intro copy</span><textarea name="intro" rows={4} defaultValue={hero?.text ?? ""} /></label>
    <div className="cms-grid">
      <label className="cms-field"><span>Feature image</span><AssetUrlField name="image" defaultValue={hero?.image ?? ""} placeholder="/legacy/assets/images/..." /></label>
      <label className="cms-field"><span>CTA label</span><input name="ctaLabel" defaultValue={hero?.ctaLabel ?? ""} /></label>
      <label className="cms-field"><span>CTA link</span><input name="ctaUrl" defaultValue={hero?.ctaUrl ?? ""} /></label>
    </div>
    <label className="cms-field"><span>Page body</span><textarea name="paragraphs" rows={12} defaultValue={paragraphs} placeholder="Write one paragraph, then leave a blank line before the next." /><small>Paragraphs will be rendered in the order shown by the page template.</small></label>
    {isAbout ? <section className="cms-editor-section"><h2 className="cms-form-heading">About-page sections</h2><div className="cms-grid"><label className="cms-field"><span>Mission</span><textarea name="mission" rows={5} defaultValue={aboutValues.mission} /></label><label className="cms-field"><span>Vision</span><textarea name="vision" rows={5} defaultValue={aboutValues.vision} /></label></div><h3>Chairman</h3><label className="cms-field"><span>Message</span><textarea name="chairmanText" rows={6} defaultValue={aboutValues.chairmanText} /></label><div className="cms-grid"><label className="cms-field"><span>Name</span><input name="chairmanName" defaultValue={aboutValues.chairmanName} /></label><label className="cms-field"><span>Role</span><input name="chairmanRole" defaultValue={aboutValues.chairmanRole} /></label><div className="cms-field"><span>Portrait</span><AssetUrlField name="chairmanImage" defaultValue={aboutValues.chairmanImage} accept="image/*" fileLabel="chairman portrait" /></div></div><div className="cms-management-heading"><div><h3>Executive management</h3><p className="cms-muted">Edit each team member separately. Use the upload button to choose their portrait.</p></div><span className="cms-section-count">{management.length} members</span></div><div className="cms-management-grid">{management.map((member, index) => <fieldset className="cms-repeat-card cms-repeat-card--member" key={index}><legend>Team member {index + 1}</legend><div className="cms-member-portrait">{member.image ? <img src={member.image} alt={`Portrait of ${member.name || "team member"}`} /> : <span className="cms-member-portrait-empty">No photo yet</span>}</div><div className="cms-member-fields"><div className="cms-grid"><label className="cms-field"><span>Name</span><input name="managementName" value={member.name ?? ""} onChange={(event) => updateManagement(index, { name: event.target.value })} /></label><label className="cms-field"><span>Role</span><input name="managementRole" value={member.role ?? ""} onChange={(event) => updateManagement(index, { role: event.target.value })} /></label></div><label className="cms-field"><span>Biography</span><textarea name="managementBio" rows={5} value={member.bio ?? ""} onChange={(event) => updateManagement(index, { bio: event.target.value })} /></label><input type="hidden" name="managementImage" value={member.image ?? ""} /><div className="cms-field"><span>Portrait</span><AssetUrlField value={member.image ?? ""} onChange={(image) => updateManagement(index, { image })} accept="image/*" placeholder="Upload a portrait" fileLabel={`portrait for team member ${index + 1}`} /></div><div className="cms-actions"><button className="cms-btn cms-btn--ghost cms-btn--small" type="button" onClick={() => moveManagement(index, -1)} disabled={index === 0}>Move up</button><button className="cms-btn cms-btn--ghost cms-btn--small" type="button" onClick={() => moveManagement(index, 1)} disabled={index === management.length - 1}>Move down</button><button className="cms-text-button cms-text-button--danger" type="button" onClick={() => setManagement((members) => members.filter((_, memberIndex) => memberIndex !== index))}>Remove</button></div></div></fieldset>)}</div><button className="cms-btn cms-btn--ghost" type="button" onClick={() => setManagement((members) => [...members, { name: "", role: "", bio: "", image: "" }])}>Add team member</button></section> : null}
    {isLegacy ? <section className="cms-editor-section"><h2 className="cms-form-heading">Legacy timeline</h2><p className="cms-muted">One card per year — the years alternate left and right on the public page. Any number of milestones is supported.</p><input type="hidden" name="legacyTimelineJson" value={JSON.stringify(timeline)} /><div className="cms-management-grid">{timeline.map((item, index) => <fieldset className="cms-repeat-card" key={index}><legend>Milestone {index + 1}{item.year ? ` — ${item.year}` : ""}</legend><div className="cms-grid"><label className="cms-field"><span>Year</span><input value={item.year ?? ""} onChange={(event) => updateTimeline(index, { year: event.target.value })} placeholder="2014" /></label><label className="cms-field"><span>Title</span><input value={item.title ?? ""} onChange={(event) => updateTimeline(index, { title: event.target.value })} /></label></div><label className="cms-field"><span>Summary (shown while collapsed)</span><textarea rows={2} value={item.summary ?? ""} onChange={(event) => updateTimeline(index, { summary: event.target.value })} /></label><label className="cms-field"><span>Full text (shown when expanded)</span><textarea rows={3} value={item.body ?? ""} onChange={(event) => updateTimeline(index, { body: event.target.value })} /></label><div className="cms-field"><span>Image</span><AssetUrlField value={item.image ?? ""} onChange={(image) => updateTimeline(index, { image })} accept="image/*" placeholder="/legacy/assets/images/…" fileLabel={`milestone ${index + 1} image`} /></div><div className="cms-actions"><button className="cms-btn cms-btn--ghost" type="button" onClick={() => moveTimelineItem(index, -1)} disabled={index === 0}>Move up</button><button className="cms-btn cms-btn--ghost" type="button" onClick={() => moveTimelineItem(index, 1)} disabled={index === timeline.length - 1}>Move down</button><button className="cms-text-button cms-text-button--danger" type="button" onClick={() => setTimeline((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div></fieldset>)}</div><button className="cms-btn cms-btn--ghost" type="button" onClick={() => setTimeline((items) => [...items, { year: "", title: "", summary: "", body: "", image: "" }])}>Add milestone</button></section> : null}
    <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save page"}</button>
  </form>;
}
