"use client";

import { useActionState, useRef, useState } from "react";
import type { ReactNode } from "react";
import { previewInvestDraft, saveStaticPage, type StaticPageFormState } from "../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";
import { ListEditor } from "@/components/admin/list-editor";
import { SeoFields, type SeoFieldDefaults } from "@/components/admin/seo-fields";
import { TextStyleFields, type TextStyleValue } from "@/components/admin/text-style-fields";
import { DragHandle, reorder, useDragReorder } from "@/components/admin/drag-reorder";
import { ensureInvestSections, investIcons, investSectionLabels, mergeInvestContent, type FaqItem, type FeaturedCard, type IconCard, type InvestContent, type InvestSectionId, type Metric, type PanelSection, type YieldRow } from "@/lib/invest-defaults";
import type { TextStyle } from "@/lib/text-style";

const initialState: StaticPageFormState = {};
const IMAGES = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";

type Block = { type?: string; eyebrow?: string; heading?: string; text?: string; image?: string; headingStyle?: unknown; textStyle?: unknown };
export type InvestPageDefaults = { id?: string; slug?: string; title?: string; content?: (Block & Record<string, unknown>)[] };

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

/// Controlled twin of TextStyleFields: the investor-guide sections save through
/// the investJson state (not named form fields), so the appearance controls
/// write straight into that state. Same look and options as the shared one.
function Appearance({ label, value, onChange }: { label: string; value?: TextStyle; onChange: (changes: TextStyle) => void }) {
  return <fieldset className="cms-editor-section">
    <legend className="cms-subheading">{label}</legend>
    <div className="cms-grid">
      <label className="cms-field"><span>Font size</span><input value={value?.fontSize ?? ""} onChange={(event) => onChange({ fontSize: event.target.value })} placeholder="e.g. 18px or 1.25rem" /><small>Leave blank for the site default.</small></label>
      <label className="cms-field"><span>Weight</span><select value={value?.fontWeight ?? ""} onChange={(event) => onChange({ fontWeight: (event.target.value || undefined) as TextStyle["fontWeight"] })}><option value="">Keep delivered weight</option><option value="300">Light (300)</option><option value="normal">Normal (400)</option><option value="500">Medium (500)</option><option value="bold">Bold</option></select></label>
      <label className="cms-field"><span>Style</span><select value={value?.fontStyle ?? ""} onChange={(event) => onChange({ fontStyle: (event.target.value || undefined) as TextStyle["fontStyle"] })}><option value="">Keep delivered style</option><option value="normal">Normal</option><option value="italic">Italic</option></select></label>
    </div>
  </fieldset>;
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
      <Text label="Button label" value={value.button} onChange={(button) => onChange({ button })} help="Opens the booking form, or the link below when one is set." />
    </div>
    <div className="cms-grid">
      <Text label="Button link" value={value.ctaUrl ?? ""} onChange={(ctaUrl) => onChange({ ctaUrl })} placeholder="/contact#experience-center" help="Sends the button to this address instead of the booking form. Leave empty to keep the booking form." />
      <label className="cms-check"><input type="checkbox" checked={value.ctaVisible !== false} onChange={(event) => onChange({ ctaVisible: event.target.checked })} /> <span><strong>Show button</strong><small>Untick to remove the button from the panel.</small></span></label>
    </div>
    <Area label="Text" value={value.text} onChange={(text) => onChange({ text })} rows={4} />
    <Appearance label="Heading appearance" value={value.headingStyle} onChange={(headingStyle) => onChange({ headingStyle })} />
    <Appearance label="Text appearance" value={value.textStyle} onChange={(textStyle) => onChange({ textStyle })} />
    <Picture label="Image" value={value.image} onChange={(image) => onChange({ image })} />
    <h4 className="cms-subheading">Cards</h4>
    <IconCards items={value.cards} onChange={(cards) => onChange({ cards })} addLabel="Add card" />
  </>;
}

