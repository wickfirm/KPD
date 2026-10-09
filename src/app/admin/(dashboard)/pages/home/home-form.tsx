"use client";

import { useActionState, useState } from "react";
import { saveHomeSettings, type SiteSettingsFormState } from "../../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";
import { ListEditor } from "@/components/admin/list-editor";
import { homeDefaults, type BannerSlide, type DevelopmentCard, type HomeSettings, type StatItem } from "@/lib/home-defaults";

export type { HomeSettings };
const initialState: SiteSettingsFormState = {};
const IMAGES = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";

/// Homepage editor: every section of the public homepage that is managed from
/// the CMS. Lists show the delivered content until you save your own, exactly
/// like the public page does.
export default function HomeForm({ settings, projectLinks = [] }: { settings: HomeSettings; projectLinks?: { href: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(saveHomeSettings, initialState);
  const [experienceImages, setExperienceImages] = useState(settings.experienceImages ?? []);
  const [stats, setStats] = useState<StatItem[]>(() => (settings.introStats?.length ? settings.introStats : homeDefaults.introStats));
  const [slides, setSlides] = useState<BannerSlide[]>(() => (settings.bannerSlides?.length ? settings.bannerSlides : homeDefaults.bannerSlides));
  const [cards, setCards] = useState<DevelopmentCard[]>(() => (settings.developmentCards?.length ? settings.developmentCards : homeDefaults.developmentCards));
  return <form action={formAction}>{state.error ? <p className="cms-error">{state.error}</p> : null}
    <datalist id="home-project-links">{projectLinks.map((link) => <option key={link.href} value={link.href}>{link.name}</option>)}</datalist>
    <h2 className="cms-form-heading">Hero video</h2>
    <AssetUrlField name="heroVideo" defaultValue={settings.heroVideo ?? ""} accept="video/mp4" placeholder="https://…" fileLabel="hero video" />
    <h2 className="cms-form-heading">Introduction</h2>
    <label className="cms-field"><span>Introduction heading</span><input name="introHeading" defaultValue={settings.introHeading ?? ""} /></label>
    <label className="cms-field"><span>Introduction paragraphs</span><textarea name="introParagraphs" rows={6} defaultValue={(settings.introParagraphs ?? []).join("\n\n")} /><small>Separate paragraphs with a blank line.</small></label>
    <section className="cms-editor-section">
      <h3>Key figures</h3>
      <p className="cms-muted">The figures strip under the introduction. Each figure links to the About page.</p>
      <input type="hidden" name="introStatsJson" value={JSON.stringify(stats)} />
      <ListEditor items={stats} onChange={setStats} newItem={() => ({ value: "", label: "" })} addLabel="Add figure" itemLabel={(item, index) => `Figure ${index + 1}${item.label ? ` — ${item.label}` : ""}`}
        renderItem={(item, update) => <div className="cms-grid">
          <label className="cms-field"><span>Value</span><input value={item.value} onChange={(event) => update({ value: event.target.value })} placeholder="$4.4B" /></label>
          <label className="cms-field"><span>Label</span><input value={item.label} onChange={(event) => update({ label: event.target.value })} placeholder="Global AUM" /></label>
        </div>} />
      <label className="cms-field"><span>Note under the figures</span><input name="statsNote" defaultValue={settings.statsNote ?? homeDefaults.statsNote} /><small>For example the “as of” date. Leave empty to hide it.</small></label>
    </section>
    <h2 className="cms-form-heading">Developments section</h2>
    <label className="cms-field"><span>Developments heading</span><input name="developmentHeading" defaultValue={settings.developmentHeading ?? ""} /></label>
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
      <h3>Development cards</h3>
      <p className="cms-muted">One card per development shown under the slider. Link a card to a development page, for example <code>/developments/your-project</code>.</p>
      <input type="hidden" name="developmentCardsJson" value={JSON.stringify(cards)} />
      <ListEditor items={cards} onChange={setCards} newItem={() => ({ href: "", image: "", title: "", copy: "" })} addLabel="Add card" itemLabel={(item, index) => `Card ${index + 1}${item.title ? ` — ${item.title}` : ""}`}
        renderItem={(item, update, index) => <>
          <div className="cms-grid">
            <label className="cms-field"><span>Title</span><input value={item.title} onChange={(event) => update({ title: event.target.value })} /></label>
            <label className="cms-field"><span>Link</span><input list="home-project-links" value={item.href} onChange={(event) => update({ href: event.target.value })} placeholder="/developments/…" /></label>
          </div>
          <label className="cms-field"><span>Description</span><textarea rows={3} value={item.copy} onChange={(event) => update({ copy: event.target.value })} /></label>
          <div className="cms-field"><span>Image</span><AssetUrlField value={item.image} onChange={(image) => update({ image })} accept={IMAGES} placeholder="https://…" fileLabel={`card ${index + 1} image`} /></div>
        </>} />
    </section>
    <h2 className="cms-form-heading">Contact strip</h2>
    <div className="cms-grid">
      <label className="cms-field"><span>Contact heading</span><input name="contactHeading" defaultValue={settings.contactHeading ?? ""} /></label>
      <label className="cms-field"><span>Contact copy</span><textarea name="contactText" rows={3} defaultValue={settings.contactText ?? ""} /></label>
    </div>
    <section className="cms-editor-section">
      <h3>Experience Center gallery</h3>
      <p className="cms-muted">The delivered design uses exactly five panels. Add or arrange all five images here to replace them.</p>
      <input type="hidden" name="experienceImages" value={experienceImages.join("\n")} />
      {experienceImages.map((image, index) => <div className="cms-repeat-card" key={`${image}-${index}`}>
        <div className="cms-repeat-card__head"><strong>Gallery image {index + 1}</strong><button className="cms-text-button cms-text-button--danger" type="button" onClick={() => setExperienceImages((images) => images.filter((_, i) => i !== index))}>Remove</button></div>
        <AssetUrlField value={image} onChange={(next) => setExperienceImages((images) => images.map((value, i) => (i === index ? next : value)))} accept={IMAGES} placeholder="https://…" fileLabel={`gallery image ${index + 1}`} />
      </div>)}
      <button className="cms-btn cms-btn--ghost" type="button" onClick={() => setExperienceImages((images) => [...images, ""])} disabled={experienceImages.length >= 5}>Add gallery image</button>
    </section>
    <div className="cms-actions cms-save-row"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save homepage"}</button></div>
  </form>;
}
