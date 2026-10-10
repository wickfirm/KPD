"use client";

import { useActionState, useRef, useState } from "react";
import type { ReactNode } from "react";
import { previewInvestDraft, saveStaticPage, type StaticPageFormState } from "../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";
import { ListEditor } from "@/components/admin/list-editor";
import { investIcons, mergeInvestContent, type FaqItem, type FeaturedCard, type IconCard, type InvestContent, type Metric, type PanelSection, type YieldRow } from "@/lib/invest-defaults";

const initialState: StaticPageFormState = {};
const IMAGES = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";

type Block = { type?: string; heading?: string; text?: string; image?: string };
export type InvestPageDefaults = { id?: string; slug?: string; title?: string; content?: (Block & Record<string, unknown>)[] };

const heroDefaults = {
  heading: "Long-horizon\nvalue in Dubai",
  text: "A focused investment pathway for buyers seeking regulated ownership, composed residential assets, and advisory clarity across Dubai's next chapter.",
  image: "/legacy/assets/images/library/view-of-dubai-skyline-including-the-burj-khalifa-2026-03-18-08-25-37-utc.jpg",
};

function Text({ label, value, onChange, placeholder, help, list }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; help?: string; list?: string }) {
  return <label className="cms-field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} list={list} />{help ? <small>{help}</small> : null}</label>;
}
function Area({ label, value, onChange, rows = 3, help }: { label: string; value: string; onChange: (value: string) => void; rows?: number; help?: string }) {
  return <label className="cms-field"><span>{label}</span><textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />{help ? <small>{help}</small> : null}</label>;
}
function Picture({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="cms-field"><span>{label}</span><AssetUrlField value={value} onChange={onChange} accept={IMAGES} placeholder="https://…" fileLabel={label.toLowerCase()} /></div>;
}
function Section({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return <section className="cms-editor-section"><h3>{title}</h3>{help ? <p className="cms-muted">{help}</p> : null}{children}</section>;
}

/// Icon cards share one editor: an icon name (from the delivered icon set), a
/// title and a sentence.
function IconCards({ items, onChange, addLabel }: { items: IconCard[]; onChange: (items: IconCard[]) => void; addLabel: string }) {
  return <ListEditor items={items} onChange={onChange} newItem={() => ({ icon: "fi-tr-badge-check", title: "", text: "" })} addLabel={addLabel} itemLabel={(item, index) => `${index + 1}. ${item.title || "New card"}`}
    renderItem={(item, update) => <>
      <div className="cms-grid">
        <Text label="Title" value={item.title} onChange={(title) => update({ title })} />
        <Text label="Icon" value={item.icon} onChange={(icon) => update({ icon })} list="invest-icons" help="Pick a suggestion or type another icon name." />
      </div>
      <Area label="Text" value={item.text} onChange={(text) => update({ text })} />
    </>} />;
}

function PanelEditor({ value, onChange }: { value: PanelSection; onChange: (changes: Partial<PanelSection>) => void }) {
  return <>
    <div className="cms-grid">
      <Text label="Eyebrow" value={value.eyebrow} onChange={(eyebrow) => onChange({ eyebrow })} />
      <Text label="Heading" value={value.heading} onChange={(heading) => onChange({ heading })} />
      <Text label="Button label" value={value.button} onChange={(button) => onChange({ button })} help="Opens the booking form." />
    </div>
    <Area label="Text" value={value.text} onChange={(text) => onChange({ text })} rows={4} />
    <Picture label="Image" value={value.image} onChange={(image) => onChange({ image })} />
    <h4 className="cms-subheading">Cards</h4>
    <IconCards items={value.cards} onChange={(cards) => onChange({ cards })} addLabel="Add card" />
  </>;
}

/// Investor-guide editor: every section of the Invest in Dubai page. Fields
/// show the delivered content until you save your own, like the public page.
export default function InvestForm({ defaults }: { defaults: InvestPageDefaults }) {
  const [state, formAction, pending] = useActionState(saveStaticPage, initialState);
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
      const result = await previewInvestDraft(new FormData(formRef.current));
      if (result.error) throw new Error(result.error);
      const target = "/admin/preview/invest-in-dubai?draft=1";
      if (tab) tab.location.href = target; else window.location.assign(target);
    } catch (error) {
      tab?.close();
      setPreviewError(error instanceof Error ? error.message : "Unable to build the preview.");
    } finally { setPreviewing(false); }
  }
  const hero = (defaults.content ?? []).find((block) => block.type === "hero");
  const [content, setContent] = useState<InvestContent>(() => mergeInvestContent((defaults.content ?? []).find((block) => block.type === "invest")));
  const patch = <K extends keyof InvestContent>(key: K, changes: Partial<InvestContent[K]>) => setContent((current) => ({ ...current, [key]: { ...(current[key] as object), ...changes } as InvestContent[K] }));

  return <form ref={formRef} action={formAction}>
    {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
    <input type="hidden" name="title" value={defaults.title ?? "Investor guide"} />
    <input type="hidden" name="slug" value="invest-in-dubai" />
    <input type="hidden" name="status" value="PUBLISHED" />
    <input type="hidden" name="investJson" value={JSON.stringify(content)} />
    {state.error ? <p className="cms-error">{state.error}</p> : null}
    <datalist id="invest-icons">{investIcons.map((icon) => <option key={icon} value={icon} />)}</datalist>
    <p className="cms-muted">Fields show the delivered copy until you save your own. Saving makes the page live immediately.</p>

    <h2 className="cms-form-heading">Hero</h2>
    <label className="cms-field"><span>Heading</span><textarea name="heading" rows={2} defaultValue={hero?.heading || heroDefaults.heading} /><small>Line breaks render on the public page exactly as typed.</small></label>
    <label className="cms-field"><span>Intro copy</span><textarea name="intro" rows={3} defaultValue={hero?.text || heroDefaults.text} /></label>
    <div className="cms-field"><span>Hero image</span><AssetUrlField name="image" defaultValue={hero?.image || heroDefaults.image} accept={IMAGES} placeholder="/legacy/assets/images/..." fileLabel="hero image" /></div>
    <Section title="Highlights under the hero" help="Three short highlights in the hero.">
      <ListEditor items={content.metrics} onChange={(metrics: Metric[]) => setContent((current) => ({ ...current, metrics }))} newItem={() => ({ value: "", label: "" })} addLabel="Add highlight" max={4} itemLabel={(item, index) => `${index + 1}. ${item.value || "Highlight"}`}
        renderItem={(item, update) => <div className="cms-grid"><Text label="Headline" value={item.value} onChange={(value) => update({ value })} /><Text label="Caption" value={item.label} onChange={(label) => update({ label })} /></div>} />
    </Section>

    <h2 className="cms-form-heading">Why Dubai remains investable</h2>
    <div className="cms-grid"><Text label="Heading" value={content.benefits.heading} onChange={(heading) => patch("benefits", { heading })} /></div>
    <Area label="Intro" value={content.benefits.text} onChange={(text) => patch("benefits", { text })} />
    <IconCards items={content.benefits.items} onChange={(items) => patch("benefits", { items })} addLabel="Add benefit" />

    <h2 className="cms-form-heading">Yield comparison</h2>
    <div className="cms-grid"><Text label="Heading" value={content.market.heading} onChange={(heading) => patch("market", { heading })} /></div>
    <Area label="Intro" value={content.market.text} onChange={(text) => patch("market", { text })} />
    <ListEditor items={content.market.rows} onChange={(rows: YieldRow[]) => patch("market", { rows })} newItem={() => ({ code: "", city: "", yieldLabel: "", yieldBar: "50%", trend: "up" as const, gainLabel: "", gainBar: "50%" })} addLabel="Add city" itemLabel={(item, index) => `${index + 1}. ${item.city || "New city"}`}
      renderItem={(item, update) => <>
        <div className="cms-grid">
          <Text label="City" value={item.city} onChange={(city) => update({ city })} />
          <Text label="Country code" value={item.code} onChange={(code) => update({ code })} placeholder="AE" help="Two letters; shows the flag." />
          <label className="cms-field"><span>Capital trend</span><select value={item.trend} onChange={(event) => update({ trend: event.target.value === "down" ? "down" : "up" })}><option value="up">Rising</option><option value="down">Falling</option></select></label>
        </div>
        <div className="cms-grid">
          <Text label="Rental yield" value={item.yieldLabel} onChange={(yieldLabel) => update({ yieldLabel })} placeholder="7.5%" />
          <Text label="Yield bar length" value={item.yieldBar} onChange={(yieldBar) => update({ yieldBar })} placeholder="100%" help="0%–100%; the longest city is 100%." />
          <Text label="Capital appreciation" value={item.gainLabel} onChange={(gainLabel) => update({ gainLabel })} placeholder="+41.6%" />
          <Text label="Appreciation bar length" value={item.gainBar} onChange={(gainBar) => update({ gainBar })} placeholder="100%" />
        </div>
      </>} />

    <h2 className="cms-form-heading">Golden Visa / residency</h2>
    <PanelEditor value={content.residency} onChange={(changes) => patch("residency", changes)} />

    <h2 className="cms-form-heading">Investment pathway</h2>
    <div className="cms-grid"><Text label="Heading" value={content.pathway.heading} onChange={(heading) => patch("pathway", { heading })} /><Text label="Button label" value={content.pathway.button} onChange={(button) => patch("pathway", { button })} /></div>
    <Area label="Intro" value={content.pathway.text} onChange={(text) => patch("pathway", { text })} />
    <IconCards items={content.pathway.steps} onChange={(steps) => patch("pathway", { steps })} addLabel="Add step" />

    <h2 className="cms-form-heading">Developer trust &amp; delivery</h2>
    <PanelEditor value={content.trust} onChange={(changes) => patch("trust", changes)} />

    <h2 className="cms-form-heading">Market liquidity &amp; exit</h2>
    <div className="cms-grid"><Text label="Heading" value={content.liquidity.heading} onChange={(heading) => patch("liquidity", { heading })} /></div>
    <Area label="Intro" value={content.liquidity.text} onChange={(text) => patch("liquidity", { text })} />
    <h4 className="cms-subheading">Featured point</h4>
    <div className="cms-repeat-card"><div className="cms-grid"><Text label="Title" value={content.liquidity.feature.title} onChange={(title) => patch("liquidity", { feature: { ...content.liquidity.feature, title } })} /><Text label="Icon" list="invest-icons" value={content.liquidity.feature.icon} onChange={(icon) => patch("liquidity", { feature: { ...content.liquidity.feature, icon } })} /></div><Area label="Text" value={content.liquidity.feature.text} onChange={(text) => patch("liquidity", { feature: { ...content.liquidity.feature, text } })} /></div>
    <h4 className="cms-subheading">Supporting points</h4>
    <IconCards items={content.liquidity.cards} onChange={(cards) => patch("liquidity", { cards })} addLabel="Add point" />

    <h2 className="cms-form-heading">Featured developments</h2>
    <div className="cms-grid"><Text label="Heading" value={content.featured.heading} onChange={(heading) => patch("featured", { heading })} /></div>
    <Area label="Intro" value={content.featured.text} onChange={(text) => patch("featured", { text })} />
    <ListEditor items={content.featured.cards} onChange={(cards: FeaturedCard[]) => patch("featured", { cards })} newItem={() => ({ href: "", image: "", title: "", copy: "" })} addLabel="Add development" itemLabel={(item, index) => `${index + 1}. ${item.title || "New development"}`}
      renderItem={(item, update, index) => <>
        <div className="cms-grid"><Text label="Title" value={item.title} onChange={(title) => update({ title })} /><Text label="Link" value={item.href} onChange={(href) => update({ href })} placeholder="/developments/…" /></div>
        <Area label="Description" value={item.copy} onChange={(copy) => update({ copy })} />
        <div className="cms-field"><span>Image</span><AssetUrlField value={item.image} onChange={(image) => update({ image })} accept={IMAGES} placeholder="https://…" fileLabel={`development ${index + 1} image`} /></div>
      </>} />

    <h2 className="cms-form-heading">Frequently asked questions</h2>
    <div className="cms-grid"><Text label="Eyebrow" value={content.faq.eyebrow} onChange={(eyebrow) => patch("faq", { eyebrow })} /><Text label="Heading" value={content.faq.heading} onChange={(heading) => patch("faq", { heading })} /></div>
    <Area label="Intro" value={content.faq.text} onChange={(text) => patch("faq", { text })} />
    <ListEditor items={content.faq.items} onChange={(items: FaqItem[]) => patch("faq", { items })} newItem={() => ({ question: "", answer: "" })} addLabel="Add question" itemLabel={(item, index) => `${index + 1}. ${item.question || "New question"}`}
      renderItem={(item, update) => <><Text label="Question" value={item.question} onChange={(question) => update({ question })} /><Area label="Answer" value={item.answer} onChange={(answer) => update({ answer })} rows={4} /></>} />
    <p className="cms-muted">These questions also feed the page’s FAQ structured data for search engines.</p>

    <h2 className="cms-form-heading">Closing band</h2>
    <div className="cms-grid">
      <Text label="Eyebrow" value={content.contact.eyebrow} onChange={(eyebrow) => patch("contact", { eyebrow })} />
      <Text label="Primary button" value={content.contact.primaryLabel} onChange={(primaryLabel) => patch("contact", { primaryLabel })} help="Opens the booking form." />
      <Text label="Secondary button" value={content.contact.secondaryLabel} onChange={(secondaryLabel) => patch("contact", { secondaryLabel })} help="Links to the Contact page." />
    </div>
    <Area label="Heading" value={content.contact.heading} onChange={(heading) => patch("contact", { heading })} rows={2} help="Line breaks render exactly as typed." />
    <Area label="Text" value={content.contact.text} onChange={(text) => patch("contact", { text })} />
    <Picture label="Background image" value={content.contact.image} onChange={(image) => patch("contact", { image })} />

    <div className="cms-save-row"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save investor guide"}</button><button className="cms-btn cms-btn--outline" type="button" onClick={previewUnsaved} disabled={previewing}>{previewing ? "Opening preview…" : "Preview with unsaved changes ↗"}</button>{previewError ? <span className="cms-error">{previewError}</span> : null}</div>
  </form>;
}
