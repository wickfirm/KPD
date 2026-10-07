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

/// Delivered hero content per registered page — prefill the editor so it shows
/// exactly what the public page currently displays when nothing has been saved.
const pageHeroDefaults: Record<string, { heading?: string; text?: string; image?: string; paragraphs?: string[] }> = {
  about: { heading: aboutDefaults.heading, text: aboutDefaults.heroText, image: aboutDefaults.heroImage, paragraphs: aboutDefaults.story },
  legacy: { heading: legacyDefaults.heading, text: legacyDefaults.text, image: legacyDefaults.image },
  "invest-in-dubai": {
    heading: "Long-horizon\nvalue in Dubai",
    text: "A focused investment pathway for buyers seeking regulated ownership, composed residential assets, and advisory clarity across Dubai's next chapter.",
    image: "/legacy/assets/images/library/view-of-dubai-skyline-including-the-burj-khalifa-2026-03-18-08-25-37-utc.jpg",
  },
  contact: {
    heading: "Plan a visit,\nor start a conversation.",
    text: "Tell us what you're looking for and the right person will respond. Previews, walkthroughs, and advisory conversations are handled through the KPD Experience Center.",
    image: "/legacy/assets/images/experience-center/hq/10.jpg",
  },
  /// Legal pages: the delivered copy, with "## " marking the delivered h2
  /// section headings (the save action stores those as heading blocks).
  terms: {
    heading: "Terms of Use",
    image: "/legacy/assets/images/library/view-of-dubai-skyline-including-the-burj-khalifa-2026-03-18-08-25-37-utc.jpg",
    paragraphs: [
      "These terms govern use of the Kasumigaseki Properties Development website and the information presented across project, company, news, and contact pages.",
      "## Website Information",
      "Content is provided for general information only. Project information, images, dimensions, features, prices, timelines, and availability may change without notice and should be verified directly with KPD.",
      "## Use of Content",
      "Text, images, marks, layouts, and design materials are owned by or licensed to KPD and may not be reproduced or distributed without written permission.",
      "## No Investment Advice",
      "Nothing on this website should be treated as financial, legal, tax, or investment advice. Visitors should obtain independent advice before making decisions.",
      "## Contact",
      "For questions about these terms, contact info@kpd.ae.",
    ],
  },
  "privacy-policy": {
    heading: "Privacy Policy",
    image: "/legacy/assets/images/library/panorama-of-dubai-skyscrapers-skyline-2026-01-07-06-12-48-utc.jpg",
    paragraphs: [
      "KPD respects the privacy of website visitors, buyers, investors, partners, and people who contact us through forms, email, or events.",
      "## Information We Collect",
      "We may collect contact details, enquiry preferences, message content, event registrations, newsletter signups, and basic website usage data.",
      "## How We Use Information",
      "Information is used to respond to enquiries, coordinate meetings, share project updates, improve the website experience, and maintain appropriate business records.",
      "## Sharing",
      "We do not sell personal information. We may share data with service providers, advisors, or project partners where needed to respond to a request or operate the website.",
      "## Your Choices",
      "You may request access, correction, or deletion of your information by contacting info@kpd.ae.",
    ],
  },
  "cookie-policy": {
    heading: "Cookie Policy",
    image: "/legacy/assets/images/library/dubai-marina-skyscrapers-and-port-in-dubai-united-2026-03-24-00-24-57-utc.jpg",
    paragraphs: [
      "This website may use cookies and similar technologies to support basic operation, understand website performance, and improve visitor experience.",
      "## Types of Cookies",
      "Essential cookies support page functionality. Analytics cookies help us understand aggregate browsing behavior. Preference cookies may remember choices made by visitors.",
      "## Managing Cookies",
      "You can manage or block cookies through your browser settings. Some parts of the website may not function as intended if cookies are disabled.",
      "## Updates",
      "We may update this policy from time to time to reflect website or regulatory changes.",
      "## Contact",
      "Questions can be sent to info@kpd.ae.",
    ],
  },
};

