import type { ReactNode } from "react";
import Link from "next/link";
import { htmlLf } from "@/lib/html-lf";
import { homeDefaults, type DevelopmentCard, type GalleryPanel, type HomeSettings, type StatItem } from "@/lib/home-defaults";
import { textStyleAttribute, textStyleProps } from "@/lib/text-style";
import { HomeDevelopmentSlider } from "./home-development-slider";

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/// Replaces the one CMS-managed band inside the otherwise delivered static
/// homepage tail. Values are escaped before the tail is rendered as HTML.
function withHomeNewsHeader(staticTail: string, settings: HomeSettings) {
  const heading = settings.newsHeading?.trim() ?? "";
  const text = settings.newsText?.trim() ?? "";
  const cta = settings.newsCtaVisible === false ? "" : settings.newsCta?.trim() ?? "";
  const ctaUrl = settings.newsCtaUrl?.trim() || "#news";
  /// Replace delivered editable text even when the CMS value is blank, so old
  /// copy can never reappear as a fallback.
  const section = heading || text || cta
    ? `<section class="pdf-section pdf-events-head" id="events">${heading ? `<h2${textStyleAttribute(settings.newsHeadingStyle)}>${escapeHtml(heading)}</h2>` : ""}<div>${text ? `<p${textStyleAttribute(settings.newsBodyStyle)}>${escapeHtml(text).replaceAll("\n", "<br>")}</p>` : ""}${cta ? `<a href="${escapeHtml(ctaUrl)}">${escapeHtml(cta)}</a>` : ""}</div></section>`
    : "";
  return staticTail.replace(/<section class="pdf-section pdf-events-head" id="events">[\s\S]*?<\/section>/, section);
}

export function HomeHero({ video }: { video: string }) {
  return (
    <section className="pdf-section pdf-hero">
      <video src={video} autoPlay muted playsInline preload="auto" aria-label="KPD Experience Center presentation gallery" />
    </section>
  );
}

export function HomeIntro({ heading, paragraphs, stats, statsNote, headingStyle, bodyStyle }: { heading: string; paragraphs: string[]; stats: StatItem[]; statsNote: string; headingStyle?: HomeSettings["introHeadingStyle"]; bodyStyle?: HomeSettings["introBodyStyle"] }) {
  return (
    <section className="pdf-section pdf-intro" id="about">
      <div className="pdf-intro-grid">
        <h1 style={textStyleProps(headingStyle)}>{multiline(heading)}</h1>
        <div className="pdf-intro-copy">
          {paragraphs.map((paragraph, index) => <p key={index} style={textStyleProps(bodyStyle)}>{multiline(paragraph)}</p>)}
        </div>
      </div>
      <div className="pdf-stat-grid">
        {stats.map((stat, index) => (
          <div className="pdf-stat" key={`${stat.label}-${index}`}><strong><Link href="/about">{stat.value}</Link></strong><span>{stat.label}</span></div>
        ))}
        {statsNote ? <p className="stats-as-of">{statsNote}</p> : null}
      </div>
    </section>
  );
}

export function HomeDevelopmentText({ text, bodyStyle, position = "below" }: { text: string; bodyStyle?: HomeSettings["developmentTextStyle"]; position?: "above" | "below" }) {
  return <section className={`pdf-section pdf-development-text pdf-development-text--${position}`} aria-label="Our development standard"><p style={textStyleProps(bodyStyle)}>{multiline(text)}</p></section>;
}

export function HomeDevelopmentCards({ cards, ctaLabel = "Explore", ctaVisible = true }: { cards: DevelopmentCard[]; ctaLabel?: string; ctaVisible?: boolean }) {
  if (!cards.length) return null;
  const countClass = cards.length < 3 ? ` pdf-development-cards--count-${cards.length}` : "";
  return (
    <section className={`pdf-section pdf-development-cards${countClass}`} id="development-cards" aria-label="Our developments">
      {cards.map((card, index) => (
        <a className="pdf-dev-card" href={card.href} key={`${card.href}-${index}`}>
          {card.image ? <img src={card.image} alt={card.title} /> : null}
          <div className="pdf-dev-card-body">
            <h3>{card.title}</h3>
            <p>{card.copy}</p>
            {ctaVisible && ctaLabel ? <span>{ctaLabel}</span> : null}
          </div>
        </a>
      ))}
    </section>
  );
}

