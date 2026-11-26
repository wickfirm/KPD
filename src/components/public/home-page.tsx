import type { ReactNode } from "react";
import Link from "next/link";
import { htmlLf } from "@/lib/html-lf";
import { homeDefaults, resolveHeroMedia, type DevelopmentCard, type GalleryPanel, type HomeSettings, type HomeValue, type StatItem } from "@/lib/home-defaults";

import { textStyleAttribute, textStyleProps } from "@/lib/text-style";
import { emphasisNodes } from "@/lib/emphasis";
import { HomeDevelopmentSlider } from "./home-development-slider";
import { sectionFilter } from "@/lib/section-visibility";
import { homeNewsGridHtml } from "@/lib/home-news";
import type { NewsListItem } from "@/lib/news-listing";
import { localeHref, localizeHtmlLinks, type Locale } from "@/lib/locales";
import { t } from "@/lib/i18n";

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/// Replaces the one CMS-managed band inside the otherwise delivered static
/// homepage tail. Values are escaped before the tail is rendered as HTML.
function withHomeNewsHeader(staticTail: string, settings: HomeSettings, articles: readonly NewsListItem[], locale: Locale) {
  const heading = settings.newsHeading?.trim() ?? "";
  const text = settings.newsText?.trim() ?? "";
  const cta = settings.newsCtaVisible === false ? "" : settings.newsCta?.trim() ?? "";
  const ctaUrl = settings.newsCtaUrl?.trim() || "#news";
  /// The button and its supporting text move as a pair (client feedback 15).
  const position = settings.newsCtaPosition === "above" || settings.newsCtaPosition === "left" || settings.newsCtaPosition === "right" ? settings.newsCtaPosition : "below";
  /// Same markup and classes as the Experience Centre header (HomeContactBlock),
  /// so both section headers share one layout: heading left, copy + filled
  /// pill with an arrow right. pdf-news-head only keeps the news spacing.
  const sectionClass = position === "below" ? "pdf-section pdf-contact-block pdf-news-head" : `pdf-section pdf-contact-block pdf-news-head pdf-events-head--cta-${position === "above" ? "above" : "side"}${position === "left" ? " pdf-events-head--cta-left" : ""}`;
  const copy = text ? `<p${textStyleAttribute(settings.newsBodyStyle)}>${escapeHtml(text).replaceAll("\n", "<br>")}</p>` : "";
  const button = cta ? `<a href="${escapeHtml(ctaUrl)}">${escapeHtml(cta)} <span class="pdf-contact-arrow" aria-hidden="true">→</span></a>` : "";
  /// Replace delivered editable text even when the CMS value is blank, so old
  /// copy can never reappear as a fallback.
  const section = heading || text || cta
    ? `<section class="${sectionClass}" id="events"><div class="pdf-contact-heading">${heading ? `<h2${textStyleAttribute(settings.newsHeadingStyle)}>${escapeHtml(heading).replaceAll("\n", "<br>")}</h2>` : ""}</div><div class="pdf-contact-copy">${position === "above" ? `${button}${copy}` : `${copy}${button}`}</div></section>`
    : "";
  return withHomeNewsCards(staticTail.replace(/<section class="pdf-section pdf-events-head" id="events">[\s\S]*?<\/section>/, section), settings, articles, locale);
}

/// "Latest news" switched off: drop its heading band and card grid.
function withoutHomeNews(tail: string) {
  return tail
    .replace(/<section class="pdf-section pdf-events-head" id="events">[\s\S]*?<\/section>/, "")
    .replace(/<section class="pdf-section pdf-events-grid"[^>]*>[\s\S]*?<\/section>/, "");
}

/// The news grid under the band: the latest published articles, newest first
/// (see home-news.ts). No published articles removes the grid; the delivered
/// placeholder cards never show.
function withHomeNewsCards(tail: string, settings: HomeSettings, articles: readonly NewsListItem[], locale: Locale) {
  const grid = /<section class="pdf-section pdf-events-grid"[^>]*>[\s\S]*?<\/section>/;
  return tail.replace(grid, homeNewsGridHtml(articles, { label: settings.newsCardLabel?.trim() || t(locale, "home.cardCta"), ariaLabel: settings.newsHeading?.trim() || t(locale, "news.latest") }));
}

