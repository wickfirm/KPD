"use client";

import { useActionState } from "react";
import { saveStaticPage, type StaticPageFormState } from "../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";

type ManagementPerson = { name?: string; role?: string; bio?: string; image?: string };
type LegacyMilestone = { year?: string; title?: string; summary?: string; body?: string; image?: string };
type Block = { type?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaUrl?: string; mission?: string; vision?: string; chairmanText?: string; chairmanName?: string; chairmanRole?: string; chairmanImage?: string; management?: ManagementPerson[]; timeline?: LegacyMilestone[] };
export type StaticPageDefaults = { id?: string; slug?: string; title?: string; status?: string; content?: Block[] };
const initialState: StaticPageFormState = {};

function firstBlock(blocks: Block[] | undefined, type: string) {
  return (blocks ?? []).find((block) => block.type === type);
}

const aboutFallback = {
  mission: "Our mission is to create residential, hospitality, and mixed-use destinations with disciplined feasibility, thoughtful architecture, and delivery control. We shape communities that elevate daily living while protecting long-term value for partners, buyers, and the city around them.",
  vision: "Our vision is to become a trusted boutique development platform for the region, where every project is guided by clarity, restraint, and durable performance. We aim to create places that feel precise, enduring, commercially sound, and unmistakably considered.",
  chairmanText: "The markets we operate in reward patience, clarity, and disciplined execution. KPD was formed to bring those qualities into development decisions, from how land is assessed to how a finished place will be lived in, operated, and valued over time.\n\nOur work is measured by the confidence of our partners, the quality of our delivery, and the long-term relevance of the communities and assets we help create.",
  chairmanName: "Mohammed Alabbar", chairmanRole: "Chairman", chairmanImage: "/legacy/assets/images/team/Alabbar.jpg",
  management: [
    { name: "Hiroyuki Chiba", role: "Executive Director", bio: "Hiroyuki Chiba supports KPD's long-term development philosophy, connecting institutional capital discipline with projects designed for durable value, memorable placemaking, and partner confidence.", image: "/legacy/assets/images/team/Chiba.jpg" },
    { name: "Ammar Al Tamimi", role: "Development Director", bio: "The executive management team supports the company's development platform through disciplined feasibility, delivery control, design coordination, and market positioning across every KPD project.", image: "/legacy/assets/images/team/Ammar.jpg" },
    { name: "Anas Al Khatib", role: "Commercial Director", bio: "KPD leadership brings together real estate judgment, capital planning, and operational clarity to create places that remain commercially sound and emotionally resonant over time.", image: "/legacy/assets/images/team/Anas.jpg" },
  ],
};

const legacyFallback: LegacyMilestone[] = [
  { year: "2014", title: "Foundations of the platform", summary: "The early phase centered on site logic, underwriting rigor, and a belief that every design decision should begin with commercial clarity.", body: "The first chapter was less about scale and more about method. Opportunity screening, demand discipline, and feasibility-led thinking became the base layer for how the platform would evaluate, prioritize, and shape future developments.", image: "/legacy/assets/images/library/aerial-view-of-osaka-city-from-sky-building-bird-2026-03-17-14-45-17-utc.jpg" },
  { year: "2016", title: "Boutique residential focus sharpens", summary: "Early residential briefs helped define a clearer position around privacy, livability, and product quality over volume-driven development.", body: "The residential lens matured into a stronger product philosophy. Layout efficiency, calm arrival experiences, and long-term habitability started to influence how the platform translated commercial strategy into the language of everyday living.", image: "/legacy/assets/images/library/downtown-urban-city-in-japan-2026-03-10-03-53-46-utc.jpg" },
  { year: "2018", title: "Hospitality and mixed-use capability expands", summary: "The platform broadened beyond one asset type, bringing placemaking, operational thinking, and return discipline into a wider development model.", body: "Hospitality and mixed-use opportunities introduced a richer operating layer. The development story now had to hold together brand, user flow, public realm, and asset performance in one cohesive strategy rather than as separate conversations.", image: "/legacy/assets/images/library/kumamoto-japan-downtown-cityscape-on-the-shirakaw-2026-03-24-11-40-22-utc.jpg" },
  { year: "2020", title: "Execution systems become more deliberate", summary: "Consultant alignment, delivery governance, and budget coordination matured into a more controlled framework for moving from concept to handover.", body: "This phase deepened the platform's delivery confidence. Programme logic, cost control, design decision-making, and handover preparedness were treated as a single operating system rather than isolated workstreams.", image: "/legacy/assets/images/library/tokyo-japan-at-ochanomizu-the-district-is-home-t-2026-04-13-23-44-40-utc.jpg" },
  { year: "2023", title: "Regional ambition takes a clearer shape", summary: "A stronger Middle East lens sharpened the platform's opportunity selection around urban demand, investor confidence, and resilient end-user value.", body: "The legacy was no longer just operational; it became directional. Market selection, product timing, and the balance between identity and commercial logic began to point more clearly toward a refined regional platform and a sharper development voice.", image: "/legacy/assets/images/library/modern-skyscraper-at-japan-with-blue-facade-2026-03-25-23-22-32-utc.jpg" },
  { year: "2026", title: "Emerald Villa marks the current chapter", summary: "The present expression of the legacy is more focused: boutique scale, stronger identity, and developments shaped for enduring value rather than short-lived momentum.", body: "The current moment shows a more distilled version of the story. Projects like Emerald Villa and Dubai Hills Mansion reflect the platform's move toward precise scale, elevated livability, and a development process that remains calm, commercially grounded, and durable by design.", image: "/legacy/assets/images/library/yokohama-bay-at-night-2026-03-24-23-17-41-utc.jpg" },
];

