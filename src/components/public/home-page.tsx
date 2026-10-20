import type { ReactNode } from "react";
import Link from "next/link";
import { htmlLf } from "@/lib/html-lf";
import { type DevelopmentCard, type GalleryPanel, type HomeSettings, type StatItem } from "@/lib/home-defaults";
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
  const cta = settings.newsCta?.trim() ?? "";
  /// Replace delivered editable text even when the CMS value is blank, so old
  /// copy can never reappear as a fallback.
  const section = heading || text || cta
    ? `<section class="pdf-section pdf-events-head" id="events">${heading ? `<h2>${escapeHtml(heading)}</h2>` : ""}<div>${text ? `<p>${escapeHtml(text).replaceAll("\n", "<br>")}</p>` : ""}${cta ? `<a href="#news">${escapeHtml(cta)}</a>` : ""}</div></section>`
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

export function HomeIntro({ heading, paragraphs, stats, statsNote }: { heading: string; paragraphs: string[]; stats: StatItem[]; statsNote: string }) {
  return (
    <section className="pdf-section pdf-intro" id="about">
      <div className="pdf-intro-grid">
        <h1>{multiline(heading)}</h1>
        <div className="pdf-intro-copy">
          {paragraphs.map((paragraph, index) => <p key={index}>{multiline(paragraph)}</p>)}
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

export function HomeDevelopmentText({ text }: { text: string }) {
  return <section className="pdf-section pdf-development-text" aria-label="Our development standard"><p>{multiline(text)}</p></section>;
}

export function HomeDevelopmentCards({ cards }: { cards: DevelopmentCard[] }) {
  if (!cards.length) return null;
  return (
    <section className="pdf-section pdf-development-cards" id="development-cards" aria-label="Our developments">
      {cards.map((card, index) => (
        <a className="pdf-dev-card" href={card.href} key={`${card.href}-${index}`}>
          <img src={card.image} alt={card.title} />
          <div className="pdf-dev-card-body">
            <h3>{card.title}</h3>
            <p>{card.copy}</p>
            <span>Explore</span>
          </div>
        </a>
      ))}
    </section>
  );
}

export function HomeContactBlock({ heading, text }: { heading: string; text: string }) {
  return (
    <section className="pdf-section pdf-contact-block" id="contact">
      <div><h2>{multiline(heading)}</h2></div>
      <div className="pdf-contact-copy">
        <p>{multiline(text)}</p>
        <Link href="/contact#experience-center">Book a visit</Link>
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
export function HomeMain({ settings, staticTail }: { settings: HomeSettings; staticTail: string }) {
  const introParagraphs = settings.introParagraphs?.filter(Boolean) ?? [];
  const introStats = settings.introStats ?? [];
  const bannerSlides = settings.bannerSlides ?? [];
  const developmentCards = settings.developmentCards ?? [];
  const hasIntroduction = Boolean(settings.introHeading?.trim() || introParagraphs.length || introStats.length || settings.statsNote?.trim());
  const hasContact = Boolean(settings.contactHeading?.trim() || settings.contactText?.trim());
  return (
    <main className="development-pdf-home" id="top">
      {settings.heroVideo?.trim() ? <HomeHero video={settings.heroVideo} /> : null}
      {hasIntroduction ? <HomeIntro heading={settings.introHeading ?? ""} paragraphs={introParagraphs} stats={introStats} statsNote={settings.statsNote ?? ""} /> : null}
      {bannerSlides.length ? <HomeDevelopmentSlider heading={settings.developmentHeading ?? ""} slides={bannerSlides} /> : null}
      {settings.developmentTextVisible && settings.developmentText?.trim() ? <HomeDevelopmentText text={settings.developmentText} /> : null}
      <HomeDevelopmentCards cards={developmentCards} />
      {hasContact ? <HomeContactBlock heading={settings.contactHeading ?? ""} text={settings.contactText ?? ""} /> : null}
      <HomeExperienceGallery images={settings.experienceImages?.filter(Boolean)} captions={settings.experienceCaptions} />
      <div className="pdf-static-tail" dangerouslySetInnerHTML={{ __html: htmlLf(withHomeNewsHeader(staticTail, settings)) }} />
    </main>
  );
}
