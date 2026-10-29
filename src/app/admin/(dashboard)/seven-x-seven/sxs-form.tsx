"use client";

import { useActionState, useRef, useState } from "react";
import { AssetUrlField } from "@/components/admin/asset-url-field";
import { ListEditor } from "@/components/admin/list-editor";
import type { SxsContent } from "@/lib/sxs-content";
import { previewSxsDraft, saveSxsPage, type SxsFormState } from "./actions";

type Media = { src: string; alt: string; label?: string; position?: string };
type NavItem = { label: string; anchor: string };
type Place = { name: string; minutes: string; lat: number; lng: number; reveal: number };
type Milestone = { percent: number; title: string; detail: string; phase: "calendar" | "construction" | "handover" };
type LegendRow = { number: string; name: string; size: string };
type Plan = {
  image: string; alt: string; title: string; unit: string;
  totalSqft: string; totalSqm: string; suiteSqft: string; suiteSqm: string; balconySqft: string; balconySqm: string;
  legend: LegendRow[];
};

const initial: SxsFormState = {};
const asRecord = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const asText = (value: unknown) => typeof value === "string" ? value : "";
const asMedia = (value: unknown): Media[] => Array.isArray(value) ? value.flatMap((item) => {
  const row = asRecord(item);
  return typeof row.src === "string" ? [{ src: row.src, alt: asText(row.alt), label: asText(row.label), position: asText(row.position) }] : [];
}) : [];
const asLegend = (value: unknown): LegendRow[] => Array.isArray(value) ? value.flatMap((item) => {
  if (Array.isArray(item)) return [{ number: String(item[0] ?? ""), name: String(item[1] ?? ""), size: String(item[2] ?? "") }];
  const row = asRecord(item);
  return [{ number: asText(row.number), name: asText(row.name), size: asText(row.size) }];
}) : [];

function planOf(value: unknown): Plan {
  const row = asRecord(value);
  return {
    image: asText(row.image), alt: asText(row.alt), title: asText(row.title), unit: asText(row.unit),
    totalSqft: asText(row.totalSqft), totalSqm: asText(row.totalSqm), suiteSqft: asText(row.suiteSqft), suiteSqm: asText(row.suiteSqm),
    balconySqft: asText(row.balconySqft), balconySqm: asText(row.balconySqm), legend: asLegend(row.legend),
  };
}