export default function StaticPageForm({ defaults, lockedSlug = false }: { defaults?: StaticPageDefaults; lockedSlug?: boolean }) {
  const [state, formAction, pending] = useActionState(saveStaticPage, initialState);
  const hero = firstBlock(defaults?.content, "hero");
  const heroPrefill = defaults?.slug ? pageHeroDefaults[defaults.slug] : undefined;
  const about = firstBlock(defaults?.content, "about");
  const legacy = firstBlock(defaults?.content, "legacy");
  const savedParagraphs = (defaults?.content ?? []).flatMap((block) => block.type === "paragraph" && block.text ? [block.text] : block.type === "heading" && block.heading ? [`## ${block.heading}`] : []);
  const paragraphs = (savedParagraphs.length ? savedParagraphs : heroPrefill?.paragraphs ?? []).join("\n\n");
  const isAbout = defaults?.slug === "about";
  const isLegacy = defaults?.slug === "legacy";
  const isLegal = defaults?.slug === "terms" || defaults?.slug === "privacy-policy" || defaults?.slug === "cookie-policy";
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
    <p className="cms-muted">Fields show the delivered copy until you save your own — the public page works the same way.</p>
    <label className="cms-field"><span>Heading</span><input name="heading" defaultValue={hero?.heading || heroPrefill?.heading || ""} /></label>
    <label className="cms-field"><span>Intro copy</span><textarea name="intro" rows={4} defaultValue={hero?.text || heroPrefill?.text || ""} /></label>
    <div className="cms-grid">
      <label className="cms-field"><span>Feature image</span><AssetUrlField name="image" defaultValue={hero?.image || heroPrefill?.image || ""} placeholder="/legacy/assets/images/..." /></label>
      <label className="cms-field"><span>CTA label</span><input name="ctaLabel" defaultValue={hero?.ctaLabel ?? ""} /></label>
      <label className="cms-field"><span>CTA link</span><input name="ctaUrl" defaultValue={hero?.ctaUrl ?? ""} /></label>
    </div>
    <label className="cms-field"><span>Page body</span><textarea name="paragraphs" rows={12} defaultValue={paragraphs} placeholder="Write one paragraph, then leave a blank line before the next." /><small>{isLegal ? "Paragraphs render in the order shown. Start a line with “## ” to make it a section heading on the public page." : "Paragraphs will be rendered in the order shown by the page template."}</small></label>
    {isAbout ? <section className="cms-editor-section"><h2 className="cms-form-heading">About-page sections</h2><div className="cms-grid"><label className="cms-field"><span>Mission</span><textarea name="mission" rows={5} defaultValue={aboutValues.mission} /></label><label className="cms-field"><span>Vision</span><textarea name="vision" rows={5} defaultValue={aboutValues.vision} /></label></div><h3>Chairman</h3><label className="cms-field"><span>Message</span><textarea name="chairmanText" rows={6} defaultValue={aboutValues.chairmanText} /></label><div className="cms-grid"><label className="cms-field"><span>Name</span><input name="chairmanName" defaultValue={aboutValues.chairmanName} /></label><label className="cms-field"><span>Role</span><input name="chairmanRole" defaultValue={aboutValues.chairmanRole} /></label><div className="cms-field"><span>Portrait</span><AssetUrlField name="chairmanImage" defaultValue={aboutValues.chairmanImage} accept="image/*" fileLabel="chairman portrait" /></div></div><div className="cms-management-heading"><div><h3>Executive management</h3><p className="cms-muted">Edit each team member separately. Use the upload button to choose their portrait.</p></div><span className="cms-section-count">{management.length} members</span></div><div className="cms-member-list">{management.map((member, index) => <details className="cms-member-card" key={index} open={index === 0}><summary><span className="cms-member-card__thumb" style={member.image ? { backgroundImage: `url(${member.image})` } : undefined} aria-hidden="true" /><span className="cms-member-card__meta"><strong>{member.name || `Team member ${index + 1}`}</strong><small>{member.role || "No role yet"}</small></span><span className="cms-member-card__chevron" aria-hidden="true" /></summary><div className="cms-member-card__body"><div className="cms-grid"><label className="cms-field"><span>Name</span><input name="managementName" value={member.name ?? ""} onChange={(event) => updateManagement(index, { name: event.target.value })} /></label><label className="cms-field"><span>Role</span><input name="managementRole" value={member.role ?? ""} onChange={(event) => updateManagement(index, { role: event.target.value })} /></label></div><label className="cms-field"><span>Biography</span><textarea name="managementBio" rows={4} value={member.bio ?? ""} onChange={(event) => updateManagement(index, { bio: event.target.value })} placeholder="Shown when a visitor opens this member on the public page." /></label><input type="hidden" name="managementImage" value={member.image ?? ""} /><div className="cms-field"><span>Portrait</span><AssetUrlField value={member.image ?? ""} onChange={(image) => updateManagement(index, { image })} accept="image/*" placeholder="Upload a portrait" fileLabel={`portrait for team member ${index + 1}`} hidePreview /></div><div className="cms-actions"><button className="cms-btn cms-btn--ghost cms-btn--small" type="button" onClick={() => moveManagement(index, -1)} disabled={index === 0}>Move up</button><button className="cms-btn cms-btn--ghost cms-btn--small" type="button" onClick={() => moveManagement(index, 1)} disabled={index === management.length - 1}>Move down</button><button className="cms-text-button cms-text-button--danger" type="button" onClick={() => setManagement((members) => members.filter((_, memberIndex) => memberIndex !== index))}>Remove</button></div></div></details>)}</div><button className="cms-btn cms-btn--ghost" type="button" onClick={() => setManagement((members) => [...members, { name: "", role: "", bio: "", image: "" }])}>Add team member</button></section> : null}
    {isLegacy ? <section className="cms-editor-section"><h2 className="cms-form-heading">Legacy timeline</h2><p className="cms-muted">One card per year — the years alternate left and right on the public page. Any number of milestones is supported.</p><input type="hidden" name="legacyTimelineJson" value={JSON.stringify(timeline)} /><div className="cms-management-grid">{timeline.map((item, index) => <fieldset className="cms-repeat-card" key={index}><legend>Milestone {index + 1}{item.year ? ` — ${item.year}` : ""}</legend><div className="cms-grid"><label className="cms-field"><span>Year</span><input value={item.year ?? ""} onChange={(event) => updateTimeline(index, { year: event.target.value })} placeholder="2014" /></label><label className="cms-field"><span>Title</span><input value={item.title ?? ""} onChange={(event) => updateTimeline(index, { title: event.target.value })} /></label></div><label className="cms-field"><span>Summary (shown while collapsed)</span><textarea rows={2} value={item.summary ?? ""} onChange={(event) => updateTimeline(index, { summary: event.target.value })} /></label><label className="cms-field"><span>Full text (shown when expanded)</span><textarea rows={3} value={item.body ?? ""} onChange={(event) => updateTimeline(index, { body: event.target.value })} /></label><div className="cms-field"><span>Image</span><AssetUrlField value={item.image ?? ""} onChange={(image) => updateTimeline(index, { image })} accept="image/*" placeholder="/legacy/assets/images/…" fileLabel={`milestone ${index + 1} image`} /></div><div className="cms-actions"><button className="cms-btn cms-btn--ghost" type="button" onClick={() => moveTimelineItem(index, -1)} disabled={index === 0}>Move up</button><button className="cms-btn cms-btn--ghost" type="button" onClick={() => moveTimelineItem(index, 1)} disabled={index === timeline.length - 1}>Move down</button><button className="cms-text-button cms-text-button--danger" type="button" onClick={() => setTimeline((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div></fieldset>)}</div><button className="cms-btn cms-btn--ghost" type="button" onClick={() => setTimeline((items) => [...items, { year: "", title: "", summary: "", body: "", image: "" }])}>Add milestone</button></section> : null}
    <div className="cms-save-row"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save page"}</button></div>
  </form>;
}