/// Investor-guide editor: every public value comes from this CMS record.
export default function InvestForm({ defaults, seo }: { defaults: InvestPageDefaults; seo?: SeoFieldDefaults }) {
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
  const [content, setContent] = useState<InvestContent>(() => ensureInvestSections(mergeInvestContent((defaults.content ?? []).find((block) => block.type === "invest"))));
  const sectionDrag = useDragReorder(content.sectionOrder, (sectionOrder: InvestSectionId[]) => setContent((current) => ({ ...current, sectionOrder })));
  const patch = <K extends keyof InvestContent>(key: K, changes: Partial<InvestContent[K]>) => setContent((current) => ({ ...current, [key]: { ...(current[key] as object), ...changes } as InvestContent[K] }));

  return <form ref={formRef} action={formAction}>
    {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
    <input type="hidden" name="title" value={defaults.title ?? "Investor guide"} />
    <input type="hidden" name="slug" value="invest-in-dubai" />
    <input type="hidden" name="status" value="PUBLISHED" />
    <input type="hidden" name="investJson" value={JSON.stringify(content)} />
    {state.error ? <p className="cms-error">{state.error}</p> : null}
    <datalist id="invest-icons">{investIcons.map((icon) => <option key={icon} value={icon} />)}</datalist>
    <p className="cms-muted">These fields are the public page source of truth. Empty values remain empty after saving.</p>

    <h2 className="cms-form-heading">Hero</h2>
    <label className="cms-field"><span>Eyebrow</span><input name="eyebrow" defaultValue={hero?.eyebrow ?? "Invest in Dubai"} /><small>The small line above the heading. Leave empty to hide it on the page.</small></label>
    <label className="cms-field"><span>Heading</span><textarea name="heading" rows={2} defaultValue={hero?.heading ?? ""} /><small>Line breaks render on the public page exactly as typed.</small></label>
    <TextStyleFields prefix="pageHeading" value={hero?.headingStyle as TextStyleValue | undefined} label="Heading appearance" preserveDefault />
    <label className="cms-field"><span>Intro copy</span><textarea name="intro" rows={3} defaultValue={hero?.text ?? ""} /></label>
    <TextStyleFields prefix="pageIntro" value={hero?.textStyle as TextStyleValue | undefined} label="Intro appearance" preserveDefault />
    <div className="cms-field"><span>Hero image</span><AssetUrlField name="image" defaultValue={hero?.image ?? ""} accept={IMAGES} placeholder="/legacy/assets/images/..." fileLabel="hero image" /></div>
    <Section title="Highlights under the hero" help="Three short highlights in the hero.">
      <ListEditor items={content.metrics} onChange={(metrics: Metric[]) => setContent((current) => ({ ...current, metrics }))} newItem={() => ({ value: "", label: "" })} addLabel="Add highlight" max={4} itemLabel={(item, index) => `${index + 1}. ${item.value || "Highlight"}`}
        renderItem={(item, update) => <div className="cms-grid"><Text label="Headline" value={item.value} onChange={(value) => update({ value })} /><Text label="Caption" value={item.label} onChange={(label) => update({ label })} /></div>} />
    </Section>

    <h2 className="cms-form-heading">Section order</h2>
    <p className="cms-muted">The calculator starts last. Drag a row, or use Move up and Move down, to change where each block sits. The hero stays at the top.</p>
    <ol className="cms-member-list">
      {content.sectionOrder.map((id, index) => <li className="cms-repeat-card" key={id} {...sectionDrag.dropProps(index)}><div className="cms-repeat-card__head"><strong><DragHandle {...sectionDrag.handleProps(index)} />{investSectionLabels[id]}</strong><span className="cms-actions"><button className="cms-text-button" type="button" onClick={() => setContent((current) => ({ ...current, sectionOrder: reorder(current.sectionOrder, index, index - 1) }))} disabled={index === 0}>Move up</button><button className="cms-text-button" type="button" onClick={() => setContent((current) => ({ ...current, sectionOrder: reorder(current.sectionOrder, index, index + 1) }))} disabled={index === content.sectionOrder.length - 1}>Move down</button></span></div></li>)}
    </ol>
    <h2 className="cms-form-heading">Why Dubai remains investable</h2>
    <div className="cms-grid"><Text label="Heading" value={content.benefits.heading} onChange={(heading) => patch("benefits", { heading })} /></div>
    <Area label="Intro" value={content.benefits.text} onChange={(text) => patch("benefits", { text })} />
    <IconCards items={content.benefits.items} onChange={(items) => patch("benefits", { items })} addLabel="Add benefit" />
    <Appearance label="Heading appearance" value={content.benefits.headingStyle} onChange={(changes) => patch("benefits", { headingStyle: { ...content.benefits.headingStyle, ...changes } })} />
    <Appearance label="Text appearance" value={content.benefits.textStyle} onChange={(changes) => patch("benefits", { textStyle: { ...content.benefits.textStyle, ...changes } })} />

    <h2 className="cms-form-heading">Yield comparison</h2>
    <div className="cms-grid"><Text label="Heading" value={content.market.heading} onChange={(heading) => patch("market", { heading })} /></div>
    <Area label="Intro" value={content.market.text} onChange={(text) => patch("market", { text })} />
    <Area label="Source note" value={content.market.source} onChange={(source) => patch("market", { source })} rows={3} help="Shown beneath the table, aligned to the right." />
    <Appearance label="Heading appearance" value={content.market.headingStyle} onChange={(changes) => patch("market", { headingStyle: { ...content.market.headingStyle, ...changes } })} />
    <Appearance label="Text appearance" value={content.market.textStyle} onChange={(changes) => patch("market", { textStyle: { ...content.market.textStyle, ...changes } })} />
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

    <h2 className="cms-form-heading">Mortgage calculator</h2>
    <p className="cms-muted">The wording above the client’s calculator. Leave a field empty to keep the delivered wording.</p>
    <Area label="Heading" value={content.calculator.heading} onChange={(heading) => patch("calculator", { heading })} rows={2} help="Line breaks render on the public page exactly as typed." />
    <Area label="Intro copy" value={content.calculator.text} onChange={(text) => patch("calculator", { text })} rows={3} help="The line to the right of the heading, above the calculator." />
    <Appearance label="Heading appearance" value={content.calculator.headingStyle} onChange={(changes) => patch("calculator", { headingStyle: { ...content.calculator.headingStyle, ...changes } })} />
    <Appearance label="Text appearance" value={content.calculator.textStyle} onChange={(changes) => patch("calculator", { textStyle: { ...content.calculator.textStyle, ...changes } })} />

    <h2 className="cms-form-heading">Flexible payment plans</h2>
    <label className="cms-check"><input type="checkbox" checked={content.paymentVisible !== false} onChange={(event) => setContent((current) => ({ ...current, paymentVisible: event.target.checked }))} /> <span><strong>Show this section</strong><small>The four-step payment path from the original investor guide.</small></span></label>
    <div className="cms-grid"><Text label="Heading" value={content.payment.heading} onChange={(heading) => patch("payment", { heading })} /></div>
    <Area label="Intro" value={content.payment.text} onChange={(text) => patch("payment", { text })} />
    <Picture label="Image" value={content.payment.image} onChange={(image) => patch("payment", { image })} />
    <IconCards items={content.payment.cards} onChange={(cards) => patch("payment", { cards })} addLabel="Add step" />
    <Appearance label="Heading appearance" value={content.payment.headingStyle} onChange={(changes) => patch("payment", { headingStyle: { ...content.payment.headingStyle, ...changes } })} />
    <Appearance label="Text appearance" value={content.payment.textStyle} onChange={(changes) => patch("payment", { textStyle: { ...content.payment.textStyle, ...changes } })} />

    <h2 className="cms-form-heading">Golden Visa / residency</h2>
    <PanelEditor value={content.residency} onChange={(changes) => patch("residency", changes)} />

    <h2 className="cms-form-heading">Investment pathway</h2>
    <div className="cms-grid"><Text label="Heading" value={content.pathway.heading} onChange={(heading) => patch("pathway", { heading })} /><Text label="Button label" value={content.pathway.button} onChange={(button) => patch("pathway", { button })} /></div>
    <Area label="Intro" value={content.pathway.text} onChange={(text) => patch("pathway", { text })} />
    <IconCards items={content.pathway.steps} onChange={(steps) => patch("pathway", { steps })} addLabel="Add step" />
    <Appearance label="Heading appearance" value={content.pathway.headingStyle} onChange={(changes) => patch("pathway", { headingStyle: { ...content.pathway.headingStyle, ...changes } })} />
    <Appearance label="Text appearance" value={content.pathway.textStyle} onChange={(changes) => patch("pathway", { textStyle: { ...content.pathway.textStyle, ...changes } })} />

    <h2 className="cms-form-heading">Developer trust &amp; delivery</h2>
    <PanelEditor value={content.trust} onChange={(changes) => patch("trust", changes)} />

    <h2 className="cms-form-heading">Market liquidity &amp; exit</h2>
    <div className="cms-grid"><Text label="Heading" value={content.liquidity.heading} onChange={(heading) => patch("liquidity", { heading })} /></div>
    <Area label="Intro" value={content.liquidity.text} onChange={(text) => patch("liquidity", { text })} />
    <h4 className="cms-subheading">Featured point</h4>
    <div className="cms-repeat-card"><div className="cms-grid"><Text label="Title" value={content.liquidity.feature.title} onChange={(title) => patch("liquidity", { feature: { ...content.liquidity.feature, title } })} /><Text label="Icon" list="invest-icons" value={content.liquidity.feature.icon} onChange={(icon) => patch("liquidity", { feature: { ...content.liquidity.feature, icon } })} /></div><Area label="Text" value={content.liquidity.feature.text} onChange={(text) => patch("liquidity", { feature: { ...content.liquidity.feature, text } })} /></div>
    <h4 className="cms-subheading">Supporting points</h4>
    <IconCards items={content.liquidity.cards} onChange={(cards) => patch("liquidity", { cards })} addLabel="Add point" />
    <Appearance label="Heading appearance" value={content.liquidity.headingStyle} onChange={(changes) => patch("liquidity", { headingStyle: { ...content.liquidity.headingStyle, ...changes } })} />
    <Appearance label="Text appearance" value={content.liquidity.textStyle} onChange={(changes) => patch("liquidity", { textStyle: { ...content.liquidity.textStyle, ...changes } })} />

    <h2 className="cms-form-heading">Featured developments</h2>
    <div className="cms-grid"><Text label="Heading" value={content.featured.heading} onChange={(heading) => patch("featured", { heading })} /></div>
    <Area label="Intro" value={content.featured.text} onChange={(text) => patch("featured", { text })} />
    <ListEditor items={content.featured.cards} onChange={(cards: FeaturedCard[]) => patch("featured", { cards })} newItem={() => ({ href: "", image: "", title: "", copy: "" })} addLabel="Add development" itemLabel={(item, index) => `${index + 1}. ${item.title || "New development"}`}
      renderItem={(item, update, index) => <>
        <div className="cms-grid"><Text label="Title" value={item.title} onChange={(title) => update({ title })} /><Text label="Link" value={item.href} onChange={(href) => update({ href })} placeholder="/developments/…" /></div>
        <Area label="Description" value={item.copy} onChange={(copy) => update({ copy })} />
        <div className="cms-field"><span>Image</span><AssetUrlField value={item.image} onChange={(image) => update({ image })} accept={IMAGES} placeholder="https://…" fileLabel={`development ${index + 1} image`} /></div>
      </>} />
    <Appearance label="Heading appearance" value={content.featured.headingStyle} onChange={(changes) => patch("featured", { headingStyle: { ...content.featured.headingStyle, ...changes } })} />
    <Appearance label="Text appearance" value={content.featured.textStyle} onChange={(changes) => patch("featured", { textStyle: { ...content.featured.textStyle, ...changes } })} />

    <h2 className="cms-form-heading">Frequently asked questions</h2>
    <div className="cms-grid"><Text label="Eyebrow" value={content.faq.eyebrow} onChange={(eyebrow) => patch("faq", { eyebrow })} /><Text label="Heading" value={content.faq.heading} onChange={(heading) => patch("faq", { heading })} /></div>
    <Area label="Intro" value={content.faq.text} onChange={(text) => patch("faq", { text })} />
    <ListEditor items={content.faq.items} onChange={(items: FaqItem[]) => patch("faq", { items })} newItem={() => ({ question: "", answer: "" })} addLabel="Add question" itemLabel={(item, index) => `${index + 1}. ${item.question || "New question"}`}
      renderItem={(item, update) => <><Text label="Question" value={item.question} onChange={(question) => update({ question })} /><Area label="Answer" value={item.answer} onChange={(answer) => update({ answer })} rows={4} /></>} />
    <p className="cms-muted">These questions also feed the page’s FAQ structured data for search engines.</p>
    <Appearance label="Heading appearance" value={content.faq.headingStyle} onChange={(changes) => patch("faq", { headingStyle: { ...content.faq.headingStyle, ...changes } })} />
    <Appearance label="Text appearance" value={content.faq.textStyle} onChange={(changes) => patch("faq", { textStyle: { ...content.faq.textStyle, ...changes } })} />

    <SeoFields defaults={seo} />
    <div className="cms-save-row"><button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save investor guide"}</button><button className="cms-btn cms-btn--outline" type="button" onClick={previewUnsaved} disabled={previewing}>{previewing ? "Opening preview…" : "Preview with unsaved changes ↗"}</button>{previewError ? <span className="cms-error">{previewError}</span> : null}</div>
  </form>;
}
