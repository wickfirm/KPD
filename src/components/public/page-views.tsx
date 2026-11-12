import type { AboutContent } from "@/lib/about-defaults";
import { textStyleProps } from "@/lib/text-style";
import Link from "next/link";
import { emphasisNodes } from "@/lib/emphasis";
import { sectionFilter } from "@/lib/section-visibility";
import { loadHiddenSections } from "@/lib/section-visibility-store";
import { pickLegacyGalleryLight, type LegacyContent, type LegacyMilestone } from "@/lib/legacy-defaults";
import type { ContactDetails, StaticBlock } from "@/lib/static-blocks";
import { AboutMain } from "./about-page";
import { LegacyMain } from "./legacy-page";
import { ContactInquiry } from "./contact-inquiry";
import { mergeContactInquiryContent } from "@/lib/contact-inquiry-content";
import { SiteShellHeader } from "./site-shell-header";
import { SiteShellFooter } from "./site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "./delivered-scripts";
import { DeliveredBodyClass } from "./delivered-body-class";

// The About, Legacy and Contact pages. Shared by the public routes and the
// admin unsaved-changes preview so both render identically.

const preview = (note?: string) => note ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{note}</div> : null;

export async function AboutView({ blocks, previewNote }: { blocks: StaticBlock[]; previewNote?: string }) {
  const hero = blocks.find((block) => block.type === "hero");
  const about = blocks.find((block) => block.type === "about") as (StaticBlock & AboutContent) | undefined;
  const content: AboutContent = {
    eyebrow: hero?.eyebrow as string | undefined,
    heading: hero?.heading,
    headingStyle: hero?.headingStyle as AboutContent["headingStyle"],
    heroText: hero?.text,
    heroTextStyle: hero?.textStyle as AboutContent["heroTextStyle"],
    heroImage: hero?.image,
    story: blocks.filter((block) => block.type === "paragraph").map((block) => block.text).filter((text): text is string => Boolean(text)),
    ...(about ?? {}),
  };
  return <>
    {preview(previewNote)}
    <DeliveredBodyClass bodyClass="home-development-page about-design-page" />
    <SiteShellHeader />
    <AboutMain content={content} hidden={await loadHiddenSections("about")} />
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page about-design-page" />
  </>;
}

export async function LegacyView({ blocks, previewNote }: { blocks: StaticBlock[]; previewNote?: string }) {
  const hero = blocks.find((block) => block.type === "hero");
  const timeline = blocks.find((block) => block.type === "legacy") as (StaticBlock & { timeline?: LegacyMilestone[] }) | undefined;
  const content: LegacyContent = { ...pickLegacyGalleryLight(timeline), eyebrow: hero?.eyebrow as string | undefined, heading: hero?.heading, text: hero?.text, image: hero?.image, headingStyle: hero?.headingStyle as LegacyContent["headingStyle"], textStyle: hero?.textStyle as LegacyContent["textStyle"], timeline: timeline?.timeline, ctaLabel: timeline?.ctaLabel as string | undefined, ctaUrl: timeline?.ctaUrl as string | undefined, ctaVisible: timeline?.ctaVisible as boolean | undefined };
  return <>
    {preview(previewNote)}
    <DeliveredBodyClass bodyClass="home-development-page legacy-design-page" />
    <SiteShellHeader />
    <LegacyMain content={content} hidden={await loadHiddenSections("legacy")} />
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page legacy-design-page" />
  </>;
}

export async function ContactView({ blocks, contact, previewNote }: { blocks: StaticBlock[]; contact: ContactDetails; previewNote?: string }) {
  const hero = blocks.find((block) => block.type === "hero") ?? {};
  const inquiryForm = blocks.find((block) => block.type === "contact-form");
  const inquiryCopy = mergeContactInquiryContent(inquiryForm);
  const shown = sectionFilter(await loadHiddenSections("contact"));
  return <>
    {preview(previewNote)}
    <DeliveredBodyClass bodyClass="home-development-page kpd-page contact-page" />
    <SiteShellHeader />
<main id="top" className="contact-main g21">
      {shown("hero") ? <section className="g21-hero" aria-labelledby="g21-contact-title">
        <div className="g21-wrap">
          <nav className="g21-crumbs g21-cap" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{(hero.eyebrow as string) || "Contact"}</span></nav>
          <div className="g21-title g21-title--contact">
            <h1 id="g21-contact-title" style={textStyleProps(hero.headingStyle as AboutContent["headingStyle"])}>{emphasisNodes((hero.heading as string) || "Contact")}</h1>
            <div>
              {hero.text ? <p className="g21-lede" style={textStyleProps(hero.textStyle as AboutContent["heroTextStyle"])}>{hero.text as string}</p> : null}
              {contact.phone || contact.email ? <div className="g21-quick">
                {contact.phone ? <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}><span className="g21-cap">{inquiryCopy.quickCallLabel}</span><b>{contact.phone}</b></a> : null}
                {contact.email ? <a href={`mailto:${contact.email}`}><span className="g21-cap">{inquiryCopy.quickEmailLabel}</span><b>{contact.email}</b></a> : null}
              </div> : null}
            </div>
          </div>
        </div>
      </section> : null}
      {shown("form") ? <section className="g21-contact-sec" id="experience-center" aria-label="Contact inquiry">
        <ContactInquiry email={contact.email} phone={contact.phone} website={contact.website} image={hero.image as string | undefined} content={inquiryForm} />
      </section> : null}
    </main>
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page kpd-page contact-page" />
  </>;
}
