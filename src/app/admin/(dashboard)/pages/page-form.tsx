"use client";

import { useActionState, useRef, useState } from "react";
import { previewPageDraft, saveStaticPage, type StaticPageFormState } from "../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";
import { ListEditor } from "@/components/admin/list-editor";
import { SeoFields, type SeoFieldDefaults } from "@/components/admin/seo-fields";
import { TextStyleFields, type TextStyleValue } from "@/components/admin/text-style-fields";
import { aboutDefaults, type AboutContent } from "@/lib/about-defaults";
import { legacyGalleryDefaults, type LegacyContent, type LegacyMilestone } from "@/lib/legacy-defaults";
import { mergeContactInquiryContent } from "@/lib/contact-inquiry-content";
import { legalContact } from "@/lib/terms-defaults";

type ManagementPerson = { name?: string; role?: string; bio?: string; image?: string };
type Block = { type?: string; heading?: string; text?: string; image?: string; eyebrow?: string; ctaLabel?: string; ctaUrl?: string; sectionHeading?: string; storyImage?: string; mission?: string; vision?: string; chairmanText?: string; chairmanName?: string; chairmanRole?: string; chairmanImage?: string; ceoText?: string; ceoName?: string; ceoRole?: string; ceoImage?: string; management?: ManagementPerson[]; timeline?: LegacyMilestone[]; [key: string]: unknown };
export type StaticPageDefaults = { id?: string; slug?: string; title?: string; status?: string; content?: Block[] };
const initialState: StaticPageFormState = {};

function firstBlock(blocks: Block[] | undefined, type: string) {
  return (blocks ?? []).find((block) => block.type === type);
}

