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
import { getLocale } from "@/lib/locale";
import { localeHref } from "@/lib/locales";
import { t } from "@/lib/i18n";

// The About, Legacy and Contact pages. Shared by the public routes and the
// admin unsaved-changes preview so both render identically.

const preview = (note?: string) => note ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{note}</div> : null;

export async function AboutView({ blocks, previewNote }: { blocks: StaticBlock[]; previewNote?: string }) {
  const locale = await getLocale();
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
    <AboutMain content={content} hidden={await loadHiddenSections("about")} locale={locale} />
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page about-design-page" />
  </>;
}

export async function LegacyView({ blocks, previewNote }: { blocks: StaticBlock[]; previewNote?: string }) {
  const locale = await getLocale();
  const hero = blocks.find((block) => block.type === "hero");
  const timeline = blocks.find((block) => block.type === "legacy") as (StaticBlock & { timeline?: LegacyMilestone[] }) | undefined;
  const content: LegacyContent = { ...pickLegacyGalleryLight(timeline), eyebrow: hero?.eyebrow as string | undefined, heading: hero?.heading, text: hero?.text, image: hero?.image, headingStyle: hero?.headingStyle as LegacyContent["headingStyle"], textStyle: hero?.textStyle as LegacyContent["textStyle"], timeline: timeline?.timeline, ctaLabel: timeline?.ctaLabel as string | undefined, ctaUrl: timeline?.ctaUrl as string | undefined, ctaVisible: timeline?.ctaVisible as boolean | undefined };
  return <>
    {preview(previewNote)}
    <DeliveredBodyClass bodyClass="home-development-page legacy-design-page" />
    <SiteShellHeader />
    <LegacyMain content={content} hidden={await loadHiddenSections("legacy")} locale={locale} />
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page legacy-design-page" />
  </>;
}

/// `englishBlocks` is the page as it is in English. On another language's page
/// the form shows a choice in that language and posts the English entry, so
/// it needs both.
export async function ContactView({ blocks, contact, previewNote, englishBlocks }: { blocks: StaticBlock[]; contact: ContactDetails; previewNote?: string; englishBlocks?: StaticBlock[] }) {
  const hero = blocks.find((block) => block.type === "hero") ?? {};
  const inquiryForm = blocks.find((block) => block.type === "contact-form");
  const inquiryCopy = mergeContactInquiryContent(inquiryForm);
  const [shownSections, locale] = await Promise.all([loadHiddenSections("contact"), getLocale()]);
  const shown = sectionFilter(shownSections);
  return <>
    {preview(previewNote)}
    <DeliveredBodyClass bodyClass="home-development-page kpd-page contact-page" />
    <SiteShellHeader />
<main id="top" className="contact-main g21">
      {shown("hero") ? <section className="g21-hero" aria-labelledby="g21-contact-title">
        <div className="g21-wrap">
          <nav className="g21-crumbs g21-cap" aria-label={t(locale, "breadcrumb.label")}><Link href={localeHref("/", locale)}>{t(locale, "nav.home")}</Link><span aria-hidden="true">/</span><span aria-current="page">{(hero.eyebrow as string) || t(locale, "nav.contact")}</span></nav>
          <div className="g21-title g21-title--contact">
            <h1 id="g21-contact-title" style={textStyleProps(hero.headingStyle as AboutContent["headingStyle"])}>{emphasisNodes((hero.heading as string) || t(locale, "nav.contact"))}</h1>
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
      {shown("form") ? <section className="g21-contact-sec" id="experience-center" aria-label={t(locale, "contact.inquiry")}>
        <ContactInquiry locale={locale} email={contact.email} phone={contact.phone} website={contact.website} image={hero.image as string | undefined} content={inquiryForm} english={englishBlocks?.find((block) => block.type === "contact-form")} />
      </section> : null}
    </main>
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page kpd-page contact-page" />
  </>;
}
