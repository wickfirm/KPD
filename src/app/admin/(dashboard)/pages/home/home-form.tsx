"use client";

import { useActionState, useRef, useState } from "react";
import { previewHomeDraft, saveHomeSettings, type SiteSettingsFormState } from "../../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";
import { ListEditor } from "@/components/admin/list-editor";
import { SeoFields, type SeoFieldDefaults } from "@/components/admin/seo-fields";
import { type BannerSlide, type HomeSettings, type StatItem } from "@/lib/home-defaults";
import { TextStyleFields } from "@/components/admin/text-style-fields";

export type { HomeSettings };
const initialState: SiteSettingsFormState = {};
const IMAGES = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";

/// Homepage editor: the values below are the only source of editable homepage
/// content. Blank and empty lists deliberately remain blank when saved.
export default function HomeForm({ settings, seo }: { settings: HomeSettings; seo?: SeoFieldDefaults }) {
  const [state, formAction, pending] = useActionState(saveHomeSettings, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  /// Opens the admin preview with the page exactly as it currently looks here,
  /// saved or not. The tab opens straight away (a click-triggered open is never
  /// blocked) and is pointed at the preview once the draft is stored.
  async function previewUnsaved() {
    if (!formRef.current) return;
    setPreviewing(true); setPreviewError("");
    const tab = window.open("about:blank", "_blank");
    try {
      const result = await previewHomeDraft(new FormData(formRef.current));
      if (result.error) throw new Error(result.error);
      const target = "/admin/preview/home?draft=1";
      if (tab) tab.location.href = target; else window.location.assign(target);
    } catch (error) {
      tab?.close();
      setPreviewError(error instanceof Error ? error.message : "Unable to build the preview.");
    } finally { setPreviewing(false); }
  }
  const [experienceImages, setExperienceImages] = useState(settings.experienceImages ?? []);
  const [experienceCaptions, setExperienceCaptions] = useState(settings.experienceCaptions ?? []);
  const [stats, setStats] = useState<StatItem[]>(() => settings.introStats ?? []);
  const [slides, setSlides] = useState<BannerSlide[]>(() => settings.bannerSlides ?? []);
  return <form ref={formRef} action={formAction}>{state.error ? <p className="cms-error">{state.error}</p> : null}
    <h2 className="cms-form-heading">Hero video</h2>
    <AssetUrlField name="heroVideo" defaultValue={settings.heroVideo ?? ""} accept="video/mp4" placeholder="https://…" fileLabel="hero video" />
    <h2 className="cms-form-heading">Introduction</h2>
    <label className="cms-field"><span>Introduction heading</span><textarea name="introHeading" rows={2} defaultValue={settings.introHeading ?? ""} /><small>Line breaks render on the public page exactly as typed.</small></label>
    <TextStyleFields prefix="introHeading" value={settings.introHeadingStyle} label="Introduction heading appearance" preserveDefault />
    <label className="cms-field"><span>Introduction paragraphs</span><textarea name="introParagraphs" rows={6} defaultValue={(settings.introParagraphs ?? []).join("\n\n")} /><small>Separate paragraphs with a blank line.</small></label>
    <TextStyleFields prefix="introBody" value={settings.introBodyStyle} label="Introduction text appearance" preserveDefault />
    <section className="cms-editor-section">
      <h3>Key figures</h3>
      <p className="cms-muted">The figures strip under the introduction. Each figure links to the About page.</p>
      <input type="hidden" name="introStatsJson" value={JSON.stringify(stats)} />
      <ListEditor items={stats} onChange={setStats} newItem={() => ({ value: "", label: "" })} addLabel="Add figure" itemLabel={(item, index) => `Figure ${index + 1}${item.label ? ` — ${item.label}` : ""}`}
        renderItem={(item, update) => <div className="cms-grid">
          <label className="cms-field"><span>Value</span><input value={item.value} onChange={(event) => update({ value: event.target.value })} placeholder="$4.4B" /></label>
          <label className="cms-field"><span>Label</span><input value={item.label} onChange={(event) => update({ label: event.target.value })} placeholder="Global AUM" /></label>
        </div>} />
      <label className="cms-field"><span>Note under the figures</span><input name="statsNote" defaultValue={settings.statsNote ?? ""} /><small>For example the “as of” date. Leave empty to hide it.</small></label>
    </section>
    <h2 className="cms-form-heading">Developments image</h2>
    <label className="cms-field"><span>Developments heading</span><textarea name="developmentHeading" rows={2} defaultValue={settings.developmentHeading ?? ""} /><small>Line breaks render on the public page exactly as typed.</small></label>
    <label className="cms-field"><span>Heading placement</span><select name="developmentHeadingPosition" defaultValue={settings.developmentHeadingPosition ?? "overlay"}><option value="overlay">Over the image</option><option value="above">Above the image</option><option value="below">Below the image</option></select><small>Above and below sit outside the picture. Over keeps the heading on the picture.</small></label>
    <TextStyleFields prefix="developmentHeading" value={settings.developmentHeadingStyle} label="Developments heading appearance" preserveDefault />
    <div className="cms-grid"><label className="cms-check"><input type="checkbox" name="developmentCtaVisible" defaultChecked={settings.developmentCtaVisible !== false} /><span><strong>Show button</strong><small>Controls the button on the developments image.</small></span></label><label className="cms-field"><span>Button label</span><input name="developmentCtaLabel" defaultValue={settings.developmentCtaLabel ?? "View all developments"} /></label><label className="cms-field"><span>Button link</span><input name="developmentCtaUrl" defaultValue={settings.developmentCtaUrl ?? "/#development-cards"} /></label></div>
    <section className="cms-editor-section">
      <h3>Banner slides</h3>
      <p className="cms-muted">The full-width image slider above the cards. The first slide shows on load.</p>
      <input type="hidden" name="bannerSlidesJson" value={JSON.stringify(slides)} />
      <ListEditor items={slides} onChange={setSlides} newItem={() => ({ image: "", label: "" })} addLabel="Add slide" itemLabel={(item, index) => `Slide ${index + 1}${item.label ? ` — ${item.label}` : ""}`}
        renderItem={(item, update, index) => <>
          <label className="cms-field"><span>Name (for screen readers)</span><input value={item.label} onChange={(event) => update({ label: event.target.value })} placeholder="Seven X Seven" /></label>
          <div className="cms-field"><span>Image</span><AssetUrlField value={item.image} onChange={(image) => update({ image })} accept={IMAGES} placeholder="https://…" fileLabel={`slide ${index + 1} image`} /></div>
        </>} />
    </section>
    <section className="cms-editor-section">
      <h3>Paragraph with the image</h3>
      <label className="cms-check"><input type="checkbox" name="developmentTextVisible" defaultChecked={settings.developmentTextVisible === true} /> <span><strong>Show this paragraph</strong><small>Untick to remove it from the page.</small></span></label>
      <label className="cms-field"><span>Placement</span><select name="developmentTextPosition" defaultValue={settings.developmentTextPosition ?? "below"}><option value="below">Below the image</option><option value="above">Above the image</option></select><small>Above sits between the introduction and the developments picture. Below sits under the picture, before the cards.</small></label>
      <label className="cms-field"><span>Paragraph</span><textarea name="developmentText" rows={3} defaultValue={settings.developmentText ?? ""} /></label>
      <TextStyleFields prefix="developmentText" value={settings.developmentTextStyle} label="Paragraph appearance" preserveDefault />
    </section>
    <section className="cms-editor-section"><h3>Development cards</h3><p className="cms-muted">Generated automatically from the first three published, public developments. Their name, introduction, hero image and ordering come from each Development editor; drafting or archiving one removes it here immediately. One or two cards stretch to fill the row.</p>
      <div className="cms-grid"><label className="cms-check"><input type="checkbox" name="cardCtaVisible" defaultChecked={settings.cardCtaVisible !== false} /><span><strong>Show the card button</strong><small>The card still opens the development. This only shows or hides the label.</small></span></label><label className="cms-field"><span>Card button label</span><input name="cardCtaLabel" defaultValue={settings.cardCtaLabel ?? "Explore"} /></label></div>
    </section>
    <h2 className="cms-form-heading">Contact strip</h2>
    <div className="cms-grid">
      <label className="cms-field"><span>Contact heading</span><textarea name="contactHeading" rows={2} defaultValue={settings.contactHeading ?? ""} /><small>Line breaks render on the public page exactly as typed.</small></label>
      <label className="cms-field"><span>Contact copy</span><textarea name="contactText" rows={3} defaultValue={settings.contactText ?? ""} /></label>
    </div>
    <TextStyleFields prefix="contactHeading" value={settings.contactHeadingStyle} label="Contact heading appearance" preserveDefault />
    <TextStyleFields prefix="contactBody" value={settings.contactBodyStyle} label="Contact text appearance" preserveDefault />
    <div className="cms-grid"><label className="cms-check"><input type="checkbox" name="contactCtaVisible" defaultChecked={settings.contactCtaVisible !== false} /><span><strong>Show button</strong><small>Controls the contact-strip button.</small></span></label><label className="cms-field"><span>Button label</span><input name="contactCtaLabel" defaultValue={settings.contactCtaLabel ?? "Book a visit"} /></label><label className="cms-field"><span>Button link</span><input name="contactCtaUrl" defaultValue={settings.contactCtaUrl ?? "/contact#experience-center"} /></label></div>
    <section className="cms-editor-section">
      <h3>Experience Center gallery</h3>
      <p className="cms-muted">The gallery appears only when it has exactly five CMS images. Captions are editable per image.</p>
      <input type="hidden" name="experienceImages" value={experienceImages.join("\n")} />
      <input type="hidden" name="experienceCaptions" value={experienceCaptions.join("\n")} />
      {experienceImages.map((image, index) => <div className="cms-repeat-card" key={`${image}-${index}`}>
        <div className="cms-repeat-card__head"><strong>Gallery image {index + 1}</strong><button className="cms-text-button cms-text-button--danger" type="button" onClick={() => { setExperienceImages((images) => images.filter((_, i) => i !== index)); setExperienceCaptions((captions) => captions.filter((_, i) => i !== index)); }}>Remove</button></div>
        <AssetUrlField value={image} onChange={(next) => setExperienceImages((images) => images.map((value, i) => (i === index ? next : value)))} accept={IMAGES} placeholder="https://…" fileLabel={`gallery image ${index + 1}`} />
        <label className="cms-field"><span>Caption</span><input value={experienceCaptions[index] ?? ""} onChange={(event) => setExperienceCaptions((captions) => { const next = [...captions]; next[index] = event.target.value; return next; })} /></label>
      </div>)}
      <button className="cms-btn cms-btn--ghost" type="button" onClick={() => { setExperienceImages((images) => [...images, ""]); setExperienceCaptions((captions) => [...captions, ""]); }} disabled={experienceImages.length >= 5}>Add gallery image</button>
    </section>
    <h2 className="cms-form-heading">News & insights</h2>
    <p className="cms-muted">This band is the last block on the homepage, after the Experience Center gallery.</p>
    <label className="cms-field"><span>Heading</span><textarea name="newsHeading" rows={2} defaultValue={settings.newsHeading ?? ""} /><small>Line breaks render on the public page exactly as typed.</small></label>
    <TextStyleFields prefix="newsHeading" value={settings.newsHeadingStyle} label="News heading appearance" preserveDefault />
    <label className="cms-field"><span>Supporting text</span><textarea name="newsText" rows={3} defaultValue={settings.newsText ?? ""} /></label>
    <TextStyleFields prefix="newsBody" value={settings.newsBodyStyle} label="News text appearance" preserveDefault />
    <div className="cms-grid"><label className="cms-check"><input type="checkbox" name="newsCtaVisible" defaultChecked={settings.newsCtaVisible !== false} /><span><strong>Show button</strong><small>Controls the news button.</small></span></label><label className="cms-field"><span>Button text</span><input name="newsCta" defaultValue={settings.newsCta ?? "Read News & Insights"} /></label><label className="cms-field"><span>Button link</span><input name="newsCtaUrl" defaultValue={settings.newsCtaUrl ?? "/news"} /></label></div>
    <SeoFields defaults={seo} />
    <div className="cms-actions cms-save-row"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save homepage"}</button><button className="cms-btn cms-btn--outline" type="button" onClick={previewUnsaved} disabled={previewing}>{previewing ? "Opening preview…" : "Preview with unsaved changes ↗"}</button>{previewError ? <span className="cms-error">{previewError}</span> : null}</div>
  </form>;
}