export default function StaticPageForm({ defaults, lockedSlug = false, seo }: { defaults?: StaticPageDefaults; lockedSlug?: boolean; seo?: SeoFieldDefaults }) {
  const [state, formAction, pending] = useActionState(saveStaticPage, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  /// Legal pages, About, Legacy and Contact: opens the admin preview with the page exactly as it
  /// currently looks here, saved or not. The tab opens straight away (a
  /// click-triggered open is never blocked) and is pointed at the preview once
  /// the draft is stored.
  async function previewUnsaved() {
    if (!formRef.current) return;
    setPreviewing(true); setPreviewError("");
    const tab = window.open("about:blank", "_blank");
    try {
      const result = await previewPageDraft(new FormData(formRef.current));
      if (result.error || !result.slug) throw new Error(result.error || "Unable to build the preview.");
      const target = `/admin/preview/pages/${result.slug}?draft=1`;
      if (tab) tab.location.href = target; else window.location.assign(target);
    } catch (error) {
      tab?.close();
      setPreviewError(error instanceof Error ? error.message : "Unable to build the preview.");
    } finally { setPreviewing(false); }
  }
  const hero = firstBlock(defaults?.content, "hero");
  const about = firstBlock(defaults?.content, "about");
  const legacy = firstBlock(defaults?.content, "legacy");
  const contactForm = mergeContactInquiryContent(firstBlock(defaults?.content, "contact-form"));
  const legalContactSaved = firstBlock(defaults?.content, "legal-contact") as { heading?: string; text?: string; email?: string } | undefined;
  const savedParagraphs = (defaults?.content ?? []).flatMap((block) => block.type === "paragraph" && block.text ? [block.text] : block.type === "heading" && block.heading ? [`## ${block.heading}`] : []);
  const paragraphs = savedParagraphs.join("\n\n");
  const isAbout = defaults?.slug === "about";
  const isLegacy = defaults?.slug === "legacy";
  const isLegal = defaults?.slug === "terms" || defaults?.slug === "privacy-policy" || defaults?.slug === "cookie-policy";
  // About, Legacy, Contact and the Investor guide render from their saved content as soon as it
  // exists (there is no draft state for them), so the editor does not offer a status choice.
  // Legacy and Contact render only their introduction (and the timeline); a body box would do nothing.
  const showBody = defaults?.slug !== "legacy" && defaults?.slug !== "contact" && !isAbout;
  const liveByDefault = defaults?.slug === "about" || defaults?.slug === "legacy" || defaults?.slug === "contact" || defaults?.slug === "invest-in-dubai";
  const aboutValues = about ?? {};
  const aboutExtras = (about ?? {}) as AboutContent;
  const legacyExtras = (legacy ?? {}) as LegacyContent;
  const [management, setManagement] = useState<ManagementPerson[]>(() => aboutValues.management ?? []);
  const [timeline, setTimeline] = useState<LegacyMilestone[]>(() => legacy?.timeline ?? []);
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

  return <form ref={formRef} action={formAction}>
    {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
    {state.error ? <p className="cms-error">{state.error}</p> : null}
    <div className="cms-grid">
      <label className="cms-field"><span>Page title</span><input name="title" defaultValue={defaults?.title} required /></label>
      <div className="cms-field"><span>URL address</span><output>/{defaults?.slug ?? "derived-from-title"}</output><small>Created automatically and kept stable so existing links never break.</small></div>
      {liveByDefault
        ? <input type="hidden" name="status" value="PUBLISHED" />
        : <label className="cms-field"><span>Status</span><select name="status" defaultValue={defaults?.status ?? "DRAFT"}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select>{isLegal ? <small>Until published, visitors see the original legal text; publish to show your edits.</small> : null}</label>}
    </div>
    <h2 className="cms-form-heading">Page introduction</h2>
    <p className="cms-muted">These fields are the public page source of truth. Empty values remain empty after saving.</p>
    <label className="cms-field"><span>Heading</span><textarea name="heading" rows={2} defaultValue={hero?.heading ?? ""} /><small>Line breaks render on the public page exactly as typed.</small></label>
    <TextStyleFields prefix="pageHeading" value={hero?.headingStyle as TextStyleValue | undefined} label="Heading appearance" preserveDefault />
    {isAbout || isLegacy || defaults?.slug === "contact" ? <label className="cms-field"><span>Hero label</span><input name="eyebrow" defaultValue={hero?.eyebrow ?? (isAbout ? "About" : isLegacy ? "Legacy" : defaults.title ?? "")} /><small>The small label above the heading. Leave empty to hide it on the page.</small></label> : null}
    <label className="cms-field"><span>Intro copy</span><textarea name="intro" rows={4} defaultValue={hero?.text ?? ""} /></label>
    <TextStyleFields prefix="pageIntro" value={hero?.textStyle as TextStyleValue | undefined} label="Intro appearance" preserveDefault />
    <div className="cms-grid">
      <label className="cms-field"><span>Feature image</span><AssetUrlField name="image" defaultValue={hero?.image ?? ""} placeholder="/legacy/assets/images/..." specs="Wide landscape, about 2400 × 1200px, under 4 MB." /></label>
    </div>
    {showBody ? <label className="cms-field"><span>Page body</span><textarea name="paragraphs" rows={12} defaultValue={paragraphs} placeholder="Write one paragraph, then leave a blank line before the next." /><small>{isLegal ? "Paragraphs render in the order shown. Start a line with “## ” to make it a section heading on the public page." : "Paragraphs will be rendered in the order shown by the page template."}</small></label> : null}
    {isAbout ? <section className="cms-editor-section"><h2 className="cms-form-heading">About-page sections</h2><h3>Hero buttons and key facts</h3><div className="cms-grid"><label className="cms-field"><span>Main button label</span><input name="aboutHeroCtaLabel" defaultValue={aboutExtras.heroCtaLabel ?? aboutDefaults.heroCtaLabel} /><small>Leave empty to hide the button.</small></label><label className="cms-field"><span>Main button link</span><input name="aboutHeroCtaUrl" defaultValue={aboutExtras.heroCtaUrl ?? aboutDefaults.heroCtaUrl} /></label><label className="cms-field"><span>Second button label</span><input name="aboutHeroSecondaryLabel" defaultValue={aboutExtras.heroSecondaryLabel ?? aboutDefaults.heroSecondaryLabel} /><small>Leave empty to hide the button.</small></label><label className="cms-field"><span>Second button link</span><input name="aboutHeroSecondaryUrl" defaultValue={aboutExtras.heroSecondaryUrl ?? aboutDefaults.heroSecondaryUrl} /><small>Leave empty to open the enquiry form.</small></label></div><label className="cms-field"><span>Key facts</span><textarea name="aboutKeyFacts" rows={4} defaultValue={(aboutExtras.keyFacts ?? aboutDefaults.keyFacts).map((fact) => `${fact.label ?? ""} | ${fact.value ?? ""}`).join("\n")} /><small>One fact per line: label | value. Shown in the row under the hero image (up to four per row). Leave empty to hide the row.</small></label><label className="cms-field"><span>Philosophy caption</span><input name="aboutPhilosophyKicker" defaultValue={aboutExtras.philosophyKicker ?? aboutDefaults.philosophyKicker} /><small>The small label above the about section heading. Leave empty to hide it.</small></label><label className="cms-field"><span>About section heading</span><textarea name="aboutSectionHeading" rows={2} defaultValue={aboutValues.sectionHeading ?? hero?.heading ?? ""} /><small>Shown below the hero. It is independent from the hero heading above.</small></label><TextStyleFields prefix="aboutSectionHeading" value={aboutValues.sectionHeadingStyle as TextStyleValue | undefined} label="Section heading appearance" preserveDefault /><label className="cms-field"><span>Story paragraphs</span><textarea name="paragraphs" rows={12} defaultValue={paragraphs} placeholder="Write one paragraph, then leave a blank line before the next." /><small>The first paragraph sits beside the about heading. Each paragraph after it becomes a value card; write it as “Name, label, is …” (for example “Hinshitsu, quality, is an uncompromising commitment…”) to give the card its title and caption.</small></label><TextStyleFields prefix="aboutStory" value={aboutValues.storyStyle as TextStyleValue | undefined} label="Story text appearance" preserveDefault /><label className="cms-field"><span>Value card captions</span><textarea name="aboutValueCaps" rows={3} defaultValue={(aboutExtras.valueCaps ?? []).join("\n")} placeholder={"01 · Quality\n02 · Peace of mind\n03 · Innovation"} /><small>One line per card, in order, for the small caption above each card title. Leave a line empty to keep the caption taken from the paragraph.</small></label><div className="cms-field"><span>Philosophy image</span><AssetUrlField name="aboutStoryImage" defaultValue={aboutValues.storyImage ?? hero?.image ?? ""} accept="image/*" fileLabel="philosophy section image" specs="Landscape, about 1800 × 1100px, under 4 MB." /><small>The picture beside the philosophy paragraphs. Until it is saved here it follows the hero image above; clear it to show no picture.</small></div><div className="cms-grid"><label className="cms-field"><span>Mission caption</span><input name="aboutMissionKicker" defaultValue={aboutExtras.missionKicker ?? aboutDefaults.missionKicker} /><small>Leave empty to hide it.</small></label><label className="cms-field"><span>Vision caption</span><input name="aboutVisionKicker" defaultValue={aboutExtras.visionKicker ?? aboutDefaults.visionKicker} /><small>Leave empty to hide it.</small></label><label className="cms-field"><span>Mission</span><textarea name="mission" rows={5} defaultValue={aboutValues.mission} /></label><label className="cms-field"><span>Vision</span><textarea name="vision" rows={5} defaultValue={aboutValues.vision} /></label></div><TextStyleFields prefix="aboutMissionVision" value={aboutValues.missionVisionStyle as TextStyleValue | undefined} label="Mission &amp; Vision text appearance" preserveDefault /><h3>Leadership</h3><p className="cms-muted">Mission and Vision: the first sentence (or everything before a blank line) is shown large, the rest below it in grey.</p><div className="cms-grid"><label className="cms-field"><span>Leadership caption</span><input name="aboutLeadershipKicker" defaultValue={aboutExtras.leadershipKicker ?? aboutDefaults.leadershipKicker} /><small>Leave empty to hide it.</small></label><label className="cms-field"><span>Leadership heading</span><textarea name="aboutLeadershipHeading" rows={2} defaultValue={aboutExtras.leadershipHeading ?? aboutDefaults.leadershipHeading} /><small>Use **bold** for the heavy words. Leave empty to hide it.</small></label></div><h3>Chairman</h3><label className="cms-field"><span>Message</span><textarea name="chairmanText" rows={6} defaultValue={aboutValues.chairmanText} /></label><TextStyleFields prefix="aboutChairman" value={aboutValues.chairmanStyle as TextStyleValue | undefined} label="Chairman message appearance" preserveDefault /><div className="cms-grid"><label className="cms-field"><span>Name</span><input name="chairmanName" defaultValue={aboutValues.chairmanName} /></label><label className="cms-field"><span>Role</span><input name="chairmanRole" defaultValue={aboutValues.chairmanRole} /></label><div className="cms-field"><span>Portrait</span><AssetUrlField name="chairmanImage" defaultValue={aboutValues.chairmanImage} accept="image/*" fileLabel="chairman portrait" specs="Portrait 4:5, at least 1200 × 1500px, under 4 MB." /></div></div><h3>Chief Executive Officer</h3><label className="cms-field"><span>Message</span><textarea name="ceoText" rows={6} defaultValue={aboutValues.ceoText ?? aboutDefaults.ceoText} /></label><div className="cms-grid"><label className="cms-field"><span>Name</span><input name="ceoName" defaultValue={aboutValues.ceoName ?? aboutDefaults.ceoName} placeholder="CEO name" /></label><label className="cms-field"><span>Role</span><input name="ceoRole" defaultValue={aboutValues.ceoRole ?? aboutDefaults.ceoRole} /></label><div className="cms-field"><span>Portrait</span><AssetUrlField name="ceoImage" defaultValue={aboutValues.ceoImage ?? aboutDefaults.ceoImage} accept="image/*" fileLabel="CEO portrait" specs="Portrait 4:5, at least 1200 × 1500px, under 4 MB." /></div></div><div className="cms-grid"><label className="cms-field"><span>Team caption</span><input name="aboutTeamKicker" defaultValue={aboutExtras.teamKicker ?? aboutDefaults.teamKicker} /><small>Leave empty to hide it.</small></label><label className="cms-field"><span>Team heading</span><textarea name="aboutTeamHeading" rows={2} defaultValue={aboutExtras.teamHeading ?? aboutDefaults.teamHeading} /></label></div><div className="cms-management-heading"><div><h3>Executive management</h3><p className="cms-muted">Edit each team member separately. Use the upload button to choose their portrait.</p></div><span className="cms-section-count">{management.length} members</span></div><div className="cms-member-list">{management.map((member, index) => <details className="cms-member-card" key={index} open={index === 0}><summary><span className="cms-member-card__thumb" style={member.image ? { backgroundImage: `url(${member.image})` } : undefined} aria-hidden="true" /><span className="cms-member-card__meta"><strong>{member.name || `Team member ${index + 1}`}</strong><small>{member.role || "No role yet"}</small></span><span className="cms-member-card__chevron" aria-hidden="true" /></summary><div className="cms-member-card__body"><div className="cms-grid"><label className="cms-field"><span>Name</span><input name="managementName" value={member.name ?? ""} onChange={(event) => updateManagement(index, { name: event.target.value })} /></label><label className="cms-field"><span>Role</span><input name="managementRole" value={member.role ?? ""} onChange={(event) => updateManagement(index, { role: event.target.value })} /></label></div><label className="cms-field"><span>Biography</span><textarea name="managementBio" rows={4} value={member.bio ?? ""} onChange={(event) => updateManagement(index, { bio: event.target.value })} placeholder="Shown when a visitor opens this member on the public page." /></label><input type="hidden" name="managementImage" value={member.image ?? ""} /><div className="cms-field"><span>Portrait</span><AssetUrlField value={member.image ?? ""} onChange={(image) => updateManagement(index, { image })} accept="image/*" placeholder="Upload a portrait" fileLabel={`portrait for team member ${index + 1}`} hidePreview /></div><div className="cms-actions"><button className="cms-btn cms-btn--ghost cms-btn--small" type="button" onClick={() => moveManagement(index, -1)} disabled={index === 0}>Move up</button><button className="cms-btn cms-btn--ghost cms-btn--small" type="button" onClick={() => moveManagement(index, 1)} disabled={index === management.length - 1}>Move down</button><button className="cms-text-button cms-text-button--danger" type="button" onClick={() => setManagement((members) => members.filter((_, memberIndex) => memberIndex !== index))}>Remove</button></div></div></details>)}</div><button className="cms-btn cms-btn--ghost" type="button" onClick={() => setManagement((members) => [...members, { name: "", role: "", bio: "", image: "" }])}>Add team member</button><h3>Closing band (Experience Centre)</h3><div className="cms-grid"><label className="cms-field"><span>Caption</span><input name="aboutVisitKicker" defaultValue={aboutExtras.visitKicker ?? aboutDefaults.visitKicker} /></label><label className="cms-field"><span>Heading</span><textarea name="aboutVisitHeading" rows={2} defaultValue={aboutExtras.visitHeading ?? aboutDefaults.visitHeading} /><small>Leave empty to hide the whole band.</small></label></div><label className="cms-field"><span>Text</span><textarea name="aboutVisitText" rows={2} defaultValue={aboutExtras.visitText ?? aboutDefaults.visitText} /></label><div className="cms-field"><span>Background image</span><AssetUrlField name="aboutVisitImage" defaultValue={aboutExtras.visitImage ?? aboutDefaults.visitImage} accept="image/*" fileLabel="closing band image" specs="Wide landscape, about 2400 × 1200px, under 4 MB. Shown dimmed behind white text." /></div><div className="cms-grid"><label className="cms-field"><span>Button label (opens the enquiry form)</span><input name="aboutVisitCtaLabel" defaultValue={aboutExtras.visitCtaLabel ?? aboutDefaults.visitCtaLabel} /><small>Leave empty to hide the button.</small></label><label className="cms-field"><span>Second button label</span><input name="aboutVisitLinkLabel" defaultValue={aboutExtras.visitLinkLabel ?? aboutDefaults.visitLinkLabel} /><small>Leave empty to hide the button.</small></label><label className="cms-field"><span>Second button link</span><input name="aboutVisitLinkUrl" defaultValue={aboutExtras.visitLinkUrl ?? aboutDefaults.visitLinkUrl} /></label></div></section> : null}
    {isLegacy ? <section className="cms-editor-section">
      <h2 className="cms-form-heading">History-page sections</h2><p className="cms-muted">The hero uses the Intro copy above; while it is empty, the line below is shown instead. Use **bold** in headings for the heavy words (for example “From Tokyo” on one line, “**to Dubai.**” on the next).</p><label className="cms-field"><span>Hero line (when Intro copy is empty)</span><textarea name="legacyLede" rows={3} defaultValue={legacyExtras.lede ?? legacyGalleryDefaults.lede} /></label><div className="cms-grid"><label className="cms-field"><span>First button label</span><input name="legacyStartLabel" defaultValue={legacyExtras.startLabel ?? legacyGalleryDefaults.startLabel} /><small>Jumps to the first year of the timeline. {"{year}"} becomes that year. Leave empty to hide the button.</small></label><label className="cms-field"><span>Map button label</span><input name="legacyMapLabel" defaultValue={legacyExtras.mapLabel ?? legacyGalleryDefaults.mapLabel} /><small>Opens the End-of-page button link below. Leave empty to hide it.</small></label></div><h3>The name</h3><div className="cms-grid"><label className="cms-field"><span>Caption</span><input name="legacyNameKicker" defaultValue={legacyExtras.nameKicker ?? legacyGalleryDefaults.nameKicker} /><small>Leave empty to hide it.</small></label><label className="cms-field"><span>Heading</span><textarea name="legacyNameHeading" rows={2} defaultValue={legacyExtras.nameHeading ?? legacyGalleryDefaults.nameHeading} /><small>Leave heading and text empty to hide the band.</small></label></div><label className="cms-field"><span>Text</span><textarea name="legacyNameText" rows={5} defaultValue={legacyExtras.nameText ?? legacyGalleryDefaults.nameText} /><small>Leave a blank line between paragraphs; they sit side by side on wide screens.</small></label><h3>Closing band</h3><div className="cms-grid"><label className="cms-field"><span>Caption</span><input name="legacyBandKicker" defaultValue={legacyExtras.bandKicker ?? legacyGalleryDefaults.bandKicker} /></label><label className="cms-field"><span>Heading</span><textarea name="legacyBandHeading" rows={2} defaultValue={legacyExtras.bandHeading ?? legacyGalleryDefaults.bandHeading} /><small>Leave empty to hide the whole band.</small></label></div><label className="cms-field"><span>Text</span><textarea name="legacyBandText" rows={2} defaultValue={legacyExtras.bandText ?? legacyGalleryDefaults.bandText} /></label><div className="cms-field"><span>Background image</span><AssetUrlField name="legacyBandImage" defaultValue={legacyExtras.bandImage ?? legacyGalleryDefaults.bandImage} accept="image/*" fileLabel="closing band image" specs="Wide landscape, about 2400 × 1200px, under 4 MB. Shown dimmed behind white text." /></div><div className="cms-grid"><label className="cms-field"><span>Second button label</span><input name="legacyBandLinkLabel" defaultValue={legacyExtras.bandLinkLabel ?? legacyGalleryDefaults.bandLinkLabel} /><small>The first button is the End-of-page button below. Leave empty to hide this one.</small></label><label className="cms-field"><span>Second button link</span><input name="legacyBandLinkUrl" defaultValue={legacyExtras.bandLinkUrl ?? legacyGalleryDefaults.bandLinkUrl} /></label></div>
      <h2 className="cms-form-heading">End-of-page button</h2>
      <p className="cms-muted">The white button in the closing band. Its link also drives the “Explore the map” button in the hero. Switch it on, give it text and a link.</p>
      <div className="cms-grid">
        <label className="cms-check"><input type="checkbox" name="legacyCtaVisible" defaultChecked={legacy?.ctaVisible !== false} /><span><strong>Show button</strong><small>Hidden until a link is set, even when ticked.</small></span></label>
        <label className="cms-field"><span>Button text</span><input name="legacyCtaLabel" defaultValue={legacy?.ctaLabel ?? ""} placeholder="Learn more" /></label>
        <label className="cms-field"><span>Button link</span><input name="legacyCtaUrl" defaultValue={legacy?.ctaUrl ?? "https://map.kasumigaseki.ae/"} placeholder="https://…" /></label>
      </div>
      <h2 className="cms-form-heading">Legacy timeline</h2>
      <p className="cms-muted">One row per milestone, in order. The year bar and the large year beside the timeline are built from the years. Any number of milestones is supported.</p>
      <input type="hidden" name="legacyTimelineJson" value={JSON.stringify(timeline)} />
      <ListEditor items={timeline} onChange={setTimeline} newItem={() => ({ year: "", title: "", summary: "", body: "", image: "" })} addLabel="Add milestone"
        itemLabel={(item, index) => `Milestone ${index + 1}${item.year ? ` — ${item.year}` : ""}`}
        renderItem={(item, update, index) => <>
          <div className="cms-milestone-head">
            <label className="cms-field"><span>Year</span><input value={item.year ?? ""} onChange={(event) => update({ year: event.target.value })} placeholder="2014" /></label>
            <label className="cms-field"><span>Title</span><input value={item.title ?? ""} onChange={(event) => update({ title: event.target.value })} /></label>
          </div>
          <label className="cms-field"><span>Summary (shown while collapsed)</span><textarea rows={3} value={item.summary ?? ""} onChange={(event) => update({ summary: event.target.value })} /></label>
          <label className="cms-field"><span>Full text (shown when expanded)</span><textarea rows={5} value={item.body ?? ""} onChange={(event) => update({ body: event.target.value })} /></label>
          <div className="cms-field"><span>Image</span><AssetUrlField value={item.image ?? ""} onChange={(image) => update({ image })} accept="image/*" placeholder="/legacy/assets/images/…" fileLabel={`milestone ${index + 1} image`} specs="Portrait or square, about 900 × 1100px, under 4 MB." /></div>
        </>} />
    </section> : null}
    {isLegal ? <section className="cms-editor-section">
      <h2 className="cms-form-heading">Questions block</h2>
      <p className="cms-muted">The box at the end of this page. Leave a field empty to keep the standard wording.</p>
      <div className="cms-grid">
        <label className="cms-field"><span>Heading</span><input name="legalContactHeading" defaultValue={legalContactSaved?.heading ?? legalContact.heading} /></label>
        <label className="cms-field"><span>Email</span><input name="legalContactEmail" type="email" defaultValue={legalContactSaved?.email ?? legalContact.email} /></label>
      </div>
      <label className="cms-field"><span>Text</span><textarea name="legalContactText" rows={2} defaultValue={legalContactSaved?.text ?? legalContact.text} /></label>
    </section> : null}
    {defaults?.slug === "contact" ? <section className="cms-editor-section">
      <h2 className="cms-form-heading">Page wording</h2>
      <p className="cms-muted">The address card, the form heading, the checkboxes and the send button. The phone number and email come from Site settings. In the checkbox texts, write a link as [Privacy Policy](/privacy-policy). Leave a field empty to go back to the standard wording.</p>
      <div className="cms-grid">
        <label className="cms-field"><span>Form heading</span><input name="contactFormHeading" defaultValue={contactForm.formHeading} /></label>
        <label className="cms-field"><span>Send button</span><input name="contactSubmitLabel" defaultValue={contactForm.submitLabel} /></label>
        <label className="cms-field"><span>Address caption</span><input name="contactAddressLabel" defaultValue={contactForm.addressLabel} /></label>
        <label className="cms-field"><span>Address</span><textarea name="contactAddress" rows={3} defaultValue={contactForm.address} /></label>
        <label className="cms-field"><span>Directions button</span><input name="contactDirectionsLabel" defaultValue={contactForm.directionsLabel} /></label>
        <label className="cms-field"><span>Directions link</span><input name="contactDirectionsUrl" defaultValue={contactForm.directionsUrl} /></label>
        <label className="cms-field"><span>Call button (card)</span><input name="contactCallLabel" defaultValue={contactForm.callLabel} /></label>
        <label className="cms-field"><span>Call caption (top of page)</span><input name="contactQuickCallLabel" defaultValue={contactForm.quickCallLabel} /></label>
        <label className="cms-field"><span>Email caption (top of page)</span><input name="contactQuickEmailLabel" defaultValue={contactForm.quickEmailLabel} /></label>
        <label className="cms-field"><span>Terms checkbox text</span><textarea name="contactTermsText" rows={3} defaultValue={contactForm.termsText} /></label>
        <label className="cms-field"><span>Marketing checkbox text</span><textarea name="contactMarketingText" rows={3} defaultValue={contactForm.marketingText} /></label>
      </div>
      <h2 className="cms-form-heading">Inquiry form</h2>
      <p className="cms-muted">These labels, choices and message prompts control the form on the Contact page. Put one choice on each line.</p>
      <div className="cms-grid">
        <label className="cms-field"><span>Sales tab</span><input name="contactSalesLabel" defaultValue={contactForm.salesLabel} /></label>
        <label className="cms-field"><span>Customer tab</span><input name="contactCustomerLabel" defaultValue={contactForm.customerLabel} /></label>
        <label className="cms-field"><span>Channel partner tab</span><input name="contactChannelLabel" defaultValue={contactForm.channelLabel} /></label>
        <label className="cms-field"><span>Job tab</span><input name="contactJobLabel" defaultValue={contactForm.jobLabel} /></label>
        <label className="cms-field"><span>Press tab</span><input name="contactPressLabel" defaultValue={contactForm.pressLabel} /></label>
      </div>
      <div className="cms-grid">
        <label className="cms-field"><span>Sales projects</span><textarea name="contactSalesProjects" rows={5} defaultValue={contactForm.salesProjects.join("\n")} /></label>
        <label className="cms-field"><span>Customer projects</span><textarea name="contactCustomerProjects" rows={5} defaultValue={contactForm.customerProjects.join("\n")} /></label>
        <label className="cms-field"><span>Customer inquiry types</span><textarea name="contactCustomerNatures" rows={5} defaultValue={contactForm.customerNatures.join("\n")} /></label>
      </div>
      <div className="cms-grid">
        <label className="cms-field"><span>Sales message prompt</span><textarea name="contactSalesMessagePrompt" rows={3} defaultValue={contactForm.salesMessagePrompt} /></label>
        <label className="cms-field"><span>Customer message prompt</span><textarea name="contactCustomerMessagePrompt" rows={3} defaultValue={contactForm.customerMessagePrompt} /></label>
        <label className="cms-field"><span>Channel partner message prompt</span><textarea name="contactChannelMessagePrompt" rows={3} defaultValue={contactForm.channelMessagePrompt} /></label>
        <label className="cms-field"><span>Job message prompt</span><textarea name="contactJobMessagePrompt" rows={3} defaultValue={contactForm.jobMessagePrompt} /></label>
        <label className="cms-field"><span>Press message prompt</span><textarea name="contactPressMessagePrompt" rows={3} defaultValue={contactForm.pressMessagePrompt} /></label>
      </div>
    </section> : null}
    {seo ? <SeoFields defaults={seo} /> : null}
    <div className="cms-save-row"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save page"}</button>{isLegal || isAbout || isLegacy || defaults?.slug === "contact" ? <button className="cms-btn cms-btn--outline" type="button" onClick={previewUnsaved} disabled={previewing}>{previewing ? "Opening preview…" : "Preview with unsaved changes ↗"}</button> : null}{previewError ? <span className="cms-error">{previewError}</span> : null}</div>
  </form>;
}