/// Gallery-light hero: full-bleed media with the page headline, a supporting
/// line, the CTA and a pause control overlaid at the bottom. The headline is
/// the page's single <h1>; when the CMS clears the hero media it falls back
/// into the intro so a heading always exists.
export function HomeHero({ video, image, heading, text, ctaLabel, ctaUrl, headingStyle, locale }: { video?: string; image?: string; heading?: string; text?: string; ctaLabel?: string; ctaUrl?: string; headingStyle?: HomeSettings["introHeadingStyle"]; locale: Locale }) {
  const hasContent = Boolean(heading?.trim() || text?.trim() || ctaLabel?.trim());
  return (
    <section className="pdf-section pdf-hero">
      {video
        ? <video src={video} poster={image || undefined} autoPlay muted loop playsInline preload="auto" aria-label={t(locale, "home.heroMedia")} />
        : image ? <img src={image} alt={t(locale, "home.heroMedia")} /> : null}
      {hasContent ? (
        <div className="pdf-hero-content">
          {heading?.trim() ? <h1 className="pdf-hero-title" style={textStyleProps(headingStyle)}>{emphasisNodes(heading)}</h1> : null}
          <div className="pdf-hero-row">
            {text?.trim() ? <p className="pdf-hero-text">{emphasisNodes(text)}</p> : null}
            <div className="pdf-hero-actions">
              {ctaLabel?.trim() ? <Link className="pdf-hero-cta" href={ctaUrl || "#developments"}>{ctaLabel} <span className="pdf-hero-arrow" aria-hidden="true">→</span></Link> : null}
              {video ? (
                <button className="pdf-hero-toggle" type="button" data-hero-toggle aria-label={t(locale, "home.pauseVideo")}>
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

export function HomeIntro({ heading, paragraphs, headingStyle, bodyStyle, kicker, values, locale }: { heading: string; paragraphs: string[]; headingStyle?: HomeSettings["introHeadingStyle"]; bodyStyle?: HomeSettings["introBodyStyle"]; kicker?: string; values?: HomeValue[]; locale: Locale }) {
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
          {values.filter((value) => value.title.trim() || value.body.trim()).map((value, index) => {
            /// undefined → the delivered caption, "" → no caption.
            const cap = value.cap === undefined ? t(locale, "home.value") : value.cap;
            return <div className="pdf-value" key={`${value.title}-${index}`}>
              {cap ? <p className="pdf-value-cap">{cap}</p> : null}
              <h3>{value.title}</h3>
              {value.body.trim() ? <p>{value.body}</p> : null}
            </div>;
          })}
        </div>
      ) : null}
    </section>
  );
}

export function HomeDevelopmentText({ text, bodyStyle, position = "below", locale }: { text: string; bodyStyle?: HomeSettings["developmentTextStyle"]; position?: "above" | "below"; locale: Locale }) {
  return <section className={`pdf-section pdf-development-text pdf-development-text--${position}`} aria-label={t(locale, "home.developmentStandard")}><p style={textStyleProps(bodyStyle)}>{multiline(text)}</p></section>;
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
export function HomeNumbers({ kicker, stats, note, noteUrl, valueStyle, labelStyle, locale }: { kicker?: string; stats: StatItem[]; note: string; noteUrl?: string; valueStyle?: HomeSettings["statsValueStyle"]; labelStyle?: HomeSettings["statsLabelStyle"]; locale: Locale }) {
  const [headline, ...legend] = stats;
  if (!headline && !note.trim()) return null;
  const headlineValue = splitStatValue(headline?.value ?? "");
  return (
    <section className="pdf-section pdf-numbers" id="numbers" aria-label={t(locale, "home.figures")}>
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

export function HomeDevelopmentCards({ cards, ctaLabel, ctaVisible = true, locale }: { cards: DevelopmentCard[]; ctaLabel?: string; ctaVisible?: boolean; locale: Locale }) {
  if (!cards.length) return null;
  const label = ctaLabel ?? t(locale, "home.cardCta");
  const countClass = cards.length < 3 ? ` pdf-development-cards--count-${cards.length}` : "";
  return (
    <section className={`pdf-section pdf-development-cards${countClass}`} id="development-cards" aria-label={t(locale, "home.developments")}>
      {cards.map((card, index) => (
        <a className="pdf-dev-card" href={card.href} key={`${card.href}-${index}`}>
          {card.image ? <img src={card.image} alt={card.title} /> : null}
          <div className="pdf-dev-card-body">
            <h3>{card.title}</h3>
            <p>{card.copy}</p>
            {ctaVisible && label ? <span>{label}</span> : null}
          </div>
        </a>
      ))}
    </section>
  );
}

export function HomeContactBlock({ heading, text, ctaLabel, ctaUrl, ctaVisible = true, headingStyle, bodyStyle, kicker, locale }: { heading: string; text: string; ctaLabel?: string; ctaUrl?: string; ctaVisible?: boolean; headingStyle?: HomeSettings["contactHeadingStyle"]; bodyStyle?: HomeSettings["contactBodyStyle"]; kicker?: string; locale: Locale }) {
  return (
    <section className="pdf-section pdf-contact-block" id="contact">
      <div className="pdf-contact-heading">
        {kicker ? <p className="pdf-kicker">{kicker}</p> : null}
        <h2 style={textStyleProps(headingStyle)}>{multiline(heading)}</h2>
      </div>
      <div className="pdf-contact-copy">
        <p style={textStyleProps(bodyStyle)}>{multiline(text)}</p>
        {ctaVisible && ctaLabel ? <Link href={localeHref(ctaUrl || "/contact#experience-center", locale)}>{ctaLabel} <span className="pdf-contact-arrow" aria-hidden="true">→</span></Link> : null}
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
export function HomeExperienceGallery({ images, captions, locale }: { images?: string[]; captions?: string[]; locale: Locale }) {
  const panels: GalleryPanel[] = images?.length === 5
    ? images.map((image, index) => ({ key: `cms-${index + 1}`, image, caption: captions?.[index]?.trim() ?? "" }))
    : [];
  if (!panels.length) return null;
  const total = String(panels.length).padStart(2, "0");
  return (
    <section className="pdf-section pdf-vertical-gallery pdf-gallery-flex" id="experience-center" aria-label={t(locale, "home.gallery")} data-gallery-flex>
      {panels.map((panel, index) => (
        <button className="pdf-gallery-panel" type="button" data-gallery-panel={panel.key} data-lightbox-src={panel.image} data-lightbox-caption={panel.caption} key={panel.key}>
          <img src={panel.image} alt={panel.caption} />
          <span className="pdf-gallery-index" aria-hidden="true">{String(index + 1).padStart(2, "0")} / {total}</span>
          <span className="pdf-gallery-lab" aria-hidden="true">
            <span>{panel.caption}</span>
            <span>{t(locale, "home.view")}</span>
          </span>
        </button>
      ))}
    </section>
  );
}

/// The homepage <main>: CMS content is authoritative. The delivered static
/// tail only supplies structural markup; editable text is replaced above.
export function HomeMain({ settings, staticTail, developmentCards, hidden, newsArticles = [], locale }: { settings: HomeSettings; staticTail: string; developmentCards: DevelopmentCard[]; hidden?: readonly string[]; newsArticles?: readonly NewsListItem[]; locale: Locale }) {
  /// Sections the editor switched off under "Sections on this page".
  const shown = sectionFilter(hidden);
  /// The editor's links follow the page's language; other addresses are left alone.
  const href = (path: string) => localeHref(path, locale);
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
  const hero = resolveHeroMedia(settings);
  const heroMedia = hero.video || hero.image;
  /// The page headline renders in the hero; empty-string CMS values override
  /// the defaults, undefined falls back to them.
  const heroHeading = settings.introHeading ?? "";
  const headingInHero = Boolean(heroMedia && heroHeading.trim());
  const heroText = settings.heroText ?? homeDefaults.heroText;
  const heroCtaLabel = settings.heroCtaLabel ?? homeDefaults.heroCtaLabel;
  const heroCtaUrl = href(settings.heroCtaUrl ?? homeDefaults.heroCtaUrl);
  return (
    <main className="development-pdf-home" id="top">
      {shown("hero") && heroMedia ? <HomeHero video={hero.video} image={hero.image} heading={heroHeading} text={heroText} ctaLabel={heroCtaLabel} ctaUrl={heroCtaUrl} headingStyle={settings.introHeadingStyle} locale={locale} /> : null}
      {shown("intro") && hasIntroduction ? <HomeIntro heading={headingInHero && shown("hero") ? "" : heroHeading} paragraphs={introParagraphs} headingStyle={settings.introHeadingStyle} bodyStyle={settings.introBodyStyle} kicker={introKicker} values={introValues} locale={locale} /> : null}
      {shown("numbers") && hasNumbers ? <HomeNumbers kicker={settings.statsKicker ?? homeDefaults.statsKicker} stats={introStats} note={settings.statsNote ?? ""} noteUrl={settings.statsNoteUrl ? href(settings.statsNoteUrl) : undefined} valueStyle={settings.statsValueStyle} labelStyle={settings.statsLabelStyle} locale={locale} /> : null}
      {!shown("developments") ? null : bannerSlides.length ? <HomeDevelopmentSlider heading={settings.developmentHeading ?? ""} bannerText={settings.developmentBannerText === undefined ? homeDefaults.developmentBannerText : settings.developmentBannerText} slides={bannerSlides} ctaLabel={settings.developmentCtaLabel || t(locale, "nav.viewAllDevelopments")} ctaUrl={settings.developmentCtaUrl ? href(settings.developmentCtaUrl) : undefined} ctaVisible={settings.developmentCtaVisible !== false} headingStyle={textStyleProps(settings.developmentHeadingStyle)} kicker={settings.developmentKicker ?? homeDefaults.developmentKicker} caption={settings.developmentText} captionVisible={settings.developmentTextVisible === true} captionPosition={settings.developmentTextPosition === "above" ? "above" : "below"} captionStyle={textStyleProps(settings.developmentTextStyle)} locale={locale} /> : settings.developmentTextVisible && settings.developmentText?.trim() ? <HomeDevelopmentText text={settings.developmentText} bodyStyle={settings.developmentTextStyle} position={settings.developmentTextPosition === "above" ? "above" : "below"} locale={locale} /> : null}
      {shown("cards") ? <HomeDevelopmentCards cards={developmentCards.map((card) => ({ ...card, href: href(card.href) }))} ctaLabel={settings.cardCtaLabel || t(locale, "home.cardCta")} ctaVisible={settings.cardCtaVisible !== false} locale={locale} /> : null}
      {shown("contact") && hasContact ? <HomeContactBlock heading={settings.contactHeading ?? ""} text={settings.contactText ?? ""} ctaLabel={settings.contactCtaLabel || t(locale, "home.contactCta")} ctaUrl={settings.contactCtaUrl || undefined} ctaVisible={settings.contactCtaVisible !== false} headingStyle={settings.contactHeadingStyle} bodyStyle={settings.contactBodyStyle} kicker={settings.contactKicker ?? homeDefaults.contactKicker} locale={locale} /> : null}
      {shown("gallery") ? <HomeExperienceGallery images={experienceImages.filter(Boolean)} captions={experienceCaptions} locale={locale} /> : null}
      {/* The tail is one block of HTML (delivered bands, the news CTA and cards): its links are localised in one pass. */}
      <div className="pdf-static-tail" dangerouslySetInnerHTML={{ __html: localizeHtmlLinks(htmlLf(shown("news") ? withHomeNewsHeader(staticTail, settings, newsArticles, locale) : withoutHomeNews(staticTail)), locale) }} />
    </main>
  );
}