export function HomeContactBlock({ heading, text, ctaLabel, ctaUrl, ctaVisible = true, headingStyle, bodyStyle }: { heading: string; text: string; ctaLabel?: string; ctaUrl?: string; ctaVisible?: boolean; headingStyle?: HomeSettings["contactHeadingStyle"]; bodyStyle?: HomeSettings["contactBodyStyle"] }) {
  return (
    <section className="pdf-section pdf-contact-block" id="contact">
      <div><h2 style={textStyleProps(headingStyle)}>{multiline(heading)}</h2></div>
      <div className="pdf-contact-copy">
        <p style={textStyleProps(bodyStyle)}>{multiline(text)}</p>
        {ctaVisible && ctaLabel ? <Link href={ctaUrl || "/contact#experience-center"}>{ctaLabel}</Link> : null}
      </div>
    </section>
  );
}

/// The delivered gallery uses exactly five panels; the CMS editor enforces the
/// same count, so CMS images replace all five together.
export function HomeExperienceGallery({ images, captions }: { images?: string[]; captions?: string[] }) {
  const panels: GalleryPanel[] = images?.length === 5
    ? images.map((image, index) => ({ key: `cms-${index + 1}`, image, caption: captions?.[index]?.trim() ?? "" }))
    : [];
  if (!panels.length) return null;
  return (
    <section className="pdf-section pdf-vertical-gallery pdf-gallery-flex" id="experience-center" aria-label="Experience Center gallery" data-gallery-flex>
      {panels.map((panel) => (
        <button className="pdf-gallery-panel" type="button" data-gallery-panel={panel.key} data-lightbox-src={panel.image} data-lightbox-caption={panel.caption} key={panel.key}>
          <img src={panel.image} alt={panel.caption} />
        </button>
      ))}
    </section>
  );
}

/// The homepage <main>: CMS content is authoritative. The delivered static
/// tail only supplies structural markup; editable text is replaced above.
export function HomeMain({ settings, staticTail, developmentCards }: { settings: HomeSettings; staticTail: string; developmentCards: DevelopmentCard[] }) {
  const introParagraphs = settings.introParagraphs?.filter(Boolean) ?? [];
  const introStats = settings.introStats ?? [];
  const bannerSlides = settings.bannerSlides ?? [];
  const hasIntroduction = Boolean(settings.introHeading?.trim() || introParagraphs.length || introStats.length || settings.statsNote?.trim());
  const hasContact = Boolean(settings.contactHeading?.trim() || settings.contactText?.trim());
  return (
    <main className="development-pdf-home" id="top">
      {settings.heroVideo?.trim() ? <HomeHero video={settings.heroVideo} /> : null}
      {hasIntroduction ? <HomeIntro heading={settings.introHeading ?? ""} paragraphs={introParagraphs} stats={introStats} statsNote={settings.statsNote ?? ""} headingStyle={settings.introHeadingStyle} bodyStyle={settings.introBodyStyle} /> : null}
      {bannerSlides.length ? <HomeDevelopmentSlider heading={settings.developmentHeading ?? ""} bannerText={settings.developmentBannerText === undefined ? homeDefaults.developmentBannerText : settings.developmentBannerText} slides={bannerSlides} ctaLabel={settings.developmentCtaLabel || "View all developments"} ctaUrl={settings.developmentCtaUrl} ctaVisible={settings.developmentCtaVisible !== false} headingPosition={settings.developmentHeadingPosition ?? "overlay"} headingStyle={textStyleProps(settings.developmentHeadingStyle)} caption={settings.developmentText} captionVisible={settings.developmentTextVisible === true} captionPosition={settings.developmentTextPosition === "above" ? "above" : "below"} captionStyle={textStyleProps(settings.developmentTextStyle)} /> : settings.developmentTextVisible && settings.developmentText?.trim() ? <HomeDevelopmentText text={settings.developmentText} bodyStyle={settings.developmentTextStyle} position={settings.developmentTextPosition === "above" ? "above" : "below"} /> : null}
      <HomeDevelopmentCards cards={developmentCards} ctaLabel={settings.cardCtaLabel || "Explore"} ctaVisible={settings.cardCtaVisible !== false} />
      {hasContact ? <HomeContactBlock heading={settings.contactHeading ?? ""} text={settings.contactText ?? ""} ctaLabel={settings.contactCtaLabel || "Book a visit"} ctaUrl={settings.contactCtaUrl} ctaVisible={settings.contactCtaVisible !== false} headingStyle={settings.contactHeadingStyle} bodyStyle={settings.contactBodyStyle} /> : null}
      <HomeExperienceGallery images={settings.experienceImages?.filter(Boolean)} captions={settings.experienceCaptions} />
      <div className="pdf-static-tail" dangerouslySetInnerHTML={{ __html: htmlLf(withHomeNewsHeader(staticTail, settings)) }} />
    </main>
  );
}
