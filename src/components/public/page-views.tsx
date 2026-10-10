import type { AboutContent } from "@/lib/about-defaults";
import type { LegacyContent, LegacyMilestone } from "@/lib/legacy-defaults";
import type { ContactDetails, StaticBlock } from "@/lib/static-blocks";
import { AboutMain } from "./about-page";
import { LegacyMain } from "./legacy-page";
import { ContactInquiry } from "./contact-inquiry";
import { SiteShellHeader } from "./site-shell-header";
import { SiteShellFooter } from "./site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "./delivered-scripts";
import { DeliveredBodyClass } from "./delivered-body-class";

// The About, Legacy and Contact pages. Shared by the public routes and the
// admin unsaved-changes preview so both render identically.

const preview = (note?: string) => note ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{note}</div> : null;

export function AboutView({ blocks, previewNote }: { blocks: StaticBlock[]; previewNote?: string }) {
  const hero = blocks.find((block) => block.type === "hero");
  const about = blocks.find((block) => block.type === "about") as (StaticBlock & AboutContent) | undefined;
  const content: AboutContent = {
    heading: hero?.heading,
    heroText: hero?.text,
    heroImage: hero?.image,
    story: blocks.filter((block) => block.type === "paragraph").map((block) => block.text).filter((text): text is string => Boolean(text)),
    ...(about ?? {}),
  };
  return <>
    {preview(previewNote)}
    <DeliveredBodyClass bodyClass="home-development-page about-design-page" />
    <SiteShellHeader />
    <AboutMain content={content} />
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page about-design-page" />
  </>;
}

export function LegacyView({ blocks, previewNote }: { blocks: StaticBlock[]; previewNote?: string }) {
  const hero = blocks.find((block) => block.type === "hero");
  const timeline = blocks.find((block) => block.type === "legacy") as (StaticBlock & { timeline?: LegacyMilestone[] }) | undefined;
  const content: LegacyContent = { heading: hero?.heading, text: hero?.text, image: hero?.image, timeline: timeline?.timeline };
  return <>
    {preview(previewNote)}
    <DeliveredBodyClass bodyClass="home-development-page legacy-design-page" />
    <SiteShellHeader />
    <LegacyMain content={content} />
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page legacy-design-page" />
  </>;
}

export function ContactView({ blocks, contact, previewNote }: { blocks: StaticBlock[]; contact: ContactDetails; previewNote?: string }) {
  const hero = blocks.find((block) => block.type === "hero") ?? {};
  return <>
    {preview(previewNote)}
    <DeliveredBodyClass bodyClass="home-development-page kpd-page contact-page" />
    <SiteShellHeader />
<main id="top" className="contact-main page-reference-main"><section className="page-reference-hero" aria-label="Contact"><img src={hero.image || "/legacy/assets/images/experience-center/hq/10.jpg"} alt="KPD Experience Center reception lounge" /><div className="page-reference-hero-copy motion-reveal"><span>Contact</span><h1>{hero.heading || <>Plan a visit,<br />or start a conversation.</>}</h1><p>{hero.text || "Tell us what you're looking for and the right person will respond. Previews, walkthroughs, and advisory conversations are handled through the KPD Experience Center."}</p></div></section><section className="contact-inquiry" id="experience-center" aria-label="Contact inquiry"><div className="contact-inquiry-shell"><ContactInquiry email={contact.email} phone={contact.phone} website={contact.website} /></div></section></main>
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page kpd-page contact-page" />
  </>;
}
