import type { ReactNode } from "react";
import Link from "next/link";
import { htmlLf } from "@/lib/html-lf";
import { homeDefaults, type DevelopmentCard, type GalleryPanel, type HomeSettings, type HomeValue, type StatItem } from "@/lib/home-defaults";

import { textStyleAttribute, textStyleProps } from "@/lib/text-style";
import { emphasisNodes } from "@/lib/emphasis";
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
  /// The button and its supporting text move as a pair (client feedback 15).
  const position = settings.newsCtaPosition === "above" || settings.newsCtaPosition === "left" || settings.newsCtaPosition === "right" ? settings.newsCtaPosition : "below";
  const sectionClass = position === "below" ? "pdf-section pdf-events-head" : `pdf-section pdf-events-head pdf-events-head--cta-${position === "above" ? "above" : "side"}${position === "left" ? " pdf-events-head--cta-left" : ""}`;
  const copy = text ? `<p${textStyleAttribute(settings.newsBodyStyle)}>${escapeHtml(text).replaceAll("\n", "<br>")}</p>` : "";
  const button = cta ? `<a href="${escapeHtml(ctaUrl)}">${escapeHtml(cta)}</a>` : "";
  /// Replace delivered editable text even when the CMS value is blank, so old
  /// copy can never reappear as a fallback.
  const section = heading || text || cta
    ? `<section class="${sectionClass}" id="events">${heading ? `<h2${textStyleAttribute(settings.newsHeadingStyle)}>${escapeHtml(heading).replaceAll("\n", "<br>")}</h2>` : ""}<div>${position === "above" ? `${button}${copy}` : `${copy}${button}`}</div></section>`
    : "";
  return staticTail.replace(/<section class="pdf-section pdf-events-head" id="events">[\s\S]*?<\/section>/, section);
}