export default function SxsForm({ content }: { content: SxsContent }) {
  const [state, action, pending] = useActionState(saveSxsPage, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [navigation, setNavigation] = useState<NavItem[]>(() => Array.isArray(content.navigation.items) ? content.navigation.items as NavItem[] : []);
  const [heroGallery, setHeroGallery] = useState<Media[]>(() => asMedia(content.hero.gallery));
  const [apartments, setApartments] = useState<Media[]>(() => asMedia(content.apartments.gallery));
  const [gallery, setGallery] = useState<Media[]>(() => asMedia(content.gallery.gallery));
  const [amenities, setAmenities] = useState<Media[]>(() => asMedia(content.amenities.items));
  const [community, setCommunity] = useState<Media[]>(() => asMedia(content.community.slides));
  const [places, setPlaces] = useState<Place[]>(() => Array.isArray(content.location.places) ? content.location.places as Place[] : []);
  const [milestones, setMilestones] = useState<Milestone[]>(() => Array.isArray(content.payment.milestones) ? content.payment.milestones as Milestone[] : []);
  const plans = asRecord(content.floorplans.plans);
  const [one, setOne] = useState<Plan>(() => planOf(plans.one));
  const [two, setTwo] = useState<Plan>(() => planOf(plans.two));
  const [three, setThree] = useState<Plan>(() => planOf(plans.three));

  async function preview() {
    if (!formRef.current) return;
    setPreviewing(true); setPreviewError("");
    const tab = window.open("about:blank", "_blank");
    try {
      await previewSxsDraft(new FormData(formRef.current));
      const target = "/admin/preview/seven-x-seven";
      if (tab) tab.location.href = target; else window.location.assign(target);
    } catch (error) {
      tab?.close();
      setPreviewError(error instanceof Error ? error.message : "Unable to build the preview.");
    } finally { setPreviewing(false); }
  }

  return <form ref={formRef} action={action}>
    {state.error ? <p className="cms-error">{state.error}</p> : null}
    {previewError ? <p className="cms-error">{previewError}</p> : null}
    <input type="hidden" name="navigationJson" value={JSON.stringify(navigation)} />
    <input type="hidden" name="heroGalleryJson" value={JSON.stringify(heroGallery)} />
    <input type="hidden" name="apartmentGalleryJson" value={JSON.stringify(apartments)} />
    <input type="hidden" name="exteriorGalleryJson" value={JSON.stringify(gallery)} />
    <input type="hidden" name="amenityJson" value={JSON.stringify(amenities)} />
    <input type="hidden" name="communityJson" value={JSON.stringify(community)} />
    <input type="hidden" name="placesJson" value={JSON.stringify(places)} />
    <input type="hidden" name="milestonesJson" value={JSON.stringify(milestones)} />
    <input type="hidden" name="plansJson" value={JSON.stringify({ one, two, three })} />

    <section className="cms-editor-section">
      <h2 className="cms-form-heading">Search appearance</h2>
      <div className="cms-grid">
        <label className="cms-field"><span>Title</span><input name="seoTitle" defaultValue={asText(content.seo.title)} maxLength={60} /></label>
        <label className="cms-field"><span>Description</span><textarea name="seoDescription" rows={3} defaultValue={asText(content.seo.description)} maxLength={160} /></label>
      </div>
    </section>

    <section className="cms-editor-section">
      <h2 className="cms-form-heading">Menu</h2>
      <ListEditor items={navigation} onChange={setNavigation} addLabel="Add menu item" newItem={() => ({ label: "", anchor: "" })} itemLabel={(item, index) => item.label || `Item ${index + 1}`}
        renderItem={(item, update) => <div className="cms-grid"><label className="cms-field"><span>Label</span><input value={item.label} onChange={(event) => update({ label: event.target.value })} /></label><label className="cms-field"><span>Section id</span><input value={item.anchor} onChange={(event) => update({ anchor: event.target.value })} /></label></div>} />
    </section>

    <section className="cms-editor-section">
      <h2 className="cms-form-heading">Hero</h2>
      <div className="cms-grid">
        <label className="cms-field"><span>Kicker</span><input name="heroEyebrow" defaultValue={asText(content.hero.eyebrow)} /></label>
        <label className="cms-field"><span>Headline</span><input name="heroHeadline" defaultValue={asText(content.hero.headline)} /></label>
      </div>
      <label className="cms-field"><span>Introduction</span><textarea name="heroBody" rows={3} defaultValue={asText(content.hero.body)} /></label>
      <div className="cms-field"><span>Hero video</span><AssetUrlField name="heroMedia" defaultValue={asText(content.hero.media)} accept="video/mp4,video/webm" fileLabel="hero video" /></div>
      <ListEditor items={heroGallery} onChange={setHeroGallery} addLabel="Add hero image" newItem={() => ({ src: "", alt: "", position: "center" })} itemLabel={(item, index) => item.alt || `Image ${index + 1}`}
        renderItem={(item, update) => <><div className="cms-field"><span>Image</span><AssetUrlField value={item.src} onChange={(src) => update({ src })} accept="image/*" fileLabel="hero image" /></div><div className="cms-grid"><label className="cms-field"><span>Alt text</span><input value={item.alt} onChange={(event) => update({ alt: event.target.value })} /></label><label className="cms-field"><span>Position</span><input value={item.position} onChange={(event) => update({ position: event.target.value })} /></label></div></>} />
    </section>

    <section className="cms-editor-section">
      <h2 className="cms-form-heading">The residences</h2>
      <label className="cms-field"><span>Headline</span><input name="aboutHeadline" defaultValue={asText(content.about.headline)} /></label>
      <label className="cms-field"><span>Body</span><textarea name="aboutBody" rows={4} defaultValue={asText(content.about.body)} /></label>
      <div className="cms-field"><span>Image</span><AssetUrlField name="aboutMedia" defaultValue={asText(content.about.media)} accept="image/*" fileLabel="residences image" /></div>
      <label className="cms-field"><span>Manifesto</span><textarea name="manifestoBody" rows={3} defaultValue={asText(content.manifesto.body)} /></label>
    </section>

    <section className="cms-editor-section">
      <h2 className="cms-form-heading">Interiors</h2>
      <label className="cms-field"><span>Headline</span><input name="apartmentsHeadline" defaultValue={asText(content.apartments.headline)} /></label>
      <label className="cms-field"><span>Body</span><textarea name="apartmentsBody" rows={3} defaultValue={asText(content.apartments.body)} /></label>
      <div className="cms-grid">
        <div className="cms-field"><span>Opening image</span><AssetUrlField name="apartmentOne" defaultValue={asText(content.apartments.imageOne)} accept="image/*" fileLabel="opening interior" /></div>
        <div className="cms-field"><span>Second image</span><AssetUrlField name="apartmentTwo" defaultValue={asText(content.apartments.imageTwo)} accept="image/*" fileLabel="second interior" /></div>
        <div className="cms-field"><span>Closing image</span><AssetUrlField name="apartmentTen" defaultValue={asText(content.apartments.imageTen)} accept="image/*" fileLabel="closing interior" /></div>
      </div>
      <ListEditor items={apartments} onChange={setApartments} addLabel="Add interior image" newItem={() => ({ src: "", alt: "" })} itemLabel={(item, index) => item.alt || `Interior ${index + 1}`}
        renderItem={(item, update) => <><div className="cms-field"><span>Image</span><AssetUrlField value={item.src} onChange={(src) => update({ src })} accept="image/*" fileLabel="interior" /></div><label className="cms-field"><span>Alt text</span><input value={item.alt} onChange={(event) => update({ alt: event.target.value })} /></label></>} />
    </section>

    <section className="cms-editor-section">
      <h2 className="cms-form-heading">Gallery and architecture</h2>
      <div className="cms-grid">
        <label className="cms-field"><span>Gallery headline</span><input name="galleryHeadline" defaultValue={asText(content.gallery.headline)} /></label>
        <label className="cms-field"><span>Gallery note</span><input name="galleryNote" defaultValue={asText(content.gallery.note)} /></label>
      </div>
      <ListEditor items={gallery} onChange={setGallery} addLabel="Add gallery image" newItem={() => ({ src: "", alt: "" })} itemLabel={(item, index) => item.alt || `Gallery ${index + 1}`}
        renderItem={(item, update) => <><div className="cms-field"><span>Image</span><AssetUrlField value={item.src} onChange={(src) => update({ src })} accept="image/*" fileLabel="gallery image" /></div><label className="cms-field"><span>Alt text</span><input value={item.alt} onChange={(event) => update({ alt: event.target.value })} /></label></>} />
      <label className="cms-field"><span>Architecture headline</span><input name="exteriorHeadline" defaultValue={asText(content.exterior.headline)} /></label>
      <label className="cms-field"><span>Architecture body</span><textarea name="exteriorBody" rows={4} defaultValue={asText(content.exterior.body)} /></label>
      <div className="cms-field"><span>Architecture image</span><AssetUrlField name="exteriorMedia" defaultValue={asText(content.exterior.media)} accept="image/*" fileLabel="architecture image" /></div>
    </section>

    <section className="cms-editor-section">
      <h2 className="cms-form-heading">Amenities</h2>
      <label className="cms-field"><span>Headline</span><input name="amenitiesHeadline" defaultValue={asText(content.amenities.headline)} /></label>
      <ListEditor items={amenities} onChange={setAmenities} addLabel="Add amenity" newItem={() => ({ src: "", alt: "", label: "" })} itemLabel={(item, index) => item.label || `Amenity ${index + 1}`}
        renderItem={(item, update) => <><label className="cms-field"><span>Name</span><input value={item.label} onChange={(event) => update({ label: event.target.value })} /></label><div className="cms-field"><span>Image</span><AssetUrlField value={item.src} onChange={(src) => update({ src })} accept="image/*" fileLabel="amenity image" /></div><label className="cms-field"><span>Alt text</span><input value={item.alt} onChange={(event) => update({ alt: event.target.value })} /></label></>} />
    </section>

    <section className="cms-editor-section">
      <h2 className="cms-form-heading">Community and location</h2>
      <label className="cms-field"><span>Community headline</span><input name="communityHeadline" defaultValue={asText(content.community.headline)} /></label>
      <label className="cms-field"><span>Community body</span><textarea name="communityBody" rows={4} defaultValue={asText(content.community.body)} /></label>
      <ListEditor items={community} onChange={setCommunity} addLabel="Add community image" newItem={() => ({ src: "", alt: "" })} itemLabel={(item, index) => item.alt || `Slide ${index + 1}`}
        renderItem={(item, update) => <><div className="cms-field"><span>Image</span><AssetUrlField value={item.src} onChange={(src) => update({ src })} accept="image/*" fileLabel="community image" /></div><label className="cms-field"><span>Alt text</span><input value={item.alt} onChange={(event) => update({ alt: event.target.value })} /></label></>} />
      <label className="cms-field"><span>Location headline</span><input name="locationHeadline" defaultValue={asText(content.location.headline)} /></label>
      <label className="cms-field"><span>Location body</span><textarea name="locationBody" rows={4} defaultValue={asText(content.location.body)} /></label>
      <ListEditor items={places} onChange={setPlaces} addLabel="Add place" newItem={() => ({ name: "", minutes: "", lat: 25.18, lng: 55.32, reveal: 0.5 })} itemLabel={(item, index) => item.name || `Place ${index + 1}`}
        renderItem={(item, update) => <div className="cms-grid"><label className="cms-field"><span>Name</span><input value={item.name} onChange={(event) => update({ name: event.target.value })} /></label><label className="cms-field"><span>Time</span><input value={item.minutes} onChange={(event) => update({ minutes: event.target.value })} /></label><label className="cms-field"><span>Latitude</span><input value={item.lat} onChange={(event) => update({ lat: Number(event.target.value) })} /></label><label className="cms-field"><span>Longitude</span><input value={item.lng} onChange={(event) => update({ lng: Number(event.target.value) })} /></label></div>} />
      <div className="cms-field"><span>Mobile map</span><AssetUrlField name="mapImage" defaultValue={asText(content.brand.map)} accept="image/*" fileLabel="location map" /></div>
    </section>

    <FloorPlanEditor title="One bedroom" plan={one} onChange={setOne} tabName="tabOne" tabDefault={asText(content.floorplans.tabOne)} />
    <FloorPlanEditor title="Two bedrooms" plan={two} onChange={setTwo} tabName="tabTwo" tabDefault={asText(content.floorplans.tabTwo)} />
    <FloorPlanEditor title="Three bedrooms" plan={three} onChange={setThree} tabName="tabThree" tabDefault={asText(content.floorplans.tabThree)} />
    <label className="cms-field"><span>Floor plans label</span><input name="floorHeadline" defaultValue={asText(content.floorplans.headline)} /></label>

    <section className="cms-editor-section">
      <h2 className="cms-form-heading">Payment plan</h2>
      <label className="cms-field"><span>Headline</span><input name="paymentHeadline" defaultValue={asText(content.payment.headline)} /></label>
      <label className="cms-field"><span>Body</span><textarea name="paymentBody" rows={3} defaultValue={asText(content.payment.body)} /></label>
      <ListEditor items={milestones} onChange={setMilestones} addLabel="Add milestone" newItem={(): Milestone => ({ percent: 5, title: "", detail: "", phase: "calendar" })} itemLabel={(item, index) => item.title || `Milestone ${index + 1}`}
        renderItem={(item, update) => <MilestoneFields item={item} update={update} />} />
    </section>

    <section className="cms-editor-section">
      <h2 className="cms-form-heading">Enquiry and buttons</h2>
      <div className="cms-grid">
        <label className="cms-field"><span>Form headline</span><input name="registerHeadline" defaultValue={asText(content.register.headline)} /></label>
        <label className="cms-field"><span>Primary button</span><input name="ctaPrimary" defaultValue={asText(content.cta.primary)} /></label>
        <label className="cms-field"><span>Secondary button</span><input name="ctaSecondary" defaultValue={asText(content.cta.secondary)} /></label>
        <label className="cms-field"><span>Submit button</span><input name="ctaSubmit" defaultValue={asText(content.cta.submit)} /></label>
      </div>
      <label className="cms-field"><span>Form introduction</span><textarea name="registerBody" rows={3} defaultValue={asText(content.register.body)} /></label>
      <label className="cms-field"><span>Interest choices</span><textarea name="interestOptions" rows={4} defaultValue={(content.register.interestOptions as string[] | undefined)?.join("\n") ?? ""} /><small>One choice on each line.</small></label>
      <label className="cms-field"><span>Consent</span><textarea name="consent" rows={3} defaultValue={asText(content.register.consent)} /></label>
      <label className="cms-field"><span>Footer statement</span><textarea name="footerBody" rows={3} defaultValue={asText(content.footer.body)} /></label>
      <label className="cms-field"><span>Copyright</span><input name="footerCopyright" defaultValue={asText(content.footer.copyright)} /></label>
    </section>

    <section className="cms-editor-section">
      <h2 className="cms-form-heading">Brand images</h2>
      <div className="cms-grid">
        <div className="cms-field"><span>White logo</span><AssetUrlField name="logoWhite" defaultValue={asText(content.brand.logoWhite)} accept="image/*" fileLabel="white logo" /></div>
        <div className="cms-field"><span>Black logo</span><AssetUrlField name="logoBlack" defaultValue={asText(content.brand.logoBlack)} accept="image/*" fileLabel="black logo" /></div>
        <div className="cms-field"><span>White mark</span><AssetUrlField name="markWhite" defaultValue={asText(content.brand.markWhite)} accept="image/*" fileLabel="white mark" /></div>
        <div className="cms-field"><span>Black mark</span><AssetUrlField name="markBlack" defaultValue={asText(content.brand.markBlack)} accept="image/*" fileLabel="black mark" /></div>
        <div className="cms-field"><span>Intro image</span><AssetUrlField name="introImage" defaultValue={asText(content.brand.intro)} accept="image/*" fileLabel="intro image" /></div>
      </div>
    </section>

    <div className="cms-actions">
      <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save page"}</button>
      <button className="cms-btn cms-btn--ghost" type="button" onClick={preview} disabled={previewing}>{previewing ? "Opening…" : "Preview"}</button>
    </div>
  </form>;
}

function MilestoneFields({ item, update }: { item: Milestone; update: (changes: Partial<Milestone>) => void }) {
  return <div className="cms-grid">
    <label className="cms-field"><span>Percent</span><input value={String(item.percent)} onChange={(event) => update({ percent: Number(event.target.value) })} /></label>
    <label className="cms-field"><span>Title</span><input value={item.title} onChange={(event) => update({ title: event.target.value })} /></label>
    <label className="cms-field"><span>Detail</span><input value={item.detail} onChange={(event) => update({ detail: event.target.value })} /></label>
    <label className="cms-field"><span>Phase</span><select value={item.phase} onChange={(event) => { const phase = event.target.value; update({ phase: phase === "construction" || phase === "handover" ? phase : "calendar" }); }}><option value="calendar">Reservation calendar</option><option value="construction">Building progress</option><option value="handover">Handover</option></select></label>
  </div>;
}

function FloorPlanEditor({ title, plan, onChange, tabName, tabDefault }: { title: string; plan: Plan; onChange: (plan: Plan) => void; tabName: string; tabDefault: string }) {
  const update = (changes: Partial<Plan>) => onChange({ ...plan, ...changes });
  return <section className="cms-editor-section">
    <h2 className="cms-form-heading">{title}</h2>
    <div className="cms-grid">
      <label className="cms-field"><span>Tab label</span><input name={tabName} defaultValue={tabDefault} /></label>
      <label className="cms-field"><span>Heading</span><input value={plan.title} onChange={(event) => update({ title: event.target.value })} /></label>
      <label className="cms-field"><span>Unit</span><input value={plan.unit} onChange={(event) => update({ unit: event.target.value })} /></label>
      <label className="cms-field"><span>Alt text</span><input value={plan.alt} onChange={(event) => update({ alt: event.target.value })} /></label>
      <label className="cms-field"><span>Total sq ft</span><input value={plan.totalSqft} onChange={(event) => update({ totalSqft: event.target.value })} /></label>
      <label className="cms-field"><span>Total sq m</span><input value={plan.totalSqm} onChange={(event) => update({ totalSqm: event.target.value })} /></label>
      <label className="cms-field"><span>Suite sq ft</span><input value={plan.suiteSqft} onChange={(event) => update({ suiteSqft: event.target.value })} /></label>
      <label className="cms-field"><span>Suite sq m</span><input value={plan.suiteSqm} onChange={(event) => update({ suiteSqm: event.target.value })} /></label>
      <label className="cms-field"><span>Balcony sq ft</span><input value={plan.balconySqft} onChange={(event) => update({ balconySqft: event.target.value })} /></label>
      <label className="cms-field"><span>Balcony sq m</span><input value={plan.balconySqm} onChange={(event) => update({ balconySqm: event.target.value })} /></label>
    </div>
    <div className="cms-field"><span>Plan image</span><AssetUrlField value={plan.image} onChange={(image) => update({ image })} accept="image/*" fileLabel={`${title} plan`} /></div>
    <ListEditor items={plan.legend} onChange={(legend) => update({ legend })} addLabel="Add legend row" newItem={() => ({ number: "", name: "", size: "" })} itemLabel={(item, index) => item.name || `Row ${index + 1}`}
      renderItem={(item, change) => <div className="cms-grid"><label className="cms-field"><span>Number</span><input value={item.number} onChange={(event) => change({ number: event.target.value })} /></label><label className="cms-field"><span>Room</span><input value={item.name} onChange={(event) => change({ name: event.target.value })} /></label><label className="cms-field"><span>Size</span><input value={item.size} onChange={(event) => change({ size: event.target.value })} /></label></div>} />
  </section>;
}
