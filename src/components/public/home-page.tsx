import type { ReactNode } from "react";
import Link from "next/link";
import { htmlLf } from "@/lib/html-lf";
import { homeDefaults, type BannerSlide, type DevelopmentCard, type GalleryPanel, type HomeSettings, type StatItem } from "@/lib/home-defaults";

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
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

export function HomeDevelopmentBanner({ heading, slides }: { heading: string; slides: BannerSlide[] }) {
  return (
    <section className="pdf-section pdf-development-banner" id="developments" data-development-slider>
      <div className="pdf-development-slides" aria-hidden="true">
        {slides.map((slide, index) => (
          <div className={`pdf-development-slide${index === 0 ? " active" : ""}`} key={`${slide.image}-${index}`}><img src={slide.image} alt="" /></div>
        ))}
      </div>
      <div className="pdf-development-content">
        <h2>{heading}</h2>
        <Link className="pdf-development-button btn-pill text-white" href="/#development-cards">Explore</Link>
        <div className="pdf-development-dots" aria-label="Development slides">
          {slides.map((slide, index) => (
            <button className={index === 0 ? "active" : undefined} type="button" data-development-dot={index} aria-label={`Show ${slide.label}`} key={`${slide.label}-${index}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeDevelopmentCards({ cards }: { cards: DevelopmentCard[] }) {
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
        <Link href="/contact#experience-center">Plan Visit</Link>
      </div>
    </section>
  );
}

/// The delivered gallery uses exactly five panels; the CMS editor enforces the
/// same count, so CMS images replace all five together.
export function HomeExperienceGallery({ images }: { images?: string[] }) {
  const panels: GalleryPanel[] = images?.length === 5
    ? images.map((image, index) => ({ key: `cms-${index + 1}`, image, caption: `Experience Center image ${index + 1}` }))
    : homeDefaults.galleryPanels;
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

/// The homepage <main>: CMS-managed sections render as React; the delivered
/// static tail (events, sunset band, live news, and the hidden legacy bands)
/// rides through unchanged inside a wrapper div.
export function HomeMain({ settings, staticTail }: { settings: HomeSettings; staticTail: string }) {
  return (
    <main className="development-pdf-home" id="top">
      <HomeHero video={settings.heroVideo || homeDefaults.heroVideo} />
      <HomeIntro
        heading={settings.introHeading || homeDefaults.introHeading}
        paragraphs={settings.introParagraphs?.filter(Boolean).length ? settings.introParagraphs.filter(Boolean) : homeDefaults.introParagraphs}
        stats={settings.introStats?.length ? settings.introStats : homeDefaults.introStats}
        statsNote={settings.statsNote ?? homeDefaults.statsNote}
      />
      <HomeDevelopmentBanner heading={settings.developmentHeading || homeDefaults.developmentHeading} slides={settings.bannerSlides?.length ? settings.bannerSlides : homeDefaults.bannerSlides} />
      <HomeDevelopmentCards cards={settings.developmentCards?.length ? settings.developmentCards : homeDefaults.developmentCards} />
      <HomeContactBlock
        heading={settings.contactHeading || homeDefaults.contactHeading}
        text={settings.contactText || homeDefaults.contactText}
      />
      <HomeExperienceGallery images={(settings.experienceImages ?? []).filter(Boolean)} />
      <div className="pdf-static-tail" dangerouslySetInnerHTML={{ __html: htmlLf(staticTail) }} />
    </main>
  );
}