export default function StaticPageForm({ defaults }: { defaults?: StaticPageDefaults }) {
  const [state, formAction, pending] = useActionState(saveStaticPage, initialState);
  const hero = firstBlock(defaults?.content, "hero");
  const about = firstBlock(defaults?.content, "about");
  const legacy = firstBlock(defaults?.content, "legacy");
  const paragraphs = (defaults?.content ?? []).filter((block) => block.type === "paragraph").map((block) => block.text).filter(Boolean).join("\n\n");
  const isAbout = defaults?.slug === "about";
  const isLegacy = defaults?.slug === "legacy";
  const aboutValues = { ...aboutFallback, ...(about ?? {}) };
  const managementRows = (aboutValues.management ?? aboutFallback.management).map((person) => [person.name, person.role, person.bio, person.image].join(" | ")).join("\n");
  const timelineRows = (legacy?.timeline?.length === 6 ? legacy.timeline : legacyFallback).map((item) => [item.year, item.title, item.summary, item.body, item.image].join(" | ")).join("\n");

  return <form action={formAction}>
    {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
    {state.error ? <p className="cms-error">{state.error}</p> : null}
    <div className="cms-grid">
      <label className="cms-field"><span>Page title</span><input name="title" defaultValue={defaults?.title} required /></label>
      <label className="cms-field"><span>URL slug</span><input name="slug" defaultValue={defaults?.slug} placeholder="privacy-policy" /></label>
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
    {isAbout ? <section className="cms-editor-section"><h2 className="cms-form-heading">About-page sections</h2><div className="cms-grid"><label className="cms-field"><span>Mission</span><textarea name="mission" rows={5} defaultValue={aboutValues.mission} /></label><label className="cms-field"><span>Vision</span><textarea name="vision" rows={5} defaultValue={aboutValues.vision} /></label></div><h3>Chairman</h3><label className="cms-field"><span>Message</span><textarea name="chairmanText" rows={6} defaultValue={aboutValues.chairmanText} /></label><div className="cms-grid"><label className="cms-field"><span>Name</span><input name="chairmanName" defaultValue={aboutValues.chairmanName} /></label><label className="cms-field"><span>Role</span><input name="chairmanRole" defaultValue={aboutValues.chairmanRole} /></label><label className="cms-field"><span>Portrait</span><AssetUrlField name="chairmanImage" defaultValue={aboutValues.chairmanImage} /></label></div><h3>Executive management</h3><label className="cms-field"><span>Team members</span><textarea name="management" rows={8} defaultValue={managementRows} /><small>One member per line: Name | Role | Biography | Portrait URL. Use exactly three members to retain the delivered layout and biography interaction.</small></label></section> : null}
    {isLegacy ? <section className="cms-editor-section"><h2 className="cms-form-heading">Legacy timeline</h2><label className="cms-field"><span>Milestones</span><textarea name="legacyTimeline" rows={18} defaultValue={timelineRows} /><small>One milestone per line: Year | Title | Summary | Full text | Image URL. Keep all six rows to preserve the supplied alternating timeline design.</small></label></section> : null}
    <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save page"}</button>
  </form>;
}
