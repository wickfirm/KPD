"use client";

import { useActionState } from "react";
import { saveStaticPage, type StaticPageFormState } from "../actions";
import { AssetUrlField } from "@/components/admin/asset-url-field";

type ManagementPerson = { name?: string; role?: string; bio?: string; image?: string };
type Block = { type?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaUrl?: string; mission?: string; vision?: string; chairmanText?: string; chairmanName?: string; chairmanRole?: string; chairmanImage?: string; ceoText?: string; ceoName?: string; ceoRole?: string; ceoImage?: string; management?: ManagementPerson[] };
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
  ceoText: "The markets we operate in reward patience, clarity, and disciplined execution. KPD was formed to bring those qualities into development decisions, from how land is assessed to how a finished place will be lived in, operated, and valued over time. Our work is measured by the confidence of our partners, the quality of our delivery, and the long-term relevance of the communities and assets we help create.",
  ceoName: "Mohammed Alabbar", ceoRole: "CEO", ceoImage: "/legacy/assets/images/section/CEO%20Image.png",
  management: [
    { name: "Hiroyuki Chiba", role: "Executive Director", bio: "Hiroyuki Chiba supports KPD's long-term development philosophy, connecting institutional capital discipline with projects designed for durable value, memorable placemaking, and partner confidence.", image: "/legacy/assets/images/team/Chiba.jpg" },
    { name: "Ammar Al Tamimi", role: "Development Director", bio: "The executive management team supports the company's development platform through disciplined feasibility, delivery control, design coordination, and market positioning across every KPD project.", image: "/legacy/assets/images/team/Ammar.jpg" },
    { name: "Anas Al Khatib", role: "Commercial Director", bio: "KPD leadership brings together real estate judgment, capital planning, and operational clarity to create places that remain commercially sound and emotionally resonant over time.", image: "/legacy/assets/images/team/Anas.jpg" },
  ],
};

export default function StaticPageForm({ defaults }: { defaults?: StaticPageDefaults }) {
  const [state, formAction, pending] = useActionState(saveStaticPage, initialState);
  const hero = firstBlock(defaults?.content, "hero");
  const about = firstBlock(defaults?.content, "about");
  const paragraphs = (defaults?.content ?? []).filter((block) => block.type === "paragraph").map((block) => block.text).filter(Boolean).join("\n\n");
  const isAbout = defaults?.slug === "about";
  const aboutValues = { ...aboutFallback, ...(about ?? {}) };
  const managementRows = (aboutValues.management ?? aboutFallback.management).map((person) => [person.name, person.role, person.bio, person.image].join(" | ")).join("\n");

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
    {isAbout ? <section className="cms-editor-section"><h2 className="cms-form-heading">About-page sections</h2><div className="cms-grid"><label className="cms-field"><span>Mission</span><textarea name="mission" rows={5} defaultValue={aboutValues.mission} /></label><label className="cms-field"><span>Vision</span><textarea name="vision" rows={5} defaultValue={aboutValues.vision} /></label></div><h3>Chairman</h3><label className="cms-field"><span>Message</span><textarea name="chairmanText" rows={6} defaultValue={aboutValues.chairmanText} /></label><div className="cms-grid"><label className="cms-field"><span>Name</span><input name="chairmanName" defaultValue={aboutValues.chairmanName} /></label><label className="cms-field"><span>Role</span><input name="chairmanRole" defaultValue={aboutValues.chairmanRole} /></label><label className="cms-field"><span>Portrait</span><AssetUrlField name="chairmanImage" defaultValue={aboutValues.chairmanImage} /></label></div><h3>CEO</h3><label className="cms-field"><span>Message</span><textarea name="ceoText" rows={6} defaultValue={aboutValues.ceoText} /></label><div className="cms-grid"><label className="cms-field"><span>Name</span><input name="ceoName" defaultValue={aboutValues.ceoName} /></label><label className="cms-field"><span>Role</span><input name="ceoRole" defaultValue={aboutValues.ceoRole} /></label><label className="cms-field"><span>Portrait</span><AssetUrlField name="ceoImage" defaultValue={aboutValues.ceoImage} /></label></div><h3>Executive management</h3><label className="cms-field"><span>Team members</span><textarea name="management" rows={8} defaultValue={managementRows} /><small>One member per line: Name | Role | Biography | Portrait URL. Use exactly three members to retain the delivered layout and biography interaction.</small></label></section> : null}
    <button className="cms-btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Save page"}</button>
  </form>;
}