/// Gallery-light hero: full-bleed media with the page headline, a supporting
/// line, the CTA and a pause control overlaid at the bottom. The headline is
/// the page's single <h1>; when the CMS clears the hero media it falls back
/// into the intro so a heading always exists.
export function HomeHero({ video, image, heading, text, ctaLabel, ctaUrl, headingStyle }: { video?: string; image?: string; heading?: string; text?: string; ctaLabel?: string; ctaUrl?: string; headingStyle?: HomeSettings["introHeadingStyle"] }) {
  const hasContent = Boolean(heading?.trim() || text?.trim() || ctaLabel?.trim());
  return (
    <section className="pdf-section pdf-hero">
      {video
        ? <video src={video} poster={image || undefined} autoPlay muted loop playsInline preload="auto" aria-label="KPD Experience Center presentation gallery" />
        : image ? <img src={image} alt="KPD Experience Center presentation gallery" /> : null}
      {hasContent ? (
        <div className="pdf-hero-content">
          {heading?.trim() ? <h1 className="pdf-hero-title" style={textStyleProps(headingStyle)}>{emphasisNodes(heading)}</h1> : null}
          <div className="pdf-hero-row">
            {text?.trim() ? <p className="pdf-hero-text">{emphasisNodes(text)}</p> : null}
            <div className="pdf-hero-actions">
              {ctaLabel?.trim() ? <Link className="pdf-hero-cta" href={ctaUrl || "#developments"}>{ctaLabel} <span className="pdf-hero-arrow" aria-hidden="true">→</span></Link> : null}
              {video ? (
                <button className="pdf-hero-toggle" type="button" data-hero-toggle aria-label="Pause video">
                  <svg className="pdf-hero-icon-pause" width="12" height="14" viewBox="0 0 12 14" aria-hidden="true"><rect x="1" y="1" width="3" height="12" fill="currentColor" /><rect x="8" y="1" width="3" height="12" fill="currentColor" /></svg>
                  <svg className="pdf-hero-icon-play" width="12" height="14" viewBox="0 0 12 14" aria-hidden="true"><path d="M2 1l9 6-9 6z" fill="currentColor" /></svg>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function HomeIntro({ heading, paragraphs, headingStyle, bodyStyle, kicker, values }: { heading: string; paragraphs: string[]; headingStyle?: HomeSettings["introHeadingStyle"]; bodyStyle?: HomeSettings["introBodyStyle"]; kicker?: string; values?: HomeValue[] }) {
  /// The headline normally lives in the hero; the parameter only fills again
  /// when the hero media is cleared, so the page keeps exactly one <h1>.
  const [statement, ...extraParagraphs] = paragraphs;
  return (
    <section className="pdf-section pdf-intro" id="about">
      {heading ? <h1 className="pdf-intro-heading" style={textStyleProps(headingStyle)}>{multiline(heading)}</h1> : null}
      <div className="pdf-intro-grid">
        {kicker ? <p className="pdf-kicker">{kicker}</p> : null}
        <div className="pdf-intro-copy">
          {statement !== undefined ? <p className="pdf-statement" style={textStyleProps(bodyStyle)}>{emphasisNodes(statement)}</p> : null}
          {extraParagraphs.map((paragraph, index) => <p className="pdf-intro-note" key={index}>{emphasisNodes(paragraph)}</p>)}
        </div>
      </div>
      {values?.length ? (
        <div className="pdf-values">
          {values.filter((value) => value.title.trim() || value.body.trim()).map((value, index) => (
            <div className="pdf-value" key={`${value.title}-${index}`}>
              <p className="pdf-value-cap">Value</p>
              <h3>{value.title}</h3>
              {value.body.trim() ? <p>{value.body}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function HomeDevelopmentText({ text, bodyStyle, position = "below" }: { text: string; bodyStyle?: HomeSettings["developmentTextStyle"]; position?: "above" | "below" }) {
  return <section className={`pdf-section pdf-development-text pdf-development-text--${position}`} aria-label="Our development standard"><p style={textStyleProps(bodyStyle)}>{multiline(text)}</p></section>;
}

/// "$7.69B" -> { main: "$7.69", suffix: "B" }. The suffix renders beside the
/// big figure instead of inside the <strong>, so the delivered count-up (which
/// rewrites the strong's text) keeps working untouched.
function splitStatValue(value: string): { main: string; suffix: string } {
  const match = value.trim().match(/^([^A-Za-z]*[0-9.,]*[0-9])([A-Za-z]*)$/);
  return match ? { main: match[1], suffix: match[2] } : { main: value.trim(), suffix: "" };
}

/// Gallery-light numbers band: the first CMS figure is the large headline
/// number, the rest form the breakdown columns beside it. The band keeps the
/// pdf-stat classes so the delivered count-up and reveal animations bind.
export function HomeNumbers({ kicker, stats, note, noteUrl, valueStyle, labelStyle }: { kicker?: string; stats: StatItem[]; note: string; noteUrl?: string; valueStyle?: HomeSettings["statsValueStyle"]; labelStyle?: HomeSettings["statsLabelStyle"] }) {
  const [headline, ...legend] = stats;
  if (!headline && !note.trim()) return null;
  const headlineValue = splitStatValue(headline?.value ?? "");
  return (
    <section className="pdf-section pdf-numbers" id="numbers" aria-label="Kasumigaseki Capital figures">
      <div className="pdf-numbers-inner">
        <div className="pdf-numbers-head">
          {kicker ? <p className="pdf-kicker">{kicker}</p> : null}
          {headline ? (
            <div className="pdf-stat pdf-stat-big">
              <strong style={textStyleProps(valueStyle)}>{headlineValue.main}</strong>
              {headlineValue.suffix ? <small className="pdf-stat-suffix" style={textStyleProps(valueStyle)}>{headlineValue.suffix}</small> : null}
            </div>
          ) : null}
        </div>
        <div className="pdf-numbers-side">
          {legend.length ? (
            <div className="pdf-legend">
              {legend.map((stat, index) => (
                <div className="pdf-stat pdf-legend-item" key={`${stat.label}-${index}`}>
                  <span style={textStyleProps(labelStyle)}>{stat.label}</span>
                  <strong style={textStyleProps(valueStyle)}>{stat.value}</strong>
                </div>
              ))}
            </div>
          ) : null}
          {note.trim() ? <p className="stats-as-of">{noteUrl
            ? <a href={noteUrl} target={/^https?:/i.test(noteUrl) ? "_blank" : undefined} rel={/^https?:/i.test(noteUrl) ? "noreferrer" : undefined}>{note}</a>
            : note}</p> : null}
        </div>
      </div>
    </section>
  );
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

export function HomeContactBlock({ heading, text, ctaLabel, ctaUrl, ctaVisible = true, headingStyle, bodyStyle, kicker }: { heading: string; text: string; ctaLabel?: string; ctaUrl?: string; ctaVisible?: boolean; headingStyle?: HomeSettings["contactHeadingStyle"]; bodyStyle?: HomeSettings["contactBodyStyle"]; kicker?: string }) {
  return (
    <section className="pdf-section pdf-contact-block" id="contact">
      {kicker ? <p className="pdf-kicker">{kicker}</p> : null}
      <div><h2 style={textStyleProps(headingStyle)}>{multiline(heading)}</h2></div>
      <div className="pdf-contact-copy">
        <p style={textStyleProps(bodyStyle)}>{multiline(text)}</p>
        {ctaVisible && ctaLabel ? <Link href={ctaUrl || "/contact#experience-center"}>{ctaLabel} <span className="pdf-contact-arrow" aria-hidden="true">→</span></Link> : null}
      </div>
    </section>
  );
}

/// The delivered gallery uses exactly five panels; the CMS editor enforces the
/// same count, so CMS images replace all five together.
/// The delivered gallery uses exactly five panels; the CMS editor enforces the
/// same count, so CMS images replace all five together. Gallery-light batch 4
/// adds the "01 / 05" index and the caption + "View" label bar; the delivered
/// hover/active accordion and lightbox bindings are untouched.
export function HomeExperienceGallery({ images, captions }: { images?: string[]; captions?: string[] }) {
  const panels: GalleryPanel[] = images?.length === 5
    ? images.map((image, index) => ({ key: `cms-${index + 1}`, image, caption: captions?.[index]?.trim() ?? "" }))
    : [];
  if (!panels.length) return null;
  const total = String(panels.length).padStart(2, "0");
  return (
    <section className="pdf-section pdf-vertical-gallery pdf-gallery-flex" id="experience-center" aria-label="Experience Center gallery" data-gallery-flex>
      {panels.map((panel, index) => (
        <button className="pdf-gallery-panel" type="button" data-gallery-panel={panel.key} data-lightbox-src={panel.image} data-lightbox-caption={panel.caption} key={panel.key}>
          <img src={panel.image} alt={panel.caption} />
          <span className="pdf-gallery-index" aria-hidden="true">{String(index + 1).padStart(2, "0")} / {total}</span>
          <span className="pdf-gallery-lab" aria-hidden="true">
            <span>{panel.caption}</span>
            <span>View ↗</span>
          </span>
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
  const introKicker = settings.introKicker ?? homeDefaults.introKicker;
  const introValues = settings.introValues ?? homeDefaults.introValues;
  /// Delivered gallery fallback: the defaults' five panels (CMS images win).
  const experienceImages = settings.experienceImages ?? homeDefaults.galleryPanels.map((panel) => panel.image);
  const experienceCaptions = settings.experienceCaptions ?? homeDefaults.galleryPanels.map((panel) => panel.caption);
  const hasIntroduction = Boolean(settings.introHeading?.trim() || introParagraphs.length || (introValues ?? []).some((value) => value.title.trim() || value.body.trim()));
  const hasNumbers = Boolean(introStats.length || settings.statsNote?.trim());
  const hasContact = Boolean(settings.contactHeading?.trim() || settings.contactText?.trim());
  const heroMedia = settings.heroVideo?.trim() || settings.heroImage?.trim();
  /// The page headline renders in the hero; empty-string CMS values override
  /// the defaults, undefined falls back to them.
  const heroHeading = settings.introHeading ?? "";
  const headingInHero = Boolean(heroMedia && heroHeading.trim());
  const heroText = settings.heroText ?? homeDefaults.heroText;
  const heroCtaLabel = settings.heroCtaLabel ?? homeDefaults.heroCtaLabel;
  const heroCtaUrl = settings.heroCtaUrl ?? homeDefaults.heroCtaUrl;
  return (
    <main className="development-pdf-home" id="top">
      {heroMedia ? <HomeHero video={settings.heroVideo?.trim() || undefined} image={settings.heroImage?.trim() || undefined} heading={heroHeading} text={heroText} ctaLabel={heroCtaLabel} ctaUrl={heroCtaUrl} headingStyle={settings.introHeadingStyle} /> : null}
      {hasIntroduction ? <HomeIntro heading={headingInHero ? "" : heroHeading} paragraphs={introParagraphs} headingStyle={settings.introHeadingStyle} bodyStyle={settings.introBodyStyle} kicker={introKicker} values={introValues} /> : null}
      {hasNumbers ? <HomeNumbers kicker={settings.statsKicker ?? homeDefaults.statsKicker} stats={introStats} note={settings.statsNote ?? ""} noteUrl={settings.statsNoteUrl} valueStyle={settings.statsValueStyle} labelStyle={settings.statsLabelStyle} /> : null}
      {bannerSlides.length ? <HomeDevelopmentSlider heading={settings.developmentHeading ?? ""} bannerText={settings.developmentBannerText === undefined ? homeDefaults.developmentBannerText : settings.developmentBannerText} slides={bannerSlides} ctaLabel={settings.developmentCtaLabel || "View all developments"} ctaUrl={settings.developmentCtaUrl} ctaVisible={settings.developmentCtaVisible !== false} headingStyle={textStyleProps(settings.developmentHeadingStyle)} kicker={settings.developmentKicker ?? homeDefaults.developmentKicker} caption={settings.developmentText} captionVisible={settings.developmentTextVisible === true} captionPosition={settings.developmentTextPosition === "above" ? "above" : "below"} captionStyle={textStyleProps(settings.developmentTextStyle)} /> : settings.developmentTextVisible && settings.developmentText?.trim() ? <HomeDevelopmentText text={settings.developmentText} bodyStyle={settings.developmentTextStyle} position={settings.developmentTextPosition === "above" ? "above" : "below"} /> : null}
      <HomeDevelopmentCards cards={developmentCards} ctaLabel={settings.cardCtaLabel || "Explore"} ctaVisible={settings.cardCtaVisible !== false} />
      {hasContact ? <HomeContactBlock heading={settings.contactHeading ?? ""} text={settings.contactText ?? ""} ctaLabel={settings.contactCtaLabel || "Book a visit"} ctaUrl={settings.contactCtaUrl} ctaVisible={settings.contactCtaVisible !== false} headingStyle={settings.contactHeadingStyle} bodyStyle={settings.contactBodyStyle} kicker={settings.contactKicker ?? homeDefaults.contactKicker} /> : null}
      <HomeExperienceGallery images={experienceImages.filter(Boolean)} captions={experienceCaptions} />
      <div className="pdf-static-tail" dangerouslySetInnerHTML={{ __html: htmlLf(withHomeNewsHeader(staticTail, settings)) }} />
    </main>
  );
}
